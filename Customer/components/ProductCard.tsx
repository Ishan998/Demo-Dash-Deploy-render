import React, { useState, useEffect } from 'react';
import type { Product, CartItem } from '../types';
import { HeartIcon, CartIcon } from './Icon';

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  isInCart: boolean;
  onToggleWishlist: (id: number, force?: boolean) => void;
  onToggleCart: (id: number) => void;
  onSelectProduct: (selection: { product: Product; variantId?: number }) => void;
  onBuyNow: (id: number) => void;
  size?: 'default' | 'small';
}

const CountdownTimer = ({ expiryDate }: { expiryDate: string }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(expiryDate) - +new Date();
    let timeLeft: { hours?: number; minutes?: number; seconds?: number } = {};

    if (difference > 0) {
      timeLeft = {
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  });
  
  const hasTimeLeft = Object.keys(timeLeft).length > 0;

  return (
    <div className="mt-3 p-2 bg-red-50 text-red-800 rounded-md text-sm">
      {hasTimeLeft ? (
        <div className="flex items-center justify-center space-x-3">
          <span className="font-semibold">Offer ends in:</span>
          <div className="flex space-x-2 tabular-nums">
             <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
             <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
             <span>{String(timeLeft.seconds).padStart(2, '0')}s</span>
          </div>
        </div>
      ) : (
        <div className="text-center font-bold">Deal closed</div>
      )}
    </div>
  );
};

const badgeColorClasses: Record<string, string> = {
  'New Arrivals': 'bg-amber-500 text-white',
  'Sale': 'bg-red-500 text-white',
  'Best Seller': 'bg-pink-700 text-white',
  'Limited': 'bg-orange-500 text-white',
  'Featured': 'bg-rose-600 text-white',
  'Festive Sale': 'bg-yellow-500 text-white',
};


const ProductCard: React.FC<ProductCardProps> = ({ product, isWishlisted, isInCart, onToggleWishlist, onToggleCart, onSelectProduct, onBuyNow, size = 'default' }) => {
  const [animateHeart, setAnimateHeart] = useState(false);
  const isSmall = size === 'small';

  const hasDiscount = typeof product.originalPrice === 'number' && product.originalPrice > product.price;
  const discount = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;
  
  const handleWishlistClick = () => {
    onToggleWishlist(product.id);
    if (!isWishlisted) {
      setAnimateHeart(true);
    }
  };
  
  const badgeClass = product.badge ? badgeColorClasses[product.badge] || 'bg-gray-500 text-white' : '';
  
  const sizeClass = isSmall ? 'size-small' : 'size-default';

  return (
    <div className="flex flex-col h-full text-center bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-shadow duration-300 hover:shadow-lg">
      {/* Image Section */}
      <div className="relative">
        {/* Tags */}
        <div className="absolute top-2 left-2 z-10 flex flex-col items-start gap-1">
          {product.inStock && (
            <span className="bg-green-500 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
              In Stock
            </span>
          )}
          {product.badge && (
            <span className={`${badgeClass} text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider`}>
              {product.badge}
            </span>
          )}
        </div>

        {/* Image */}
         <button onClick={() => onSelectProduct({ product, variantId: product.selectedVariantId })} className="w-full aspect-square bg-gray-100 block">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </button>

        {/* Wishlist Button */}
        <button 
          aria-label="Add to wishlist"
          onClick={handleWishlistClick}
          onAnimationEnd={() => setAnimateHeart(false)}
          className={`absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:scale-110 transition-all duration-300 z-10 ${
            isWishlisted ? 'text-red-500' : 'text-gray-600'
          } ${animateHeart ? 'animate-giggle-shine' : ''}`}
        >
          <HeartIcon className={`w-5 h-5 transition-colors ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Details Section */}
      <div className={`${isSmall ? 'p-2' : 'p-3 md:p-4'} flex flex-col flex-grow`}>
        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{product.category}</p>
        <h3 className={`${isSmall ? 'text-sm mb-2' : 'text-base md:text-lg mb-3'} font-semibold text-gray-800 flex-grow text-center`}>
          <div className={`product-title-container ${sizeClass} has-fade`}>
            <button onClick={() => onSelectProduct({ product, variantId: product.selectedVariantId })} className="w-full text-center hover:text-[#D4AF37] transition-colors">
              {product.name}
            </button>
          </div>
        </h3>

        {/* Countdown Timer for Limited Offers */}
        {product.badge === 'Limited' && product.expiryDate && (
          <CountdownTimer expiryDate={product.expiryDate} />
        )}
        
        {/* Pricing */}
        <div className="flex items-baseline justify-center flex-wrap gap-x-2 mt-2">
           {hasDiscount ? (
            <>
              <p className={`${isSmall ? 'text-base' : 'text-lg md:text-xl'} font-bold text-gray-900`}>₹{product.price.toLocaleString('en-IN')}</p>
              <p className={`${isSmall ? 'text-xs' : 'text-sm'} text-gray-400 line-through`}>MRP: ₹{product.originalPrice!.toLocaleString('en-IN')}</p>
              <p className={`${isSmall ? 'text-xs' : 'text-sm'} font-semibold text-red-500`}>
                ({discount}% OFF)
              </p>
            </>
           ) : (
             <p className={`${isSmall ? 'text-base' : 'text-lg md:text-xl'} font-bold text-gray-900`}>₹{product.price.toLocaleString('en-IN')}</p>
          )}
        </div>
      </div>

      {/* Action Buttons Section */}
      <div className={`${isSmall ? 'px-2 pb-2' : 'px-3 pb-3 md:px-4 md:pb-4'} mt-auto`}>
        {product.inStock ? (
          <div className="flex items-stretch space-x-2">
            <button
              onClick={() => onToggleCart(product.id)}
              aria-label={isInCart ? 'Remove from Cart' : 'Add to Cart'}
              className={`font-bold rounded-md transition-colors duration-300 flex items-center justify-center
              ${isSmall ? 'text-xs' : ''} 
              ${isInCart
                  ? 'bg-gray-200 text-gray-800 border border-gray-200 hover:bg-gray-300'
                  : 'bg-black text-white hover:bg-gray-800'
              }
              p-2.5 sm:flex-1 sm:px-3
              `}
            >
              <CartIcon className="w-5 h-5 sm:hidden" />
              <span className="hidden sm:inline text-xs sm:text-sm">{isInCart ? 'Remove' : 'Add to Cart'}</span>
            </button>
            <button
              onClick={() => onBuyNow(product.id)}
              className={`flex-1 font-bold rounded-md transition-all duration-300 hover:shadow-lg transform hover:-translate-y-px ${isSmall ? 'text-xs py-2 px-2' : 'text-xs sm:text-sm py-2.5 px-2 sm:px-3'}
              bg-gradient-to-r from-amber-500 to-yellow-400 text-white hover:from-amber-600 hover:to-yellow-500`}
            >
              Buy Now
            </button>
          </div>
        ) : (
          <button
            disabled
            className={`w-full font-bold rounded-md ${isSmall ? 'text-xs py-2 px-3' : 'text-sm py-2.5 px-4'}
            bg-gray-300 text-gray-500 cursor-not-allowed`}
          >
            Out of Stock
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
