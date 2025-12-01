import React from 'react';
import WhyChooseUs from '../components/WhyChooseUs';
import { GemIcon } from '../components/Icon';

const founders = [
  {
    name: 'Ananya Sharma',
    title: 'Co-Founder & Chief Designer',
    imageUrl: 'https://picsum.photos/seed/founder1/500/500',
    bio: 'With a degree from the National Institute of Design and a family legacy in gemology, Ananya brings a unique blend of modern aesthetics and traditional craftsmanship to Blessing Ornaments. Her vision is to create jewellery that is not just worn, but experienced—a personal talisman for the modern woman.'
  },
  {
    name: 'Rohan Verma',
    title: 'Co-Founder & CEO',
    imageUrl: 'https://picsum.photos/seed/founder2/500/500',
    bio: 'Rohan, an MBA graduate with a passion for sustainable business, handles the operational heart of Blessing Ornaments. He is dedicated to ensuring that every piece is ethically sourced and that the brand operates with integrity, transparency, and a deep respect for both the planet and its people.'
  }
];

const AboutUsPage: React.FC = () => {
  return (
    <main className="bg-white">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[300px] flex items-center justify-center text-center text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://picsum.photos/id/145/1800/800"
            alt="Craftsmanship"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="relative z-10 p-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold leading-tight tracking-wide">
            The Story of Blessing Ornaments
          </h1>
          <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto mt-4 font-light">
            Crafting more than jewellery; we craft legacies.
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 bg-[#FDFBF6]">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Where Passion Meets Precision</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Blessing Ornaments was born from a simple, yet profound love for the timeless beauty of fine jewellery. Founded in 2005, our journey began not in a boardroom, but in a small, sunlit workshop filled with a passion for artistry and a deep respect for the Earth's most precious gifts. 
            </p>
            <p className="text-gray-600 leading-relaxed">
              Our mission is to create exquisite pieces that transcend trends, becoming cherished heirlooms that carry stories from one generation to the next. We believe that every gem has a soul and every design has a purpose—to celebrate life's most precious moments.
            </p>
          </div>
          <div>
            <img 
              src="https://picsum.photos/id/53/800/600"
              alt="Blessing Ornaments Workshop"
              className="rounded-lg shadow-lg w-full h-auto object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>
      
       {/* Expertise Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Our Expertise in Every Detail</h2>
          <p className="text-gray-600 max-w-3xl mx-auto mb-12">
            With decades of combined experience, our team of master artisans, gemologists, and designers represent the pinnacle of the craft. We blend age-old techniques with modern innovation to ensure every Blessing Ornaments piece is a masterpiece of quality and design.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="p-6">
              <GemIcon className="w-12 h-12 text-[#D4AF37] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Master Craftsmanship</h3>
              <p className="text-gray-600 text-sm">Our artisans meticulously handcraft each piece, ensuring flawless details from the initial sketch to the final polish.</p>
            </div>
             <div className="p-6">
              <img src="https://picsum.photos/id/11/100/100" alt="Certified Quality" className="mx-auto w-12 h-12 rounded-full mb-4" loading="lazy" />
              <h3 className="text-xl font-semibold mb-2">Certified Quality</h3>
              <p className="text-gray-600 text-sm">We use only the finest, ethically-sourced materials, with every major gemstone GIA certified for your assurance.</p>
            </div>
             <div className="p-6">
              <img src="https://picsum.photos/id/31/100/100" alt="Timeless Design" className="mx-auto w-12 h-12 rounded-full mb-4" loading="lazy" />
              <h3 className="text-xl font-semibold mb-2">Timeless Design</h3>
              <p className="text-gray-600 text-sm">Our design philosophy marries classic elegance with contemporary style, creating pieces that are both current and enduring.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <WhyChooseUs />

      {/* Meet the Founders Section */}
      <section className="py-20 bg-[#FDFBF6]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800">Meet Our Founders</h2>
            <p className="text-gray-600 mt-2">The visionaries behind every sparkle.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {founders.map((founder) => (
              <div key={founder.name} className="text-center">
                <div className="relative inline-block mb-4">
                  <img
                    src={founder.imageUrl}
                    alt={founder.name}
                    className="w-48 h-48 rounded-full object-cover mx-auto shadow-lg"
                    loading="lazy"
                  />
                </div>
                <h3 className="text-2xl font-semibold text-gray-800">{founder.name}</h3>
                <p className="text-sm text-[#D4AF37] font-bold tracking-wider mb-3">{founder.title}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{founder.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default AboutUsPage;