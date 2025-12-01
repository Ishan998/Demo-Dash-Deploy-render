import React from 'react';
import type { RichDescriptionSection } from '../types';

const RichProductDescription: React.FC<{ sections: RichDescriptionSection[] }> = ({ sections }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      {sections.map((section) => {
        switch (section.type) {
          case 'image-text':
            return (
              <div key={section.id} className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center`}>
                <div className={` ${section.imagePosition === 'right' ? 'md:order-last' : ''}`}>
                  <img src={section.imageUrl} alt={section.title} className="rounded-lg shadow-lg w-full h-auto object-cover aspect-video" loading="lazy" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-bold text-gray-800">{section.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{section.text}</p>
                </div>
              </div>
            );
          case 'three-column':
            return (
              <div key={section.id} className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
                {section.columns.map(col => (
                  <div key={col.title}>
                     <img src={col.iconUrl} alt={col.title} className="mx-auto h-16 w-16 rounded-full object-cover mb-4" loading="lazy" />
                     <h4 className="text-xl font-semibold text-gray-800 mb-2">{col.title}</h4>
                     <p className="text-gray-600 text-sm">{col.text}</p>
                  </div>
                ))}
              </div>
            );
          case 'banner':
            return (
              <div key={section.id} className="relative h-[250px] md:h-[400px] flex items-center justify-center text-white rounded-lg overflow-hidden">
                <img src={section.imageUrl} alt={section.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/40"></div>
                <h3 className="relative z-10 text-3xl md:text-5xl font-bold text-center px-4">{section.title}</h3>
              </div>
            )
          default:
            return null;
        }
      })}
    </div>
  );
};

export default RichProductDescription;