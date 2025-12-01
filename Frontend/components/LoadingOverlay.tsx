import React from "react";

const LoadingOverlay: React.FC<{ show: boolean; label?: string }> = ({ show, label = "Loading..." }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20">
      <div className="bg-white rounded-lg shadow-lg px-4 py-3">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <span className="text-sm text-gray-700">{label}</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;

