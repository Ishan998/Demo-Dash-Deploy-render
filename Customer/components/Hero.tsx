
import React from 'react';

interface HeroProps {
  onNavigateToAllProducts: () => void;
}

const Hero: React.FC<HeroProps> = ({ onNavigateToAllProducts }) => {
  return (
    <section className="relative h-[60vh] min-h-[450px] md:h-[80vh] md:min-h-[500px] flex items-center justify-center text-center text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <video
          src="https://media.istockphoto.com/id/473169179/video/diamond-loose-image-loopable.mp4?s=mp4-640x640-is&k=20&c=DgbItqLxG_NePPNxN1DeNoltk620r55Nu0Lq6yP0pXk="
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
         
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>
      <div className="relative z-10 p-6">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold leading-tight tracking-wide">
          Timeless Elegance, Redefined
        </h1>
        <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto mt-4 font-light">
          Discover exquisite jewellery that tells your story.
        </p>
        <button
          onClick={onNavigateToAllProducts}
          className="mt-8 px-10 py-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-white font-bold rounded-full text-lg hover:from-amber-600 hover:to-yellow-500 transition-all duration-300 transform hover:scale-105 shadow-lg shine-button"
        >
          Shop Now
        </button>
      </div>
    </section>
  );
};

export default Hero;