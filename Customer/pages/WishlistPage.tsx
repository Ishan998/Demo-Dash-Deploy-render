import React, { useState, useMemo } from 'react';
import type { Product, WishlistItem, CartItem } from '../types';
import { TrashIcon, SearchIcon } from '../components/Icon';
import { formatInr, getDiscountPercent, getMrp, getUnitPrice } from '../utils/pricing';

interface WishlistPageProps {
  wishlistItems: WishlistItem[];
  cartItems: CartItem[];
  onToggleWishlist: (id: number) => void;
  onToggleCart: (id: number) => void;
  onSelectProduct: (product: Product) => void;
  onNavigateToAllProducts: () => void;
  onAddAllToCart: (products: Product[]) => void;
  onBuyNow: (id: number) => void;
}

const WishlistPage: React.FC<WishlistPageProps> = ({
  wishlistItems,
  cartItems,
  onToggleWishlist,
  onToggleCart,
  onSelectProduct,
  onNavigateToAllProducts,
  onAddAllToCart,
  onBuyNow,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('date-desc');

  console.log("🔍 DEBUG: [WishlistPage.tsx] Received wishlistItems prop:", wishlistItems);

  const wishlistProducts = useMemo(() => {
    // ✅ Directly use the product data from the wishlistItems prop.
    // The backend already provides the full product object.
    return wishlistItems
      .map(item => ({
        ...item.product,
        // Fallback to a new Date if `addedAt` and `created_at` are missing to prevent crashes.
        addedAt: item.addedAt || item.created_at || new Date().toISOString(),
      }))
      .filter((p): p is Product & { addedAt: string } => p !== null)
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        switch (sortOption) {
          case 'date-asc': return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
          case 'price-asc': return Number(getUnitPrice(a)) - Number(getUnitPrice(b));
          case 'price-desc': return Number(getUnitPrice(b)) - Number(getUnitPrice(a));
          case 'name-asc': return a.name.localeCompare(b.name);
          case 'name-desc': return b.name.localeCompare(a.name);
          case 'date-desc':
          default:
            return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        }
      });
  }, [wishlistItems, searchQuery, sortOption]);

  const handleAddAll = () => {
    const productsToAdd = wishlistProducts
      // ✅ Use `status` field from backend data
      .filter(p => p.status !== 'out_of_stock' && !cartItems.some(ci => ci.product.id === p.id));
      
    if (productsToAdd.length > 0) {
      onAddAllToCart(productsToAdd);
    }
  };
  
  // ✅ Use `status` field from backend data
  const canAddAll = wishlistProducts.some(p => p.status !== 'out_of_stock' && !cartItems.some(ci => ci.product.id === p.id));

  return (
    <main className="bg-white min-h-[60vh]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">My Wishlist</h1>
          <p className="text-gray-600 mt-2">
            You have <span className="font-bold text-gray-800">{wishlistItems.length}</span> {wishlistItems.length === 1 ? 'item' : 'items'} in your wishlist.
          </p>
        </div>

        {wishlistItems.length > 0 && (
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 p-4 bg-gray-50 rounded-lg border">
            <div className="w-full md:w-auto flex-grow max-w-sm">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search wishlist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2 pl-10 border border-gray-300 rounded-full focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>
            </div>
            <div className="w-full md:w-auto flex items-center gap-4">
              <select value={sortOption} onChange={e => setSortOption(e.target.value)} className="w-full md:w-auto p-2 border border-gray-300 rounded-md focus:ring-[#D4AF37] focus:border-[#D4AF37]">
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Alphabetical: A-Z</option>
                <option value="name-desc">Alphabetical: Z-A</option>
              </select>
              <button 
                onClick={handleAddAll}
                disabled={!canAddAll}
                className="bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap">
                Add All to Cart
              </button>
            </div>
          </div>
        )}

        {wishlistProducts.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-700">{searchQuery ? 'No Matching Items' : 'Your Wishlist is Empty'}</h2>
            <p className="text-gray-500 mt-2 mb-6">
              {searchQuery ? 'Try a different search term.' : "Looks like you haven't added anything yet. Explore our collections and find something you love!"}
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
          <div className="flow-root">
            <ul className="-my-6 divide-y divide-gray-200">
              {wishlistProducts.map((product, index) => {
                const sellingPrice = Number(getUnitPrice(product));
                const mrp = Number(getMrp(product));
                const discountPercent = getDiscountPercent(sellingPrice, mrp);
                const showMrp = mrp > sellingPrice && mrp > 0;

                return (
                  <li key={product.id} className="flex py-6">
                    <span className="font-bold text-gray-500 mr-4 mt-2">{index + 1}.</span>
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      {/* ✅ Use the first image from the `images` array */}
                      <img
                        src={product.images && product.images.length > 0 ? product.images[0] : '/placeholder.svg'}
                        alt={product.name}
                        className="h-full w-full object-cover object-center"
                        loading="lazy"
                      />
                    </div>

                    <div className="ml-4 flex flex-1 flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <h3>
                            <button onClick={() => onSelectProduct(product)} className="hover:text-[#D4AF37] text-left">{product.name}</button>
                          </h3>
                          <div className="ml-4 text-right">
                            <p className="text-lg font-semibold text-gray-900">{formatInr(sellingPrice)}</p>
                            {showMrp && (
                              <p className="text-sm text-gray-400 line-through">{formatInr(mrp)}</p>
                            )}
                            {discountPercent > 0 && (
                              <p className="text-xs text-green-600 font-semibold">{discountPercent}% off</p>
                            )}
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{product.category}</p>
                         <p className="mt-1 text-xs text-gray-400">
                            Added on: {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(product.addedAt))}
                         </p>
                      </div>
                      <div className="flex flex-1 items-end justify-between text-sm">
                        {/* ✅ Use `status` field from backend data */}
                        <p className={`font-semibold ${product.status !== 'out_of_stock' ? 'text-green-600' : 'text-red-600'}`}>
                          {product.status !== 'out_of_stock' ? 'In Stock' : 'Out of Stock'}
                        </p>

                        <div className="flex items-center space-x-2">
                          {product.status !== 'out_of_stock' && (
                              <>
                                  <button
                                  onClick={() => onToggleCart(product.id)}
                                  className={`font-semibold rounded-md transition-colors duration-300 text-xs py-2 px-3 ${ 
                                      cartItems.some(item => item.product.id === product.id)
                                      ? 'bg-gray-200 text-gray-800 border border-gray-200 hover:bg-gray-300'
                                      : 'bg-black text-white hover:bg-gray-800'
                                  }`}
                                  >
                                  {cartItems.some(item => item.product.id === product.id) ? 'In Cart' : 'Add to Cart'}
                                  </button>
                                  <button
                                    onClick={() => onBuyNow(product.id)}
                                    className="font-semibold rounded-md transition-all duration-300 text-xs py-2 px-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-white hover:from-amber-600 hover:to-yellow-500"
                                  >
                                    Buy Now
                                  </button>
                              </>
                          )}
                          <button
                            type="button"
                            onClick={() => onToggleWishlist(product.id)}
                            className="font-medium text-gray-500 hover:text-red-500 p-2"
                            aria-label="Remove from wishlist"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
};

export default WishlistPage;
