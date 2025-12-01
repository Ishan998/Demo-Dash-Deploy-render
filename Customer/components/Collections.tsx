import React from 'react';
import { collections } from '../constants';

const Collections: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800">Our Collections</h2>
          <p className="text-gray-600 mt-2">Curated selections for every occasion and style.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {collections.map((collection) => (
            <div key={collection.id} className="group relative overflow-hidden h-96">
              <img
                src={collection.imageUrl}
                alt={collection.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-8">
                <h3 className="text-3xl font-semibold text-white mb-2">{collection.name}</h3>
                <p className="text-white opacity-0 group-hover:opacity-100 max-w-xs transition-opacity duration-300 mb-4">
                  {collection.description}
                </p>
                <a href="#" className="text-white font-bold tracking-wider uppercase text-sm border-b-2 border-[#D4AF37] self-start hover:text-[#D4AF37] transition-colors">
                  Explore
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Collections;