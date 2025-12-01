import type { CartItem, Product } from '../types';

export const formatInr = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);

export const getUnitPrice = (product: Product) => {
  const selling = (product as any).selling_price ?? (product as any).sellingPrice;
  if (selling !== undefined && selling !== null && Number(selling) > 0) {
    return Number(selling);
  }
  const mrp = (product as any).mrp;
  if (mrp !== undefined && mrp !== null && Number(mrp) > 0) {
    return Number(mrp);
  }
  return Number((product as any).price) || 0;
};

export const getMrp = (product: Product) => {
  const mrp = (product as any).mrp ?? (product as any).originalPrice ?? (product as any).price ?? 0;
  return Number(mrp) || 0;
};

export const getDiscountPercent = (selling: number, mrp: number) => {
  if (!mrp || mrp <= 0 || selling <= 0) return 0;
  return Math.max(0, Math.round((1 - selling / mrp) * 100));
};

export const getBestAvailableDiscountPercent = (product: Product): number => {
  if (!product) return 0;

  // Prefer selling price; fall back to MRP so flat coupons can still be evaluated
  const selling = toNumber((product as any).price ?? (product as any).selling_price ?? (product as any).sellingPrice) ?? 0;
  const mrp = toNumber((product as any).originalPrice ?? (product as any).mrp) ?? 0;

  const baseDiscount = selling > 0 && mrp > selling ? getDiscountPercent(selling, mrp) : 0;

  const discounts = Array.isArray((product as any).discounts) ? (product as any).discounts : [];
  const priceForFlat = selling > 0 ? selling : mrp; // avoid divide-by-zero for flat coupons

  const bestCouponDiscount = discounts.reduce((best, d: any) => {
    if (!d) return best;
    const rawValue = toNumber(d.value);
    if (!rawValue || rawValue <= 0) return best;
    if (d.type === 'percentage') {
      return Math.max(best, rawValue);
    }
    if (priceForFlat > 0) {
      const flatAsPercent = (rawValue / priceForFlat) * 100;
      return Math.max(best, flatAsPercent);
    }
    return best;
  }, 0);

  const effective = Math.max(baseDiscount, bestCouponDiscount);
  if (!Number.isFinite(effective) || effective < 0) return 0;
  return Math.min(100, Math.round(effective * 100) / 100); // keep two decimals to avoid float noise
};

const toNumber = (value: any): number | null => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? Number(value) : null;
  if (typeof value === 'string') {
    const match = value.match(/-?\d+(\.\d+)?/);
    if (!match) return null;
    const parsed = parseFloat(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const getProductGstPercent = (product: Product): number => {
  const raw = (product as any).gst ?? (product as any).gst_percent ?? (product as any).gstPercent;
  const parsed = toNumber(raw);
  if (parsed === null) return 0;
  if (parsed > 0 && parsed < 1) return parsed * 100; // Accept decimal fractions (e.g., 0.03 -> 3%)
  return parsed;
};

export const getProductShippingCharge = (product: Product): number => {
  const raw = (product as any).delivery_charges ?? (product as any).deliveryCharges;
  const parsed = toNumber(raw);
  if (parsed === null || parsed < 0) return 0;
  return parsed;
};

const roundTwo = (val: number) => Math.round((Number.isFinite(val) ? val : 0) * 100) / 100;

export interface CartTotals {
  subtotal: number;
  gstAmount: number;
  shippingTotal: number;
  total: number;
  effectiveGstPercent: number;
  gstPercentsUsed: number[];
}

export const calculateCartTotals = (items: CartItem[]): CartTotals => {
  const base = (items || []).reduce(
    (acc, item) => {
      if (!item || !item.product) return acc;

      const unitPrice = getUnitPrice(item.product);
      const lineSubtotal = unitPrice * item.quantity;
      const gstPercent = getProductGstPercent(item.product);
      const lineGst = lineSubtotal * (gstPercent / 100);
      const shipping = getProductShippingCharge(item.product) * item.quantity;

      acc.subtotal += lineSubtotal;
      acc.gstAmount += lineGst;
      acc.shippingTotal += shipping;
      if (gstPercent > 0) {
        acc.gstPercents.push(gstPercent);
      }
      return acc;
    },
    { subtotal: 0, gstAmount: 0, shippingTotal: 0, gstPercents: [] as number[] }
  );

  const effectiveGstPercent = base.subtotal > 0 ? (base.gstAmount / base.subtotal) * 100 : 0;
  const gstPercentsUsed = Array.from(new Set(base.gstPercents.map((p) => Number(p.toFixed(2)))));

  return {
    subtotal: roundTwo(base.subtotal),
    gstAmount: roundTwo(base.gstAmount),
    shippingTotal: roundTwo(base.shippingTotal),
    total: roundTwo(base.subtotal + base.gstAmount + base.shippingTotal),
    effectiveGstPercent: roundTwo(effectiveGstPercent),
    gstPercentsUsed,
  };
};
