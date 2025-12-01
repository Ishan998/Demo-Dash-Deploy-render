
import React from 'react';
import { GemIcon } from './Icon';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-gray-300">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <GemIcon className="w-8 h-8 text-[#D4AF37]" />
              <div>
                <h3 className="text-2xl font-bold text-white leading-tight">Blessing Ornaments</h3>
                <p className="text-xs text-gray-400 tracking-wide">Timeless Elegance, Modern Grace</p>
              </div>
            </div>
            <p className="text-sm">Crafting memories in precious metal and stone since 2005.</p>
            <p className="text-sm mt-4 text-gray-400">GSTIN: 27ABCDE1234F1Z5</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Contact Us</a></li>
              <li><a href="#" className="hover:text-white">Shipping & Returns</a></li>
              <li><a href="#" className="hover:text-white">FAQ</a></li>
              <li><a href="#" className="hover:text-white">Jewellery Care</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">About Aura</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Our Story</a></li>
              <li><a href="#" className="hover:text-white">Craftsmanship</a></li>
              <li><a href="#" className="hover:text-white">Careers</a></li>
              <li><a href="#" className="hover:text-white">Press</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-gray-700 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Blessing Ornaments. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
