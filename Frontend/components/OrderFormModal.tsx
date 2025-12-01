
// import React, { useState, useMemo, useEffect } from 'react';
// import { Product, ProductItem, OrderStatus, ProductVariant } from '../types';
// import { formatCurrency } from '../constants';


// interface OrderFormModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSave: (customerName: string, items: ProductItem[], status: OrderStatus) => void;
//   allProducts: Product[];
// }

// interface SelectableProduct {
//     id: string; // "p-1" for base product, "v-101" for variant
//     name: string;
//     price: number;
//     sku: string;
//     stock: number;
// }

// const OrderFormModal: React.FC<OrderFormModalProps> = ({ isOpen, onClose, onSave, allProducts }) => {
//   const [customerName, setCustomerName] = useState('');
//   const [status, setStatus] = useState<OrderStatus>(OrderStatus.Pending);
//   const [items, setItems] = useState<ProductItem[]>([]);
//   const [productSearchTerm, setProductSearchTerm] = useState('');
  
//   // Flatten products and variants into a single list for searching
//   const selectableProducts = useMemo<SelectableProduct[]>(() => {
//     return allProducts.flatMap(p => {
//         const productList: SelectableProduct[] = [];
//         if (p.variants && p.variants.length > 0) {
//             p.variants.forEach(v => {
//                 productList.push({
//                     id: `v-${v.id}`,
//                     name: `${p.name} - ${v.name}`,
//                     price: v.sellingPrice,
//                     sku: v.sku,
//                     stock: v.stock
//                 });
//             });
//         } else {
//              productList.push({
//                 id: `p-${p.id}`,
//                 name: p.name,
//                 price: p.sellingPrice,
//                 sku: p.sku,
//                 stock: p.stock
//             });
//         }
//         return productList;
//     });
//   }, [allProducts]);
  
//   const searchResults = useMemo(() => {
//     if (!productSearchTerm) return [];
//     const lowerCaseSearchTerm = productSearchTerm.toLowerCase();
//     // Exclude items already in the order
//     const currentItemIds = items.map(item => item.id);
//     return selectableProducts.filter(p => 
//         !currentItemIds.includes(p.id) &&
//         (p.name.toLowerCase().includes(lowerCaseSearchTerm) || p.sku.toLowerCase().includes(lowerCaseSearchTerm))
//     ).slice(0, 5);
//   }, [productSearchTerm, selectableProducts, items]);

//   const addProductToOrder = (product: SelectableProduct) => {
//     setItems(prev => [...prev, {
//         id: product.id,
//         name: product.name,
//         quantity: 1,
//         price: product.price
//     }]);
//     setProductSearchTerm('');
//   };

//   const updateItemQuantity = (id: string, quantity: number) => {
//     setItems(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item));
//   };
  
//   const removeItem = (id: string) => {
//     setItems(prev => prev.filter(item => item.id !== id));
//   };

//   const totalAmount = useMemo(() => {
//     return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
//   }, [items]);
  
//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!customerName || items.length === 0) {
//         alert("Please provide a customer name and add at least one product.");
//         return;
//     }
//     onSave(customerName, items, status);
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
//       <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
//         <form onSubmit={handleSubmit} className="flex flex-col h-full">
//           <header className="flex items-center justify-between p-4 border-b border-gray-200">
//             <h2 className="text-xl font-bold text-text-primary">Create New Order</h2>
//             <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
//             </button>
//           </header>

//           <main className="p-6 flex-1 overflow-y-auto space-y-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                     <label className="block text-sm font-medium text-gray-700">Customer Name</label>
//                     <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
//                 </div>
//                 <div>
//                     <label className="block text-sm font-medium text-gray-700">Order Status</label>
//                     <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
//                         {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
//                     </select>
//                 </div>
//             </div>

//             <div className="border-t pt-4">
//                 <h3 className="text-md font-semibold text-gray-900 mb-2">Order Items</h3>
//                 <div className="relative">
//                     <input 
//                         type="text" 
//                         placeholder="Search for products to add..." 
//                         value={productSearchTerm}
//                         onChange={(e) => setProductSearchTerm(e.target.value)}
//                         className="w-full border-gray-300 rounded-md shadow-sm"
//                     />
//                     {searchResults.length > 0 && (
//                         <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
//                             {searchResults.map(product => (
//                                 <li key={product.id} onClick={() => addProductToOrder(product)} className="p-3 hover:bg-gray-100 cursor-pointer">
//                                     <p className="font-semibold">{product.name}</p>
//                                     <p className="text-sm text-gray-500">{product.sku} - {formatCurrency(product.price)} - Stock: {product.stock}</p>
//                                 </li>
//                             ))}
//                         </ul>
//                     )}
//                 </div>

