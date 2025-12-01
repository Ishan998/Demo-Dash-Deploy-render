import React, { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Order } from "../types";

interface BusinessInfo {
  name: string;
  logoUrl?: string;
  tagline?: string;
  address: string;
  gst?: string;
  email?: string;
  phone?: string;
}

interface InvoiceTemplateProps {
  order: Order;
  business: BusinessInfo;
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ order, business }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const orderDate = order.date ? new Date(order.date) : new Date();

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;

    const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save(`Invoice-${order.id}.pdf`);
  };

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = Number(order.deliveryCharge ?? 0) || 0;
  const gstRate = Number(order.gstPercent ?? 0) || 0;
  const computedGst = gstRate > 0 ? subtotal * (gstRate / 100) : 0;
  // If backend sent a total amount, trust it; otherwise derive.
  const total = Number.isFinite(order.amount) ? Number(order.amount) : subtotal + computedGst + delivery;
  // If gst rate not provided, backfill gst by difference to keep totals aligned.
  const gstAmount = gstRate > 0 ? computedGst : Math.max(total - subtotal - delivery, 0);
  const fmtMoney = (val: number) => `Rs. ${val.toFixed(2)}`;

  // Resolve address from normalized object or any raw fields that may be present.
  const resolveAddress = () => {
    const anyOrder = order as any;
    const line1 = order.address?.line1 || anyOrder.address_line1 || anyOrder.addressLine1 || anyOrder.address1 || "";
    const line2 = order.address?.line2 || anyOrder.address_line2 || anyOrder.addressLine2 || anyOrder.address2 || "";
    const city = order.address?.city || anyOrder.city || anyOrder.addressCity || "";
    const state = order.address?.state || anyOrder.state || anyOrder.addressState || "";
    const pincode = order.address?.pincode || anyOrder.pincode || anyOrder.addressPincode || "";

    if (line1 || line2 || city || state || pincode) {
      return { line1, line2, city, state, pincode };
    }
    return {
      line1: "Address not provided",
      line2: "",
      city: "",
      state: "",
      pincode: "",
    };
  };
  const safeAddress = resolveAddress();

  return (
    <div className="flex flex-col items-center py-8 bg-gray-50 min-h-screen">
      <div
        ref={invoiceRef}
        className="bg-white w-[800px] p-10 shadow-lg text-gray-800 font-sans"
        style={{ fontSize: "14px", lineHeight: "1.6" }}
      >
        {/* Header */}
        <div className="text-center mb-10">
          {business.logoUrl && (
            <img
              src={business.logoUrl}
              alt={business.name}
              className="mx-auto mb-3"
              style={{ height: "60px" }}
            />
          )}
          <h2 className="text-2xl font-semibold">{business.name}</h2>
          {business.tagline && <p className="text-gray-500 italic">{business.tagline}</p>}
        </div>

        {/* Top Info Section */}
        <div className="flex justify-between mb-6">
          <div>
            <h4 className="font-semibold uppercase tracking-wide text-gray-600">Delivery Address</h4>
            <p>{order.customerName}</p>
            <p>{order.customerEmail}</p>
            <p>{safeAddress.line1}</p>
            {safeAddress.line2 && <p>{safeAddress.line2}</p>}
            <p>
              {safeAddress.city}
              {safeAddress.city && (safeAddress.state || safeAddress.pincode) ? ", " : ""}
              {safeAddress.state} {safeAddress.pincode}
            </p>
          </div>

          <div className="text-right">
            <h4 className="font-semibold uppercase tracking-wide text-gray-600">Invoice No:</h4>
            <p>{String(order.id).padStart(5, "0")}</p>
            <p>
              <strong>Date:</strong> {orderDate.toLocaleDateString("en-IN")}
            </p>
          </div>
        </div>

        {/* Table */}
        <table className="w-full border-collapse mb-8">
          <thead>
            <tr className="bg-gray-100 text-gray-700 uppercase text-sm">
              <th className="border-b p-3 text-left">Description</th>
              <th className="border-b p-3 text-right">Unit Price</th>
              <th className="border-b p-3 text-right">Qty</th>
              <th className="border-b p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="border-b p-3">{item.name}</td>
                <td className="border-b p-3 text-right">{fmtMoney(item.price)}</td>
                <td className="border-b p-3 text-right">{item.quantity}</td>
                <td className="border-b p-3 text-right">{fmtMoney(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end text-sm mb-10">
          <table className="text-right w-1/3">
            <tbody>
              <tr>
                <td className="py-1">Subtotal:</td>
                <td className="py-1">{fmtMoney(subtotal)}</td>
              </tr>
              <tr>
                <td className="py-1">GST {gstRate > 0 ? `(${gstRate}%)` : ""}</td>
                <td className="py-1">{fmtMoney(gstAmount)}</td>
              </tr>
              {delivery > 0 && (
                <tr>
                  <td className="py-1">Delivery</td>
                  <td className="py-1">{fmtMoney(delivery)}</td>
                </tr>
              )}
              <tr className="font-semibold text-base">
                <td className="py-1 border-t">Total:</td>
                <td className="py-1 border-t">{fmtMoney(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-between text-sm mt-8">
          <div>
            <strong>Business Address:</strong>
            <p>{business.address}</p>
          </div>
          <div className="text-right font-semibold">Thank You</div>
        </div>
      </div>

      <button
        onClick={handleDownloadPDF}
        className="mt-6 bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition"
      >
        Download Invoice PDF
      </button>
    </div>
  );
};

export default InvoiceTemplate;
