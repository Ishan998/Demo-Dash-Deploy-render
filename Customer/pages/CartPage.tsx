import React, { useState, useMemo } from 'react';
import type { Product, CartItem, WishlistItem } from '../types';
import { TrashIcon, HeartIcon, SearchIcon } from '../components/Icon';
import { calculateCartTotals, formatInr, getDiscountPercent, getMrp, getUnitPrice } from '../utils/pricing';

interface CartPageProps {
  cartItems: CartItem[];
  wishlistItems: WishlistItem[];
  onToggleWishlist: (id: number) => void;
  onToggleCart: (id: number) => void;
  onUpdateCartQuantity: (id: number, quantity: number) => void;
  onSelectProduct: (product: Product) => void;
  onNavigateToAllProducts: () => void;
  onNavigateToCheckout: () => void;
}

const CartPage: React.FC<CartPageProps> = ({
  cartItems,
  wishlistItems,
  onToggleWishlist,
  onToggleCart,
  onUpdateCartQuantity,
  onSelectProduct,
  onNavigateToAllProducts,
  onNavigateToCheckout
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('date-desc');

  console.log("🔍 DEBUG: [CartPage.tsx] Received cartItems prop:", cartItems);

  const cartProducts = useMemo(() => {
    return cartItems
      .map(item => ({
        ...item.product, // ✅ Use the nested product object from the cart item
        cartItemId: item.id, // Keep the cart item's own ID for updates/deletions
        quantity: item.quantity,
        addedAt: item.created_at || new Date().toISOString(), // ✅ Use backend timestamp or fallback to now
      }))
      .filter((p): p is Product & { cartItemId: number; quantity: number; addedAt: string } => p !== null)
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) // Search works as before
      .sort((a, b) => {
        switch (sortOption) {
          case 'date-asc': return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
          case 'price-asc': return Number(getUnitPrice(a)) - Number(getUnitPrice(b));
          case 'price-desc': return Number(getUnitPrice(b)) - Number(getUnitPrice(a));
          case 'name-asc': return a.name.localeCompare(b.name);
          case 'name-desc': return b.name.localeCompare(a.name);
          case 'qty-asc': return a.quantity - b.quantity;
          case 'qty-desc': return b.quantity - a.quantity;
          case 'date-desc':
          default:
            return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        }
      });
  }, [cartItems, searchQuery, sortOption]);

  console.log("🔍 DEBUG: [CartPage.tsx] Computed cartProducts to render:", cartProducts);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const { subtotal, gstAmount, shippingTotal, total, effectiveGstPercent, gstPercentsUsed } = useMemo(
    () => calculateCartTotals(cartItems),
    [cartItems]
  );
  const gstLabel = useMemo(() => {
    if (gstPercentsUsed.length === 1) return `GST (${gstPercentsUsed[0]}%)`;
    if (gstPercentsUsed.length > 1 && effectiveGstPercent > 0) return `GST (~${effectiveGstPercent.toFixed(2)}%)`;
    return 'GST';
  }, [gstPercentsUsed, effectiveGstPercent]);

  return (
    <main className="bg-[#FDFBF6]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Shopping Cart</h1>
          <p className="text-gray-600 mt-2">
            You have <span className="font-bold text-gray-800">{totalItems}</span> {totalItems === 1 ? 'item' : 'items'} in your cart.
          </p>
        </div>

        {cartItems.length > 0 && (
           <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <div className="w-full md:w-auto flex-grow max-w-sm">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Search cart..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-2 pl-10 border border-gray-300 rounded-full focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>
              </div>
              <div className="w-full md:w-auto">
                <select value={sortOption} onChange={e => setSortOption(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#D4AF37] focus:border-[#D4AF37]">
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Alphabetical: A-Z</option>
                  <option value="name-desc">Alphabetical: Z-A</option>
                  <option value="qty-desc">Quantity: High to Low</option>
                  <option value="qty-asc">Quantity: Low to High</option>
                </select>
              </div>
            </div>
        )}

        {cartProducts.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-lg bg-white">
            <h2 className="text-2xl font-semibold text-gray-700">{searchQuery ? 'No Matching Items' : 'Your Cart is Empty'}</h2>
            <p className="text-gray-500 mt-2 mb-6">
              {searchQuery ? 'Try a different search term.' : 'Time to fill it with beautiful jewellery!'}
            </p>
            {!searchQuery && (
                <button
                onClick={onNavigateToAllProducts}
                className="bg-black text-white font-bold py-3 px-8 rounded-full hover:bg-gray-800 transition-colors duration-300"
                >
                Continue Shopping
                </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
              <ul className="-my-6 divide-y divide-gray-200">
                {cartProducts.map((product, index) => (
                  <li key={product.id} className="flex py-6">
                    <span className="font-bold text-gray-400 mr-4 mt-1">{index + 1}.</span>
                    <div className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                      <img src={product.images?.[0] || '/placeholder.svg'} alt={product.name} className="h-full w-full object-cover object-center" loading="lazy" />
                    </div>
                    <div className="ml-4 flex flex-1 flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <h3>
                            <button onClick={() => onSelectProduct(product)} className="hover:text-[#D4AF37] text-left">{product.name}</button>
                          </h3>
                          <div className="ml-4 text-right">
                            <div className="text-lg font-semibold text-gray-900">
                              {formatInr(Number(getUnitPrice(product)))}
                            </div>
                            {getMrp(product) > Number(getUnitPrice(product)) && (
                              <div className="text-sm text-gray-500 line-through">
                                {formatInr(getMrp(product))}
                              </div>
                            )}
                            {getDiscountPercent(Number(getUnitPrice(product)), getMrp(product)) > 0 && (
                              <div className="text-xs text-green-600 font-semibold">
                                {getDiscountPercent(Number(getUnitPrice(product)), getMrp(product))}% off
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              x {product.quantity} = {formatInr(Number(getUnitPrice(product)) * product.quantity)}
                            </div>
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{product.main_category}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          Added: {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(product.addedAt))}
                        </p>
                      </div>
                      <div className="flex flex-1 items-end justify-between text-sm mt-4">
                        <div className="flex items-center border border-gray-300 rounded-md">
                          <button onClick={() => onUpdateCartQuantity(product.cartItemId, product.quantity - 1)} className="px-3 py-1 text-lg disabled:opacity-50">-</button>
                          <span className="px-4 py-1 font-bold">{product.quantity}</span>
                          <button onClick={() => onUpdateCartQuantity(product.cartItemId, product.quantity + 1)} disabled={product.quantity >= (product.stock ?? Infinity)} className="px-3 py-1 text-lg disabled:opacity-50">+</button>
                        </div>
                        <div className="flex items-center space-x-2">
                           <button
                              onClick={() => onToggleWishlist(product.id)} // Toggling wishlist still uses product.id
                              className={`p-2 rounded-md transition-colors ${wishlistItems.some(item => item.product.id === product.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                              aria-label={wishlistItems.some(item => item.product.id === product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                            >
                              <HeartIcon className={`w-5 h-5 ${wishlistItems.some(item => item.product.id === product.id) ? 'fill-current' : ''}`} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleCart(product.id)} // Toggling cart still uses product.id
                              className="font-medium text-gray-400 hover:text-red-500 p-2"
                              aria-label="Remove from cart"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {/* Order Summary */}
            <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm sticky top-24">
               <h2 className="text-xl font-semibold border-b pb-4 mb-4">Order Summary</h2>
               <div className="space-y-4">
                 <div className="flex justify-between">
                   <span>Subtotal</span>
                   <span>{formatInr(subtotal)}</span>
                 </div>
                 <div className="flex justify-between text-gray-600">
                   <span>{gstLabel}</span>
                   <span>{formatInr(Number(gstAmount))}</span>
                 </div>
                 <div className="flex justify-between text-gray-600">
                   <span>Shipping</span>
                   <span>{shippingTotal === 0 ? 'FREE' : formatInr(shippingTotal)}</span>
                 </div>
                 <div className="flex justify-between font-bold text-lg border-t pt-4">
                   <span>Order Total</span>
                   <span>{formatInr(Number(total))}</span>
                 </div>
               </div>
                <button onClick={onNavigateToCheckout} className="w-full mt-6 bg-black text-white font-bold py-3 px-8 rounded-full hover:bg-gray-800 transition-colors duration-300">
                    Proceed to Checkout
                </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default CartPage;
