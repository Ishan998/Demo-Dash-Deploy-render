import React, { useRef, useEffect } from 'react';
import type { ProductReview } from '../types';
import { CloseIcon } from './Icon';
import { ReviewItem } from './ProductDetailsTabs';

interface CustomerReviewsModalProps {
  reviews: ProductReview[];
  productName: string;
  onClose: () => void;
}

const CustomerReviewsModal: React.FC<CustomerReviewsModalProps> = ({ reviews, productName, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-lg shadow-2xl w-full max-w-2xl flex flex-col h-[80vh]">
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Customer Reviews</h2>
            <p className="text-sm text-gray-500">{productName}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {reviews.map(review => (
            <ReviewItem key={review.id} review={review} />
          ))}
          {reviews.length === 0 && (
            <p className="text-center text-gray-500 py-8">No reviews yet for this product.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerReviewsModal;
