import React, { useState, useMemo, useEffect } from 'react';
import type { CartItem, User, Address, Product, Order } from '../types';
import { products } from '../constants';
import PaymentModal from '../components/PaymentModal';
import { createOrder as createOrderFromBackend, type StorefrontOrder } from '../services/apiService';
import { calculateCartTotals, formatInr, getUnitPrice } from '../utils/pricing';

interface CheckoutPageProps {
  items: CartItem[];
  user: User;
  addresses: Address[];
  onCreateOrder: (order: Order, items: CartItem[]) => void;
  onNavigateToAllProducts: () => void;
}

type OrderDetails = {
  orderId: string;
  totalAmount: number;
  qrCodeData: string;
};

const CheckoutPage: React.FC<CheckoutPageProps> = ({ items, user, addresses, onCreateOrder, onNavigateToAllProducts }) => {
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    addresses.find(a => a.isDefault)?.id || (addresses.length > 0 ? addresses[0].id : null)
  );
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [currentOrderDetails, setCurrentOrderDetails] = useState<OrderDetails | null>(null);
  const [pendingPlacedOrder, setPendingPlacedOrder] = useState<Order | null>(null);
  
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });

  useEffect(() => {
    if (addresses.length === 0) {
      setSelectedAddressId(null);
      return;
    }
    const fallback = addresses.find(a => a.isDefault) || addresses[0];
    setSelectedAddressId(prev => {
      if (prev && addresses.some(addr => addr.id === prev)) {
        return prev;
      }
      return fallback.id;
    });
  }, [addresses]);

  const checkoutCartItems = useMemo(() => {
    return items
      .map(item => {
        const product = item.product || products.find(p => p.id === (item as any).productId);
        if (!product) return null;
        return { ...item, product };
      })
      .filter((item): item is CartItem => item !== null);
  }, [items]);

  const checkoutProducts = useMemo(() => {
    return checkoutCartItems.map(item => ({
      ...item.product,
      quantity: item.quantity,
      cartItemId: item.id,
    }));
  }, [checkoutCartItems]);

  const { subtotal, gstAmount, shippingTotal, total, effectiveGstPercent, gstPercentsUsed } = useMemo(
    () => calculateCartTotals(checkoutCartItems),
    [checkoutCartItems]
  );

  const gstLabel = useMemo(() => {
    if (gstPercentsUsed.length === 1) return `GST (${gstPercentsUsed[0]}%)`;
    if (gstPercentsUsed.length > 1 && effectiveGstPercent > 0) return `GST (~${effectiveGstPercent.toFixed(2)}%)`;
    return 'GST';
  }, [gstPercentsUsed, effectiveGstPercent]);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formattedValue = value.replace(/(.{4})/g, '$1 ').trim();
    if (formattedValue.length <= 19) {
      setCardDetails(prev => ({ ...prev, number: formattedValue }));
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
    }
    if (value.length <= 5) {
      setCardDetails(prev => ({ ...prev, expiry: value }));
    }
  };
  
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 3) {
      setCardDetails(prev => ({ ...prev, cvv: value }));
    }
  };

  const mapOrderFromApi = (order: StorefrontOrder): Order => ({
    id: order.id,
    date: order.date,
    status: (order.status as Order['status']) || 'pending',
    total: Number(order.total || 0),
    paymentMethod: order.payment_method,
    items: (order.items || []).map((it) => ({
      productId: it.productId,
      quantity: it.quantity,
      name: it.name,
      price: Number(it.price || 0),
      sku: it.sku,
    })),
  });

  const handleInitiateOrder = async () => {
    if (!selectedAddressId) {
      setError("Please select a shipping address.");
      return;
    }

    if (paymentMethod === 'card') {
      const cardNumberRaw = cardDetails.number.replace(/\s/g, '');
      if (cardNumberRaw.length !== 16 || !cardNumberRaw.startsWith('4')) {
          setError("Please enter a valid 16-digit Visa card number (starting with 4).");
          return;
      }
      if (!cardDetails.name.trim()) {
          setError("Please enter the name on the card.");
          return;
      }
      if (!cardDetails.expiry.match(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/)) {
          setError("Please enter a valid expiry date in MM/YY format.");
          return;
      }
      if (cardDetails.cvv.length !== 3) {
          setError("Please enter a valid 3-digit CVV.");
          return;
      }
    }

    setError(null);
    setIsProcessingPayment(true);

    const backendPaymentMethod: "cod" | "prepaid" = "prepaid";

    try {
      const response = await createOrderFromBackend(items, selectedAddressId, backendPaymentMethod, total);
      if (!response.success || !response.order) {
        setError(response.error || "An unknown error occurred while creating the order.");
        setPendingPlacedOrder(null);
        return;
      }

      const mapped = mapOrderFromApi(response.order);
      setPendingPlacedOrder(mapped);

      if (paymentMethod === 'upi') {
        setCurrentOrderDetails({
          orderId: `ORD-${response.order.id}`,
          totalAmount: Number(response.order.total || 0),
          qrCodeData: `upi://pay?pn=CipherX&am=${response.order.total}&tn=Order%20${response.order.id}`,
        });
        setIsPaymentModalOpen(true);
      } else if (paymentMethod === 'card') {
        onCreateOrder(mapped, items);
        setPendingPlacedOrder(null);
      }
    } catch (apiError) {
      setError("Failed to connect to the server. Please try again later.");
      setPendingPlacedOrder(null);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    if (pendingPlacedOrder) {
      onCreateOrder(pendingPlacedOrder, items); // Finalize order in global state
      setPendingPlacedOrder(null);
    }
  };

  const handlePaymentFailure = (reason: string) => {
    setIsPaymentModalOpen(false);
    setError(`Payment failed: ${reason}. Please try again.`);
    setPendingPlacedOrder(null);
  };

  if (items.length === 0) {
    return (
      <main className="bg-white min-h-[60vh]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Checkout</h1>
             <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                <h2 className="text-2xl font-semibold text-gray-700">Your Cart is Empty</h2>
                <p className="text-gray-500 mt-2 mb-6">There are no items to check out.</p>
                <button
                    onClick={onNavigateToAllProducts}
                    className="bg-black text-white font-bold py-3 px-8 rounded-full hover:bg-gray-800 transition-colors duration-300"
                >
                    Continue Shopping
                </button>
            </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="bg-[#FDFBF6]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">Checkout</h1>
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left side: Shipping and Payment */}
            <div className="lg:col-span-2 space-y-8">
              {/* Shipping Address */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">1. Shipping Address</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map(addr => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`border p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedAddressId === addr.id
                          ? 'border-2 border-[#D4AF37] bg-yellow-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-gray-800">{user.fullName} - {addr.type}</p>
                          <address className="text-sm text-gray-600 not-italic mt-1">
                            {addr.line1}{addr.line2 && `, ${addr.line2}`} <br/>
                            {addr.city}, {addr.state} - {addr.zip} <br/>
                            {user.phone}
                          </address>
                        </div>
                        {selectedAddressId === addr.id && (
                          <div className="w-5 h-5 bg-[#D4AF37] rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {addresses.length === 0 && (
                    <p className="text-gray-600">You have no saved addresses. Please add an address in your profile.</p>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">2. Payment Method</h2>
                <div className="flex border-b">
                  <button
                    onClick={() => setPaymentMethod('upi')}
                    className={`py-2 px-6 font-semibold transition-colors ${
                      paymentMethod === 'upi'
                        ? 'border-b-2 border-[#D4AF37] text-gray-800'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    UPI / QR Code
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 px-6 font-semibold transition-colors ${
                      paymentMethod === 'card'
                        ? 'border-b-2 border-[#D4AF37] text-gray-800'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Credit/Debit Card
                  </button>
                </div>

                <div className="mt-6">
                  {paymentMethod === 'card' ? (
                    <form className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Card Number</label>
                        <input 
                          type="text" 
                          placeholder="4XXX XXXX XXXX XXXX" 
                          value={cardDetails.number}
                          onChange={handleCardNumberChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name on Card</label>
                        <input 
                          type="text" 
                          placeholder="John Doe" 
                          value={cardDetails.name}
                          onChange={(e) => setCardDetails(prev => ({...prev, name: e.target.value}))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                          <input 
                            type="text" 
                            placeholder="MM/YY" 
                            value={cardDetails.expiry}
                            onChange={handleExpiryChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">CVV</label>
                          <input 
                            type="text" 
                            placeholder="123" 
                            value={cardDetails.cvv}
                            onChange={handleCvvChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                          />
                        </div>
                      </div>
                    </form>
                  ) : (
                    <form className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">UPI ID</label>
                        <div className="flex items-center gap-2 mt-1">
                          <input type="text" placeholder="yourname@bank" disabled className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D4AF37] focus:ring-[#D4AF37] bg-gray-100" />
                          <button type="button" disabled className="font-bold py-2 px-4 rounded-md bg-gray-200 text-sm">Verify</button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Placing the order will generate a QR code for payment.</p>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>

            {/* Right side: Order Summary */}
            <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm sticky top-24">
              <h2 className="text-xl font-semibold border-b pb-4 mb-4">3. Order Summary</h2>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {checkoutProducts.map(product => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <img src={product.images?.[0] || product.imageUrl || "/placeholder.svg"} alt={product.name} className="w-14 h-14 rounded-md object-cover mr-3" loading="lazy" />
                      <div>
                        <p className="font-semibold text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500">Qty: {product.quantity}</p>
                      </div>
                    </div>
                    <p className="text-sm font-medium">{formatInr(getUnitPrice(product) * product.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-4 mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatInr(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{gstLabel}</span>
                  <span>{formatInr(gstAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span>{shippingTotal === 0 ? 'FREE' : formatInr(shippingTotal)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-4 mt-2">
                  <span>Total Payable</span>
                  <span>{formatInr(total)}</span>
                </div>
              </div>
              <button
                onClick={handleInitiateOrder}
                disabled={isProcessingPayment || !selectedAddressId}
                className="w-full mt-6 bg-black text-white font-bold py-3 px-8 rounded-full hover:bg-gray-800 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isProcessingPayment ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {paymentMethod === 'card' ? 'Processing Payment...' : 'Creating Order...'}
                  </>
                ) : `Place Order (${formatInr(total)})`}
              </button>
            </div>
          </div>
        </div>
      </main>
      {isPaymentModalOpen && currentOrderDetails && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => handlePaymentFailure('cancelled by user')}
          orderId={currentOrderDetails.orderId}
          totalAmount={currentOrderDetails.totalAmount}
          qrCodeData={currentOrderDetails.qrCodeData}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
        />
      )}
    </>
  );
};

export default CheckoutPage;
