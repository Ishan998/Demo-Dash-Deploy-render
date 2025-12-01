import React from "react";

interface DeliveryInfo {
  weight: number;
  width: number;
  height: number;
  depth: number;
  deliveryCharges: number;
  returnCharges: number;
  deliveryInDays: number;
}

interface DeliveryInfoFormProps {
  deliveryInfo: DeliveryInfo;
  isReturnable: boolean;
  onChange: (name: keyof DeliveryInfo, value: number) => void;
}

const DeliveryInfoForm: React.FC<DeliveryInfoFormProps> = ({
  deliveryInfo,
  isReturnable,
  onChange,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-700">
          Weight (kg)
        </label>
        <input
          type="number"
          step="0.01"
          value={deliveryInfo.weight}
          onChange={(e) => onChange("weight", parseFloat(e.target.value) || 0)}
          placeholder="e.g. 0.25"
          className="w-full px-4 py-2 mt-1 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary bg-white/80 backdrop-blur shadow-sm placeholder:text-gray-400"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700">
          Width (cm)
        </label>
        <input
          type="number"
          value={deliveryInfo.width}
          onChange={(e) => onChange("width", parseFloat(e.target.value) || 0)}
          placeholder="e.g. 10"
          className="w-full px-4 py-2 mt-1 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary bg-white/80 backdrop-blur shadow-sm placeholder:text-gray-400"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700">
          Height (cm)
        </label>
        <input
          type="number"
          value={deliveryInfo.height}
          onChange={(e) => onChange("height", parseFloat(e.target.value) || 0)}
          placeholder="e.g. 3"
          className="w-full px-4 py-2 mt-1 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary bg-white/80 backdrop-blur shadow-sm placeholder:text-gray-400"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700">
          Depth (cm)
        </label>
        <input
          type="number"
          value={deliveryInfo.depth}
          onChange={(e) => onChange("depth", parseFloat(e.target.value) || 0)}
          placeholder="e.g. 12"
          className="w-full px-4 py-2 mt-1 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary bg-white/80 backdrop-blur shadow-sm placeholder:text-gray-400"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700">
          Delivery (Days)
        </label>
        <input
          type="number"
          value={deliveryInfo.deliveryInDays}
          onChange={(e) =>
            onChange("deliveryInDays", parseFloat(e.target.value) || 0)
          }
          placeholder="e.g. 3"
          className="w-full px-4 py-2 mt-1 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary bg-white/80 backdrop-blur shadow-sm placeholder:text-gray-400"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700">
          Delivery Charges
        </label>
        <input
          type="number"
          step="0.01"
          value={deliveryInfo.deliveryCharges}
          onChange={(e) =>
            onChange("deliveryCharges", parseFloat(e.target.value) || 0)
          }
          placeholder="e.g. 49"
          className="w-full px-4 py-2 mt-1 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary bg-white/80 backdrop-blur shadow-sm placeholder:text-gray-400"
        />
      </div>
      {isReturnable && (
        <div>
          <label className="block text-xs font-medium text-gray-700">
            Return Charges
          </label>
          <input
            type="number"
            step="0.01"
            value={deliveryInfo.returnCharges}
            onChange={(e) =>
              onChange("returnCharges", parseFloat(e.target.value) || 0)
            }
            placeholder="e.g. 49"
            className="w-full px-4 py-2 mt-1 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary bg-white/80 backdrop-blur shadow-sm placeholder:text-gray-400"
          />
        </div>
      )}
    </div>
  );
};

export default DeliveryInfoForm;
