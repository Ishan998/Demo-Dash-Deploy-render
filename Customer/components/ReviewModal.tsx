import React, { useState } from 'react';

interface ReviewModalProps {
  productName: string;
  onSubmit: (payload: { rating: number; title: string; comment: string }) => Promise<void> | void;
  onClose: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ productName, onSubmit, onClose, isSubmitting, error }) => {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setLocalError('Please select a rating between 1 and 5.');
      return;
    }
    setLocalError(null);
    await onSubmit({ rating, title, comment });
  };

  const handleStarClick = (value: number) => {
    if (isSubmitting) return;
    setRating(value);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Write a Review</h2>
            <p className="text-sm text-gray-500">{productName}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => {
                const isActive = value <= rating;
                return (
                  <button
                    type="button"
                    key={value}
                    onClick={() => handleStarClick(value)}
                    className={`text-2xl transition-colors ${isActive ? 'text-yellow-500' : 'text-gray-300'} ${isSubmitting ? 'cursor-not-allowed opacity-60' : 'hover:text-yellow-400'}`}
                    aria-label={`${value} star${value > 1 ? 's' : ''}`}
                    disabled={isSubmitting}
                  >
                    ★
                  </button>
                );
              })}
              <span className="text-sm text-gray-600 ml-1">{rating} / 5</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
              placeholder="Great quality and finish"
              maxLength={200}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Your Review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] h-28 resize-none"
              placeholder="Share your experience with this product..."
              disabled={isSubmitting}
            />
          </div>
          {(localError || error) && (
            <p className="text-sm text-red-600">{localError || error}</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
