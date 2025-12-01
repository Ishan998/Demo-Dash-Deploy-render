import React from 'react';
import { Discount } from '../types';
import { formatCurrency } from '../constants';

interface ShareDiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  discount: Discount;
  setToast: (toast: { message: string, type: 'success' | 'error' } | null) => void;
}

const ShareDiscountModal: React.FC<ShareDiscountModalProps> = ({ isOpen, onClose, discount, setToast }) => {
    if (!isOpen) return null;

    const discountValue = discount.type === 'Percentage' ? `${discount.value}%` : formatCurrency(discount.value);
    const message = `✨ Special Offer from Aura Jewels! ✨\n\nUse code: ${discount.code}\n\nGet an amazing ${discountValue} OFF on your next purchase.\n\n${discount.endDate ? `Hurry, this offer is only valid until ${new Date(discount.endDate).toLocaleDateString('en-GB')}!` : 'Shop your heart out with our latest collections!'}\n\nExplore now: [YourWebsite.com]`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(message);
        setToast({ message: 'Discount message copied to clipboard!', type: 'success' });
    };

    const shareOnWhatsApp = () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const shareViaEmail = () => {
        const subject = `Your Discount from Aura Jewels: ${discount.name}`;
        const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        window.location.href = mailtoUrl;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-text-primary">Share Discount</h2>
                     <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{message}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <button
                        onClick={copyToClipboard}
                        className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        Copy Text
                    </button>
                    <button
                        onClick={shareOnWhatsApp}
                        className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        Share on WhatsApp
                    </button>
                    <button
                        onClick={shareViaEmail}
                        className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        Share via Email
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareDiscountModal;