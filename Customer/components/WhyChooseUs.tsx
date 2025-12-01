import React from 'react';
import { GemIcon, GlobeAltIcon, ShieldCheckIcon, TruckIcon } from './Icon';

const features = [
  {
    icon: GemIcon,
    title: 'Exquisite Craftsmanship',
    description: 'Each piece is a work of art, handcrafted by master artisans with unparalleled attention to detail.'
  },
  {
    icon: GlobeAltIcon,
    title: 'Ethically Sourced',
    description: 'We are committed to responsible sourcing, using only conflict-free diamonds and recycled precious metals.'
  },
  {
    icon: ShieldCheckIcon,
    title: 'Secure Shopping',
    description: 'Your peace of mind is our priority. Enjoy a secure and seamless shopping experience with encrypted payments.'
  },
  {
    icon: TruckIcon,
    title: 'Insured Shipping',
    description: 'Your precious purchase is fully insured and delivered to your doorstep with our complimentary, secure shipping.'
  }
];

const WhyChooseUs: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800">The Blessing Promise</h2>
          <p className="text-gray-600 mt-2">Our promise of quality, ethics, and unparalleled service.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-[#FDFBF6] rounded-full p-4">
                   <feature.icon className="w-8 h-8 text-[#D4AF37]" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;