//                 <div className="mt-4 space-y-2 max-h-80 overflow-y-auto pr-2">
//                     {items.map(item => (
//                         <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
//                             <div className="flex-grow">
//                                 <p className="font-semibold">{item.name}</p>
//                                 <p className="text-sm text-gray-500">{formatCurrency(item.price)}</p>
//                             </div>
//                             <div className="flex items-center space-x-2">
//                                 <input 
//                                     type="number" 
//                                     value={item.quantity} 
//                                     onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value, 10))}
//                                     className="w-16 text-center border-gray-300 rounded-md"
//                                     min="1"
//                                 />
//                                 <span className="w-24 text-right font-semibold">{formatCurrency(item.price * item.quantity)}</span>
//                                 <button type="button" onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full">&times;</button>
//                             </div>
//                         </div>
//                     ))}
//                     {items.length === 0 && (
//                         <p className="text-center text-gray-500 py-4">No products added to this order yet.</p>
//                     )}
//                 </div>

//                 <div className="flex justify-end mt-4 pt-4 border-t">
//                     <div className="text-right">
//                         <p className="text-sm text-gray-500">Total Amount</p>
//                         <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
//                     </div>
//                 </div>
//             </div>
//           </main>

//           <footer className="flex items-center justify-end p-4 border-t border-gray-200 space-x-4 bg-gray-50">
//             <button type="button" onClick={onClose} className="text-text-secondary font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 transition">
//               Cancel
//             </button>
//             <button type="submit" className="bg-primary text-white font-semibold py-2 px-6 rounded-lg hover:bg-opacity-90 transition">
//               Create Order
//             </button>
//           </footer>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default OrderFormModal;
import React, { useState, useMemo } from 'react';
import { Product, ProductItem, OrderStatus } from '../types';
import { formatCurrency } from '../constants';

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    customer: { name: string; email: string; phone: string },
    items: ProductItem[],
    status: OrderStatus,
    paymentMethod: string,
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pincode: string;
    }
  ) => void;
  allProducts: Product[];
  initialData?: {
    customer: { name: string; email: string; phone: string };
    items: ProductItem[];
    status: OrderStatus;
    paymentMethod: string;
    address: { line1: string; line2?: string; city: string; state: string; pincode: string };
  };
  isEditing?: boolean;
  onDelete?: () => void;
}

interface SelectableProduct {
  id: string;
  name: string;   // internal item name (e.g., "Rerdd")
  label?: string; // display label in dropdown (e.g., "Rerdd (Test 1)")
  price: number;
  sku: string;
  stock: number;
}

