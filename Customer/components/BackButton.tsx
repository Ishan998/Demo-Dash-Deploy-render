import React from 'react';
import { ChevronLeftIcon } from './Icon';

interface BackButtonProps {
  onClick: () => void;
  isVisible: boolean;
}

const BackButton: React.FC<BackButtonProps> = ({ onClick, isVisible }) => {
  if (!isVisible) {
    return null;
  }
  return (
    <button
      onClick={onClick}
      className="fixed top-5 left-5 z-50 bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white hover:scale-105 transition-all duration-300"
      aria-label="Go back"
    >
      <ChevronLeftIcon className="w-6 h-6 text-gray-800" />
    </button>
  );
};

export default BackButton;
