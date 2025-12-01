import React, { useState, useEffect, useCallback, useRef } from 'react';
import { testimonials as originalTestimonials } from '../constants';
import { StarIcon } from './Icon';
import type { Testimonial } from '../types';

const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => (
    <div className="bg-white p-8 border border-gray-100 shadow-sm h-full flex flex-col rounded-lg">
        <div className="flex mb-4">
            {[...Array(testimonial.rating)].map((_, i) => (
                <StarIcon key={i} className="w-5 h-5 text-[#D4AF37]" />
            ))}
        </div>
        <blockquote className="text-gray-600 italic mb-6 flex-grow">
            "{testimonial.quote}"
        </blockquote>
        <p className="font-bold text-gray-800 text-right">- {testimonial.name}</p>
    </div>
);


const Testimonials: React.FC = () => {
  const [shuffledTestimonials, setShuffledTestimonials] = useState<Testimonial[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const isInteracting = useRef(false);
  const interactionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shuffleArray = useCallback((array: Testimonial[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }, []);

  useEffect(() => {
    // Shuffle testimonials once on mount
    setShuffledTestimonials(shuffleArray(originalTestimonials));
  }, [shuffleArray]);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || shuffledTestimonials.length === 0) return;

    const scrollSpeed = 0.5;

    const autoScroll = () => {
      if (!isInteracting.current && carousel) {
        carousel.scrollLeft += scrollSpeed;
        if (carousel.scrollLeft >= carousel.scrollWidth / 2) {
          carousel.scrollLeft = 0;
        }
      }
      animationFrameId.current = requestAnimationFrame(autoScroll);
    };

    animationFrameId.current = requestAnimationFrame(autoScroll);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (interactionTimeout.current) {
        clearTimeout(interactionTimeout.current);
      }
    };
  }, [shuffledTestimonials]);

  const handleInteractionStart = () => {
    isInteracting.current = true;
    if (interactionTimeout.current) {
      clearTimeout(interactionTimeout.current);
    }
  };

  const handleInteractionEnd = () => {
    if (interactionTimeout.current) {
      clearTimeout(interactionTimeout.current);
    }
    interactionTimeout.current = setTimeout(() => {
      isInteracting.current = false;
    }, 3000); // Resume auto-scroll after 3 seconds of inactivity
  };

  return (
    <section className="py-20 bg-[#FDFBF6]">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800">Customer Reviews</h2>
          <p className="text-gray-600 mt-2">What our cherished clients say about their experience.</p>
        </div>

        {/* Desktop Grid View */}
        <div className="hidden md:grid md:grid-cols-3 gap-8">
          {shuffledTestimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className="opacity-0 animate-card-appear"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <TestimonialCard testimonial={testimonial} />
            </div>
          ))}
        </div>
        
        {/* Mobile Carousel View */}
        <div className="md:hidden relative overflow-hidden [mask-image:_linear_gradient(to_right,transparent_0,_black_1rem,_black_calc(100%-1rem),transparent_100%)]">
            <div
                ref={carouselRef}
                className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onMouseDown={handleInteractionStart}
                onMouseUp={handleInteractionEnd}
                onTouchStart={handleInteractionStart}
                onTouchEnd={handleInteractionEnd}
            >
                {[...shuffledTestimonials, ...shuffledTestimonials].map((testimonial, index) => (
                    <div key={index} className="w-[80vw] sm:w-[70vw] flex-shrink-0 px-4 snap-center">
                        <TestimonialCard testimonial={testimonial} />
                    </div>
                ))}
            </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;