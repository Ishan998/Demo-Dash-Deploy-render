import React, { useEffect, useState } from "react";

interface LimitedDealTimerModalProps {
  isOpen: boolean;
  initialValue?: string | null;
  onSave: (value: string) => void;
  onCancel: () => void;
}

const LimitedDealTimerModal: React.FC<LimitedDealTimerModalProps> = ({
  isOpen,
  initialValue,
  onSave,
  onCancel,
}) => {
  const [value, setValue] = useState<string>("");

  useEffect(() => {
    if (initialValue) {
      const dt = new Date(initialValue);
      // Format to datetime-local (YYYY-MM-DDTHH:mm)
      const formatted = dt.toISOString().slice(0, 16);
      setValue(formatted);
    } else {
      setValue("");
    }
  }, [initialValue, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900">Set Limited Deal Timer</h2>
        <p className="text-sm text-gray-600 mt-2">
          Choose when this Limited Deal should expire. Customers will stop seeing the badge after this time.
        </p>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deal End Time
          </label>
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => value && onSave(value)}
            disabled={!value}
            className={`px-4 py-2 text-sm font-semibold rounded-lg text-white ${
              value ? "bg-primary hover:bg-primary/90" : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Save Timer
          </button>
        </div>
      </div>
    </div>
  );
};

export default LimitedDealTimerModal;
