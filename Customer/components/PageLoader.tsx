import React from 'react';
import { GemIcon } from './Icon';

const PageLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="text-center">
        <GemIcon className="w-16 h-16 text-[#D4AF37] mx-auto animate-spin-slow" />
        <p className="mt-4 text-lg font-semibold text-gray-700">Loading exquisite pieces...</p>
      </div>
    </div>
  );
};

export default PageLoader;
