import React, { useState } from 'react';
import type { MegaMenuContent, MegaMenuLink, Product } from '../types';
import { ChevronRightIcon, GemIcon } from './Icon';

interface MegaMenuProps {
  menu: MegaMenuContent;
  allProducts: Product[];
  onNavigateWithFilter: (filter: MegaMenuLink['filter']) => void;
  onSelectProduct: (product: Product) => void;
}

const MegaMenu: React.FC<MegaMenuProps> = ({
  menu,
  allProducts,
  onNavigateWithFilter,
  onSelectProduct,
}) => {
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  const resolvePreviewProduct = (filter: MegaMenuLink['filter']): Product | null => {
    if (!filter) return null;

    const norm = (val?: string | null) => (val ?? '').toString().trim().toLowerCase();
    const target = norm(filter.value);

    const filtered = allProducts.filter((product) => {
      const cat = norm((product as any).main_category ?? (product as any).category);
      const sub = norm((product as any).sub_category ?? (product as any).subcategory);
      const metal = norm((product as any).metal);
      const materials = Array.isArray(product.materials) ? product.materials.map(norm) : [];
      const gemstone = norm((product as any).crystal_name ?? (product as any).gemstone);
      const colors = Array.isArray((product as any).colors) ? (product as any).colors.map(norm) : [];
      const badge = norm((product as any).badge);
      const tags = Array.isArray(product.tags) ? product.tags.map(norm) : [];

      switch (filter.type) {
        case 'category':
          return cat === target;
        case 'subcategory':
          return sub === target;
        case 'gemstone':
          return gemstone === target;
        case 'badge':
          return badge === target || tags.includes(target);
        case 'material':
          return materials.includes(target) || metal === target;
        case 'metal':
          return metal === target || materials.includes(target);
        case 'color':
          return colors.includes(target) || norm((product as any).color) === target;
        default:
          return false;
      }
    });

    const pool = filtered.length > 0 ? filtered : allProducts;
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const handleLinkHover = (filter: MegaMenuLink['filter']) => {
    setTimeout(() => {
      const product = resolvePreviewProduct(filter);
      setPreviewProduct(product);
    }, 150);
  };

  return (
    <div className="bg-[#FDFBF6]/95 backdrop-blur-sm border-b border-gray-200 shadow-lg">
      <div className="container mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Left: Menu Links */}
        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8" onMouseLeave={() => setPreviewProduct(null)}>
          {menu.sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name} onMouseEnter={() => handleLinkHover(link.filter)}>
                    <a
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        if (link.filter) onNavigateWithFilter(link.filter);
                      }}
                      className="text-sm text-gray-600 hover:text-[#D4AF37] flex items-center group"
                    >
                      <span>{link.name}</span>
                      <ChevronRightIcon className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-all" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Right: Preview */}
        <div className="md:col-span-1 flex justify-center items-start">
          {previewProduct ? (
            <div onClick={() => onSelectProduct(previewProduct)} className="cursor-pointer group w-[200px]">
              <div className="overflow-hidden rounded-lg mb-3 bg-gray-100 w-[200px] h-[200px]">
                <img
                  src={previewProduct.images?.[0] || (previewProduct as any).imageUrl || '/placeholder.png'}
                  alt={previewProduct.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h4 className="text-sm font-semibold text-gray-800 group-hover:text-[#D4AF37]">
                {previewProduct.name}
              </h4>
              <p className="text-sm text-gray-600">
                ₹{(
                  Number((previewProduct as any).selling_price ??
                    (previewProduct as any).sellingPrice ??
                    (previewProduct as any).price ??
                    (previewProduct as any).mrp ??
                    0) || 0
                ).toLocaleString('en-IN')}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center w-[200px] h-[200px] bg-gray-100/50 rounded-lg border-2 border-dashed">
              <div className="text-center text-gray-400">
                <GemIcon className="w-10 h-10 mx-auto mb-2" />
                <p className="text-xs font-semibold">Hover for Inspiration</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MegaMenu;
