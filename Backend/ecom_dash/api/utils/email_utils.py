"""
Email helpers for order lifecycle notifications.
Builds simple plaintext emails so customers can read order details easily.
"""
from __future__ import annotations

from decimal import Decimal
from typing import Iterable
from io import BytesIO

from django.conf import settings
from django.core.mail import EmailMessage, send_mail
from django.utils import timezone

from api.models import Order


STATUS_SUBJECTS = {
    "pending": "We received your order",
    "accepted": "Your order has been accepted",
    "dispatched": "Your order is on the way",
    "delivered": "Your order has been delivered",
    "completed": "Your order is complete",
    "cancelled": "Your order was cancelled",
    "rejected": "Your order was rejected",
}

STATUS_INTROS = {
    "pending": "Thanks for shopping with us! We have received your order.",
    "accepted": "Good news - your order was accepted and is being prepared.",
    "dispatched": "Your order has been dispatched and is on its way.",
    "delivered": "Your order has been delivered. We hope you love it!",
    "completed": "Your order is complete. Thanks for choosing us!",
    "cancelled": "Your order was cancelled. If this is unexpected, please contact support.",
    "rejected": "We could not process your order. If you need help, reach out to support.",
}


def _fmt_money(value: Decimal | float | int | None) -> str:
    """Format money in INR with two decimals using ASCII only."""
    try:
        val = Decimal(value).quantize(Decimal("0.01"))
        return f"Rs. {val:,.2f}"
    except Exception:
        return str(value or "0.00")


def _format_items(items: Iterable) -> str:
    lines = []
    for item in items:
        qty = getattr(item, "quantity", None) or 0
        price = getattr(item, "price", None) or 0
        name = getattr(item, "name", None) or getattr(item, "sku", None) or "Item"
        line_total = (Decimal(price) if price is not None else Decimal("0")) * (
            Decimal(qty) if qty is not None else Decimal("0")
        )
        lines.append(f"* {name} x{qty} @ {_fmt_money(price)} = {_fmt_money(line_total)}")
    return "\n".join(lines) if lines else "No items were found on this order."


def _format_address(order: Order) -> str:
    parts = [
        order.address_line1,
        order.address_line2,
        order.city,
        order.state,
        order.pincode,
    ]
    parts = [p for p in parts if p]
    return "\n".join(parts) if parts else "No address on file."


def _derive_charges(order: Order):
    """
    Derive subtotal, gst amount, delivery amount, and gst percent from order items
    when explicit charge fields are missing. This protects against 0.00 values
    in emails when the frontend only sent a precomputed total.
    """
    from decimal import Decimal as D

    subtotal = D("0")
    gst_amount = D("0")
    delivery_amount = D("0")
    try:
        for item in order.items.all():
            name = (getattr(item, "name", "") or "").strip().lower()
            price = getattr(item, "price", 0) or 0
            qty = getattr(item, "quantity", 0) or 0
            line_total = D(str(price)) * D(str(qty))
            if name in ("gst", "gst charge", "tax", "taxes", "igst", "cgst", "sgst"):
                gst_amount += line_total
                continue
            if name in (
                "delivery",
                "delivery charge",
                "delivery charges",
                "shipping",
                "shipping charge",
                "shipping charges",
            ):
                delivery_amount += line_total
                continue
            subtotal += line_total
    except Exception:
        pass

    gst_percent = None
    if subtotal > 0 and gst_amount > 0:
        try:
            gst_percent = (gst_amount / subtotal) * D("100")
        except Exception:
            gst_percent = None

    return subtotal, gst_amount, delivery_amount, gst_percent


def _build_invoice_pdf(order: Order, *, subtotal: Decimal, gst: Decimal, delivery: Decimal, total: Decimal, address: str) -> bytes:
    """
    Generate a simple one-page invoice PDF using Pillow (already installed).
    Keeps dependencies minimal and avoids external binaries.
    """
    try:
        from PIL import Image, ImageDraw, ImageFont
    except Exception:
        return b""

    width, height = 800, 1100
    img = Image.new("RGB", (width, height), color="white")
    draw = ImageDraw.Draw(img)
    font = ImageFont.load_default()

    y = 40
    line_height = 24

    def write_line(text: str, bold: bool = False):
        nonlocal y
        draw.text((40, y), text, fill="black", font=font)
        y += line_height

    write_line("Invoice", bold=True)
    write_line(f"Order ID: #{order.id}")
    write_line(f"Date: {timezone.localtime(order.updated_at).strftime('%d %b %Y, %I:%M %p')}")
    write_line(f"Payment Method: {getattr(order, 'payment_method', '') or 'N/A'}")
    write_line("")
    write_line("Bill To:")
    for line in address.splitlines():
        write_line(line)
    write_line("")
    write_line("Items:")
    for item in order.items.all():
        line_total = Decimal(str(getattr(item, "price", 0) or 0)) * Decimal(str(getattr(item, "quantity", 0) or 0))
        write_line(
            f"- {getattr(item, 'name', 'Item')} x{getattr(item, 'quantity', 0)} @ {_fmt_money(getattr(item, 'price', 0))} = {_fmt_money(line_total)}"
        )

    write_line("")
    write_line("Summary:")
    write_line(f"Subtotal: {_fmt_money(subtotal)}")
    write_line(f"GST: {_fmt_money(gst)}")
    write_line(f"Delivery: {_fmt_money(delivery)}")
    write_line(f"Total: {_fmt_money(total)}")

    buffer = BytesIO()
    try:
        img.save(buffer, format="PDF")
        buffer.seek(0)
        return buffer.read()
    except Exception:
        return b""


