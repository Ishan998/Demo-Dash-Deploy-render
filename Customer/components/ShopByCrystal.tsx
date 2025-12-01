import React, { useEffect, useRef, useState } from 'react';
import type { Crystal } from '../types';

interface Props {
  items?: Crystal[];
  onSelect?: (crystalName: string) => void;
}

const ShopByCrystal: React.FC<Props> = ({ items, onSelect }) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const data = Array.isArray(items) ? items : [];
  const [rowSpans, setRowSpans] = useState<Record<number, number>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const gridItems = Array.from(entry.target.children);
            gridItems.forEach((item, index) => {
              setTimeout(() => {
                item.classList.add('is-visible');
              }, index * 120); // Staggered delay
            });
            observer.unobserve(entry.target); // Animate only once
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
      }
    );
    
    const currentRef = gridRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const handleClick = (event: React.MouseEvent, name: string) => {
    if (!onSelect) return;
    event.preventDefault();
    onSelect(name);
  };

  const handleImageLoad = (id: number, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const ratio = img.naturalHeight / Math.max(img.naturalWidth, 1);
    const span = Math.min(3, Math.max(1, Math.round(ratio * 2)));
    setRowSpans((prev) => (prev[id] === span ? prev : { ...prev, [id]: span }));
  };

  if (data.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800">Shop by Crystal</h2>
          <p className="text-gray-600 mt-2">Explore the unique energy and beauty of our hand-selected gemstones.</p>
        </div>
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          style={{ gridAutoRows: '180px' }}
        >
          {data.map((crystal) => (
            <a
              href="#"
              key={crystal.id}
              className={`grid-item group relative overflow-hidden flex items-center justify-center rounded-xl shadow-sm ${crystal.gridClass || ''}`}
              style={{ gridRowEnd: `span ${rowSpans[crystal.id] || 1}` }}
              onClick={(e) => handleClick(e, crystal.name)}
            >
              <img
                src={crystal.imageUrl}
                alt={crystal.name}
                className="absolute w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                loading="lazy"
                onLoad={(e) => handleImageLoad(crystal.id, e)}
              />
              <div className="absolute inset-0 bg-black/40 transition-colors group-hover:bg-black/50"></div>
              <div className="relative text-center text-white p-4">
                <h3 className="text-3xl font-semibold tracking-wider">{crystal.name}</h3>
                <div className="mt-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <span className="py-2 px-6 border border-white rounded-full text-sm">Explore Now</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopByCrystal;