const OrderFormModal: React.FC<OrderFormModalProps> = ({ isOpen, onClose, onSave, allProducts, initialData, isEditing, onDelete }) => {
  // Customer details
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' });

  // Order fields
  const [status, setStatus] = useState<OrderStatus>(OrderStatus.Pending);
  const [paymentMethod, setPaymentMethod] = useState("cod");

  // Shipping address
  const [address, setAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });

  // Products
  const [items, setItems] = useState<ProductItem[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  // Charges
  const [gstPercent, setGstPercent] = useState<number>(0);
  const [deliveryCharge, setDeliveryCharge] = useState<number>(0);
  // Populate initial values when editing
  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setCustomer(initialData.customer);
        // Extract GST and Delivery Charge special lines from items, if present
        const rawItems = initialData.items || [];
        const baseItems = rawItems.filter(i => i.name !== 'GST' && i.name !== 'Delivery Charge');
        // Derive subtotal for reverse GST%
        const baseSubtotal = baseItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
        const gstItem = rawItems.find(i => i.name === 'GST');
        const delItem = rawItems.find(i => i.name === 'Delivery Charge');
        const detectedDelivery = delItem ? Number(delItem.price) : 0;
        let detectedGstPercent = 0;
        if (gstItem && baseSubtotal > 0) {
          detectedGstPercent = Math.round(((Number(gstItem.price) / baseSubtotal) * 100) * 100) / 100;
        }
        setItems(baseItems);
        setGstPercent(detectedGstPercent);
        setDeliveryCharge(detectedDelivery);
        setStatus(initialData.status);
        setPaymentMethod(initialData.paymentMethod || "cod");
        setAddress(initialData.address || { line1: "", line2: "", city: "", state: "", pincode: "" });
      } else {
        setCustomer({ name: '', email: '', phone: '' });
        setItems([]);
        setStatus(OrderStatus.Pending);
        setPaymentMethod("cod");
        setAddress({ line1: "", line2: "", city: "", state: "", pincode: "" });
        setGstPercent(0);
        setDeliveryCharge(0);
      }
    }
  }, [isOpen, initialData]);

  // Flatten products for search: include parent products and variants as separate entries
  const selectableProducts = useMemo<SelectableProduct[]>(() => {
    return allProducts.flatMap((p) => {
      const entries: SelectableProduct[] = [
        {
          id: `p-${p.id}`,
          name: p.name,
          label: p.name,
          price: p.sellingPrice,
          sku: p.sku,
          stock: p.stock,
        },
      ];
      if (p.variants && p.variants.length > 0) {
        entries.push(
          ...p.variants.map((v) => ({
            id: `v-${v.id}`,
            // Store pure variant name for the order item; show parent in display label
            name: (v?.name && String(v.name).trim().length > 0) ? String(v.name) : String(p.name),
            label: (v?.name && String(v.name).trim().length > 0)
              ? `${v.name} (${p.name})`
              : `${p.name} (${v?.sku || 'Variant'})`,
            price: v.sellingPrice,
            sku: v.sku,
            stock: v.stock,
          }))
        );
      }
      return entries;
    });
  }, [allProducts]);

  const searchResults = useMemo(() => {
    if (!productSearchTerm) return [];
    const lowerCase = productSearchTerm.toLowerCase();
    const currentItemIds = items.map((i) => i.id);
    return selectableProducts
      .filter((p) => {
        if (currentItemIds.includes(p.id)) return false;
        const name = (p.name || '').toString().toLowerCase();
        const label = (p.label || '').toString().toLowerCase();
        const sku = (p.sku || '').toString().toLowerCase();
        return (
          name.includes(lowerCase) ||
          label.includes(lowerCase) ||
          sku.includes(lowerCase)
        );
      })
      .slice(0, 10);
  }, [productSearchTerm, selectableProducts, items]);

  const addProductToOrder = (product: SelectableProduct) => {
    setItems(prev => [...prev, {
      id: product.id,
      name: product.name,
      quantity: 1,
      price: product.price,
      sku: product.sku,
    }]);
    setProductSearchTerm('');
  };

  const updateItemQuantity = (id: string, quantity: number) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const baseSubtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);
  const gstAmount = useMemo(() => {
    const pct = isNaN(gstPercent) ? 0 : Math.max(0, gstPercent);
    return baseSubtotal * (pct / 100);
  }, [baseSubtotal, gstPercent]);
  const totalAmount = useMemo(() => {
    const del = isNaN(deliveryCharge) ? 0 : Math.max(0, deliveryCharge);
    return baseSubtotal + gstAmount + del;
  }, [baseSubtotal, gstAmount, deliveryCharge]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.name || !customer.email || !customer.phone) {
      alert("Please enter customer details.");
      return;
    }
    if (items.length === 0) {
      alert("Please add at least one product.");
      return;
    }
    if (!address.line1 || !address.city || !address.state || !address.pincode) {
      alert("Please enter complete shipping address.");
      return;
    }
    // Append charge lines as synthetic items for backend total computation and invoice breakup
    const chargeItems: ProductItem[] = [];
    if (gstAmount > 0) {
      chargeItems.push({ id: 'charge-gst', name: 'GST', quantity: 1, price: Number(gstAmount.toFixed(2)) });
    }
    if ((deliveryCharge || 0) > 0) {
      chargeItems.push({ id: 'charge-delivery', name: 'Delivery Charge', quantity: 1, price: Number((deliveryCharge || 0).toFixed(2)) });
    }
    onSave(customer, [...items, ...chargeItems], status, paymentMethod, address);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start md:items-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden min-h-0" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
          {/* HEADER */}
          <header className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-text-primary">{isEditing ? 'Edit Order' : 'Create New Order'}</h2>
            <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">✖</button>
          </header>

          {/* MAIN */}
          <main className="p-6 flex-1 overflow-y-auto space-y-6 min-h-0">
            {/* Customer Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <input type="text" placeholder="Customer Name (e.g., Riya Sharma)" title="Enter the customer's full name" value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  className="border p-2 rounded-md w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
                <input type="email" placeholder="Customer Email (e.g., riya@example.com)" title="Enter a valid email address" value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  className="border p-2 rounded-md w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
                <input type="tel" placeholder="Customer Phone (e.g., +91 98765 43210)" title="Include country code if applicable" value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  className="border p-2 rounded-md w-full" required />
              </div>
            </div>

            {/* Payment + Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="border p-2 rounded-md w-full" title="Select payment method">
                  <option value="prepaid">Pre-Paid</option>
                  <option value="cod">Cash on Delivery</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} className="border p-2 rounded-md w-full" title="Select order status">
                  {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Address + Charges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                <input placeholder="Address Line 1 (e.g., 221B Baker Street)" title="House/Flat, Building and Street" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} className="border p-2 rounded-md w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                <input placeholder="Address Line 2 (Apartment, suite, etc.)" title="Optional address details" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} className="border p-2 rounded-md w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input placeholder="City (e.g., Mumbai)" title="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="border p-2 rounded-md w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input placeholder="State (e.g., Maharashtra)" title="State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} className="border p-2 rounded-md w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input placeholder="Pincode (e.g., 400001)" title="6-digit postal code" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} className="border p-2 rounded-md w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST %</label>
                <input type="number" step="0.01" min={0} placeholder="GST % (e.g., 18)" title="GST percentage applied on subtotal" value={gstPercent} onChange={(e) => setGstPercent(parseFloat(e.target.value) || 0)} className="border p-2 rounded-md w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Charge</label>
                <input type="number" step="0.01" min={0} placeholder="Delivery Charge (e.g., 49)" title="Flat delivery charges" value={deliveryCharge} onChange={(e) => setDeliveryCharge(parseFloat(e.target.value) || 0)} className="border p-2 rounded-md w-full" />
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="font-semibold mb-2">Order Items</h3>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Products</label>
              <input
                type="text"
                placeholder="Search for products... e.g., 'Gold Ring' or SKU 'GR-001'"
                title="Type product name or SKU to search"
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                className="w-full border p-2 rounded-md"
              />
              {searchResults.length > 0 && (
                <ul className="border mt-2 rounded-md bg-white shadow max-h-40 overflow-y-auto">
                  {searchResults.map((product) => (
                    <li
                      key={product.id}
                      onClick={() => addProductToOrder(product)}
                      className="p-2 cursor-pointer hover:bg-gray-100"
                    >
                      {(product.label || product.name)} ({product.sku}) - {formatCurrency(product.price)} | Stock: {product.stock}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between border p-2 rounded-md">
                    <span>{item.name}</span>
                    <div className="flex items-center space-x-2">
                      <input type="number" value={item.quantity}
                        onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                        className="w-16 border p-1 rounded" min="1" placeholder="Qty" title="Enter item quantity" />
                      <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                      <button type="button" onClick={() => removeItem(item.id)} className="text-red-500">✖</button>
                    </div>
                  </div>
                ))}
              </div>
              {items.length === 0 && <p className="text-gray-500 text-sm mt-2">No products added yet.</p>}
              <div className="mt-4">
                <div className="text-right text-sm text-gray-600">Subtotal: {formatCurrency(baseSubtotal)}</div>
                <div className="text-right text-sm text-gray-600">GST ({isNaN(gstPercent) ? 0 : gstPercent}%): {formatCurrency(gstAmount)}</div>
                <div className="text-right text-sm text-gray-600">Delivery: {formatCurrency(isNaN(deliveryCharge) ? 0 : deliveryCharge)}</div>
                <div className="text-right mt-1 font-bold">Total: {formatCurrency(totalAmount)}</div>
              </div>
            </div>
          </main>

          {/* FOOTER */}
          <footer className="flex justify-between items-center p-4 border-t bg-gray-50">
            <div>
              {isEditing && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Delete this order? This cannot be undone.')) onDelete();
                  }}
                  className="px-4 py-2 rounded bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Delete Order
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
              <button type="submit" className="px-6 py-2 rounded bg-primary text-white">{isEditing ? 'Save Changes' : 'Create Order'}</button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default OrderFormModal;