def send_order_status_email(order: Order, *, force: bool = False, previous_status: str | None = None) -> bool:
    """
    Send a customer-facing status email with order line items and totals.
    Will skip if no customer email is available.
    Returns True when the send succeeds, False otherwise.
    """
    email = getattr(order.customer, "email", None)
    if not email:
        return False

    status_key = (order.status or "").lower()
    subject = STATUS_SUBJECTS.get(status_key, f"Update for your order #{order.id}")
    intro = STATUS_INTROS.get(status_key, "Here is the latest update on your order.")

    items_block = _format_items(order.items.all())
    address_block = _format_address(order)

    # Prefer stored fields; fall back to derivation from items and total gaps to avoid 0.00 displays.
    subtotal, derived_gst_amount, derived_delivery, derived_gst_percent = _derive_charges(order)

    def _dec(val):
        try:
            return Decimal(str(val))
        except Exception:
            return Decimal("0")

    # Total
    total_val = order.total_amount
    if total_val in (None, "", 0, 0.0, Decimal("0")):
        total_val = subtotal + derived_delivery + derived_gst_amount
    total_val = _dec(total_val)

    # Delivery
    delivery_val = order.delivery_charge
    delivery_val = derived_delivery if delivery_val in (None, "", Decimal("0"), 0, 0.0) else delivery_val
    delivery_val = _dec(delivery_val)

    # GST percent and amount
    gst_percent_val = getattr(order, "gst_percent", None)
    gst_percent_val = derived_gst_percent if gst_percent_val in (None, "", 0, 0.0, Decimal("0")) else gst_percent_val
    gst_amount_val = derived_gst_amount if derived_gst_amount not in (None, "", 0, 0.0, Decimal("0")) else Decimal("0")
    if gst_amount_val == 0 and gst_percent_val not in (None, "", 0, 0.0, Decimal("0")) and subtotal > 0:
        gst_amount_val = (_dec(subtotal) * _dec(gst_percent_val)) / Decimal("100")

    # Final reconciliation with total: assign any remaining gap first to GST, then to delivery
    try:
        residual = total_val - _dec(subtotal) - delivery_val - gst_amount_val
        if residual > 0 and gst_amount_val in (None, "", Decimal("0"), 0, 0.0):
            gst_amount_val = residual
            residual = Decimal("0")
        if residual > 0 and delivery_val in (None, "", Decimal("0"), 0, 0.0):
            delivery_val += residual
    except Exception:
        pass

    if isinstance(gst_amount_val, Decimal):
        gst_amount_val = gst_amount_val.quantize(Decimal("0.01"))

    total_amount = _fmt_money(total_val)
    delivery = _fmt_money(delivery_val)
    gst = _fmt_money(gst_amount_val)

    timestamp = timezone.localtime(order.updated_at).strftime("%d %b %Y, %I:%M %p")

    body = (
        f"{intro}\n\n"
        f"Order ID: #{order.id}\n"
        f"Current Status: {status_key or 'unknown'}\n"
        f"Updated At: {timestamp}\n"
        f"Payment Method: {getattr(order, 'payment_method', '') or 'N/A'}\n\n"
        f"Items:\n{items_block}\n\n"
        f"Charges:\n"
        f"  * GST: {gst}\n"
        f"  * Delivery: {delivery}\n"
        f"Total Payable: {total_amount}\n\n"
        f"Shipping Address:\n{address_block}\n\n"
        "If you have any questions, reply to this email and we'll help you out."
    )

    try:
        email_msg = EmailMessage(
            subject=subject,
            body=body,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None) or getattr(settings, "EMAIL_HOST_USER", None),
            to=[email],
        )
        email_msg.send(fail_silently=False)
        return True
    except Exception:
        return False
