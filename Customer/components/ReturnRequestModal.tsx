import React, { useState, useRef, useEffect } from 'react';
import type { Order } from '../types';
import { CloseIcon, TrashIcon } from './Icon';

interface ReturnRequestModalProps {
  order: Order;
  onClose: () => void;
  onSubmit: (orderId: number, reason: string, photos: File[]) => void;
}

const ReturnRequestModal: React.FC<ReturnRequestModalProps> = ({ order, onClose, onSubmit }) => {
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFormValid = photos.length >= 7 && reason.trim() !== '';

  useEffect(() => {
    // Cleanup object URLs to prevent memory leaks
    return () => {
      photoPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [photoPreviews]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const allFiles = [...photos, ...newFiles];
      if (allFiles.length > 15) {
          setError("You can upload a maximum of 15 photos.");
          return;
      }
      setPhotos(allFiles);

      // FIX: Explicitly type `file` as `File` to fix type inference issue.
      const newPreviews = newFiles.map((file: File) => URL.createObjectURL(file));
      setPhotoPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removePhoto = (indexToRemove: number) => {
    setPhotos(prev => prev.filter((_, index) => index !== indexToRemove));
    setPhotoPreviews(prev => {
      const urlToRemove = prev[indexToRemove];
      URL.revokeObjectURL(urlToRemove);
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const handleSubmit = () => {
    if (photos.length < 7) {
      setError('Please upload at least 7 photos to proceed.');
      return;
    }
    if (reason.trim() === '') {
        setError('Please provide a reason for the return.');
        return;
    }
    setError('');
    onSubmit(order.id, reason, photos);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-lg shadow-2xl w-full max-w-2xl flex flex-col h-[90vh] max-h-[700px]">
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Request Return</h2>
            <p className="text-sm text-gray-500">For Order: {order.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><CloseIcon className="w-6 h-6" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Photos ({photos.length}/7 minimum)
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#D4AF37] hover:bg-gray-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-sm text-gray-500">Click to browse or drag & drop images here.</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 10MB each. Max 15 photos.</p>
            </div>
             {photos.length > 0 && (
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {photoPreviews.map((previewUrl, index) => (
                        <div key={index} className="relative aspect-square">
                            <img src={previewUrl} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                            <button onClick={() => removePhoto(index)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>
            )}
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
              Reason for Return
            </label>
            <textarea
              id="reason"
              rows={5}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D4AF37] focus:ring-[#D4AF37] sm:text-sm"
              placeholder="Please describe the issue with the product in detail..."
            />
          </div>
           {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="w-full bg-black text-white font-bold py-3 rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Submit Return Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnRequestModal;
