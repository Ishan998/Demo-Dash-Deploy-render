import React, { useRef } from 'react';
import type { Product, WishlistItem, CartItem } from '../types';
import ProductCard from './ProductCard';
import { ChevronLeftIcon, ChevronRightIcon } from './Icon';

interface ProductSliderProps {
  title: string;
  subtitle: string;
  products: Product[];
  wishlistItems: WishlistItem[];
  cartItems: CartItem[];
  onToggleWishlist: (id: number) => void;
  onToggleCart: (id: number) => void;
  onSelectProduct: (product: Product) => void;
  onBuyNow: (id: number) => void;
  cardSize?: 'default' | 'small';
}

const ProductSlider: React.FC<ProductSliderProps> = ({ title, subtitle, products, wishlistItems, cartItems, onToggleWishlist, onToggleCart, onSelectProduct, onBuyNow, cardSize = 'default' }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = current.offsetWidth * 0.8; 
      current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };
  
  if (!products || products.length === 0) {
    return null;
  }

  const cardWidthClass = cardSize === 'small'
    ? 'w-[60%] sm:w-[40%] md:w-1/4 lg:w-1/5'
    : 'w-[75%] sm:w-1/2 md:w-1/3 lg:w-1/4';
  
  const spaceClass = cardSize === 'small' ? 'space-x-4' : 'space-x-8';

  return (
    <section className="py-20 bg-white first:bg-[#FDFBF6]">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800">{title}</h2>
          <p className="text-gray-600 mt-2">{subtitle}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            className="absolute top-1/2 -left-3 md:-left-4 -translate-y-1/2 transform bg-white/80 hover:bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 z-10"
          >
            <ChevronLeftIcon className="w-6 h-6 text-gray-800" />
          </button>
          <div
            ref={scrollContainerRef}
            className={`flex ${spaceClass} overflow-x-auto snap-x snap-mandatory scroll-smooth`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product) => (
              <div key={product.id} className={`snap-start flex-shrink-0 ${cardWidthClass}`}>
                <ProductCard
                  product={product}
                  isWishlisted={wishlistItems.some(item => (item as any).productId === product.id || item.product?.id === product.id)}
                  isInCart={cartItems.some(item => (item as any).productId === product.id || item.product?.id === product.id)}
                  onToggleWishlist={onToggleWishlist}
                  onToggleCart={onToggleCart}
                  onSelectProduct={onSelectProduct}
                  onBuyNow={onBuyNow}
                  size={cardSize}
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            className="absolute top-1/2 -right-3 md:-right-4 -translate-y-1/2 transform bg-white/80 hover:bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 z-10"
          >
            <ChevronRightIcon className="w-6 h-6 text-gray-800" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProductSlider;
