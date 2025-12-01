import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './Icon';
import { Product } from '../types';

interface ProductImageGalleryProps {
  product: Product;
  activeVariantId?: number;
  alt: string;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ product, activeVariantId, alt }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const mainImageContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // Determine which images to show: variant's images if active and available, otherwise fallback to main product's images.
  const activeVariant = product.variants?.find(v => v.id === activeVariantId);
  const imagesToShow = (activeVariant && activeVariant.images && activeVariant.images.length > 0)
    ? activeVariant.images
    : (product.images || []);

  const safeImages = imagesToShow && imagesToShow.length > 0 ? imagesToShow : [];

  const handleNavClick = (direction: 'prev' | 'next') => {
    let newIndex = direction === 'prev' ? activeIndex - 1 : activeIndex + 1;
    if (newIndex < 0) newIndex = safeImages.length - 1;
    if (newIndex >= safeImages.length) newIndex = 0;
    scrollToIndex(newIndex);
  };
  
  const scrollToIndex = useCallback((index: number) => {
    setActiveIndex(index);
    const container = mainImageContainerRef.current;
    if (container) {
      const scrollAmount = container.offsetWidth * index;
      container.scrollTo({ left: scrollAmount, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToIndex(activeIndex);
  }, [activeIndex, scrollToIndex]);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!mainImageContainerRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - mainImageContainerRef.current.offsetLeft;
    scrollLeft.current = mainImageContainerRef.current.scrollLeft;
    mainImageContainerRef.current.style.cursor = 'grabbing';
    mainImageContainerRef.current.style.scrollBehavior = 'auto';
  };
  
  const handleMouseUp = () => {
    if (!mainImageContainerRef.current) return;
    isDragging.current = false;
    mainImageContainerRef.current.style.cursor = 'grab';
    mainImageContainerRef.current.style.scrollBehavior = 'smooth';
    
    // Snap to nearest image
    const container = mainImageContainerRef.current;
    const newIndex = Math.round(container.scrollLeft / container.offsetWidth);
    scrollToIndex(newIndex);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !mainImageContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - mainImageContainerRef.current.offsetLeft;
    const walk = (x - startX.current) * 2; // the *2 makes it feel more responsive
    mainImageContainerRef.current.scrollLeft = scrollLeft.current - walk;
  };

  if (safeImages.length === 0) {
    return <div className="w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center">No Image</div>;
  }

  return (
    <div className="flex flex-col sticky top-24">
      <div className="relative">
        <div
          ref={mainImageContainerRef}
          className="flex overflow-x-hidden snap-x snap-mandatory scroll-smooth w-full aspect-[4/5] bg-gray-100 rounded-lg"
          style={{ cursor: 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseUp}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {safeImages.map((img, index) => (
            <div key={index} className="flex-shrink-0 w-full h-full snap-center flex items-center justify-center">
              <img src={img} alt={`${alt} view ${index + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        {safeImages.length > 1 && (
            <>
                <button
                    onClick={() => handleNavClick('prev')}
                    aria-label="Previous image"
                    className="absolute top-1/2 -left-3 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-2 shadow-md transition-opacity duration-300 z-10"
                >
                    <ChevronLeftIcon className="w-6 h-6 text-gray-800" />
                </button>
                <button
                    onClick={() => handleNavClick('next')}
                    aria-label="Next image"
                    className="absolute top-1/2 -right-3 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-2 shadow-md transition-opacity duration-300 z-10"
                >
                    <ChevronRightIcon className="w-6 h-6 text-gray-800" />
                </button>
            </>
        )}
      </div>

      {/* Thumbnails */}
      <div className="flex justify-center gap-3 mt-4 overflow-x-auto p-2">
        {safeImages.map((img, index) => (
          <button
            key={index}
            onClick={() => scrollToIndex(index)}
            className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
              activeIndex === index ? 'border-[#D4AF37]' : 'border-transparent'
            }`}
          >
            <img src={img} alt={`${alt} thumbnail ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductImageGallery;