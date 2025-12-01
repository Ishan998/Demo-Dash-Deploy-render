import React, { useState, useEffect, useCallback, useMemo } from "react";
import type { Banner } from "../types";
import { ChevronLeftIcon, ChevronRightIcon } from "./Icon";

interface BannerCarouselProps {
  banners: Banner[];
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const slides = useMemo(() => banners.filter((banner) => Boolean(banner.imageUrl)), [banners]);
  const minSwipeDistance = 50;

  const goToPrevious = () => {
    if (slides.length <= 1) return;
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? slides.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = useCallback(() => {
    if (slides.length <= 1) return;
    const isLastSlide = currentIndex === slides.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  }, [currentIndex, slides.length]);

  useEffect(() => {
    if (currentIndex > 0 && currentIndex >= slides.length) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const timer = setInterval(() => {
      goToNext();
    }, 5000); // Auto-play every 5 seconds
    return () => clearInterval(timer);
  }, [goToNext, slides.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (!slides || slides.length === 0) {
    return null;
  }

  return (
    <section
      className="relative w-full overflow-hidden group bg-gray-50"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((banner) => (
          // <div key={banner.id} className="relative w-full h-full flex-shrink-0">
          //   <div
          //     className="w-full h-full bg-cover bg-center"
          //     style={{ backgroundImage: `url(${banner.imageUrl})` }}
          //   >
          //     <div className="absolute inset-0 bg-black/30"></div>
          //   </div>
          // </div>
          <a
            key={banner.id}
            href={banner.redirect_url || "#"}
          target={banner.redirect_url ? "_blank" : "_self"}
          rel="noopener noreferrer"
          className="relative w-full flex-shrink-0 block"
        >
          <img
            src={banner.imageUrl}
            alt={banner.title || "Banner"}
            className="w-full h-auto object-contain md:object-cover max-h-[calc(100vh-160px)]"
          />
          <div className="absolute inset-0 bg-black/20"></div>
        </a>
      ))}
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={goToPrevious}
        aria-label="Previous slide"
        className="absolute top-1/2 -translate-y-1/2 left-4 bg-white/50 hover:bg-white/80 p-2 rounded-full transition-opacity duration-300 opacity-0 group-hover:opacity-100 z-20"
      >
        <ChevronLeftIcon className="w-6 h-6 text-gray-800" />
      </button>
      <button
        onClick={goToNext}
        aria-label="Next slide"
        className="absolute top-1/2 -translate-y-1/2 right-4 bg-white/50 hover:bg-white/80 p-2 rounded-full transition-opacity duration-300 opacity-0 group-hover:opacity-100 z-20"
      >
        <ChevronRightIcon className="w-6 h-6 text-gray-800" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              currentIndex === index ? "bg-white" : "bg-white/50"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default BannerCarousel;
