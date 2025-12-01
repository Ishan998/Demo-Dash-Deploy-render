
import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon } from './Icon';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  totalAmount: number;
  qrCodeData: string;
  onPaymentSuccess: () => void;
  onPaymentFailure: (reason: string) => void;
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  orderId,
  totalAmount,
  qrCodeData,
  onPaymentSuccess,
  onPaymentFailure,
}) => {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            onPaymentFailure('Session expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, onPaymentFailure]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-lg shadow-2xl w-full max-w-sm flex flex-col animate-card-appear">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Complete Payment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-600">Scan the QR code with your UPI app</p>
          <div className="my-4 p-4 border-2 border-dashed rounded-lg inline-block">
             <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData)}`}
                alt="UPI QR Code"
                className="w-48 h-48"
            />
          </div>
          <p className="font-bold text-2xl text-gray-900">₹{totalAmount.toLocaleString('en-IN')}</p>
          <p className="text-sm text-gray-500 mt-1">Order ID: {orderId}</p>

          <div className="mt-4 bg-yellow-50 text-yellow-800 rounded-lg p-3">
            <p className="font-bold text-lg">{formatTime(timeLeft)}</p>
            <p className="text-xs">Time left to complete payment</p>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50">
          <p className="text-center text-xs text-gray-500 mb-3 font-semibold">[ FOR TESTING PURPOSES ONLY ]</p>
          <div className="flex space-x-2">
            <button
              onClick={onPaymentSuccess}
              className="flex-1 bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm"
            >
              Simulate Payment Success
            </button>
             <button
              onClick={() => onPaymentFailure('declined by user')}
              className="flex-1 bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 transition-colors text-sm"
            >
              Simulate Payment Failure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
