import React from 'react';

const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden animate-pulse">
      {/* Image Section */}
      <div className="relative">
        <div className="w-full aspect-square bg-gray-200"></div>
      </div>
      {/* Details Section */}
      <div className="p-3 md:p-4 flex flex-col flex-grow">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-3"></div>
        <div className="flex-grow"></div>
        <div className="flex items-baseline justify-center flex-wrap gap-x-2 mt-2">
          <div className="h-7 bg-gray-300 rounded w-1/3"></div>
          <div className="h-5 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
      {/* Action Buttons Section */}
      <div className="px-3 pb-3 md:px-4 md:pb-4 mt-auto">
        <div className="flex items-stretch space-x-2">
          <div className="h-11 bg-gray-300 rounded-md flex-1"></div>
          <div className="h-11 bg-gray-300 rounded-md flex-1"></div>
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
