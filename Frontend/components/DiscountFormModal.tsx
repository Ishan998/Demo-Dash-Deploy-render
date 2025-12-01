import React, { useState, useEffect } from "react";
// import { Discount, DiscountType, DiscountStatus, Product,DiscountFormState  } from '../types';
import {
  Discount,
  DiscountType,
  DiscountStatus,
  Product,
  DiscountFormState,
} from "../types";
import ProductSelector from "./ProductSelector";

interface DiscountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (discount: Omit<Discount, "id" | "usageCount"> | Discount) => void;
  discountToEdit: Discount | null;
  allProducts: Product[];
}

const generateDiscountCode = () =>
  `PROMO-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
// const [data, setData] = useState<DiscountFormState>(emptyDiscount);

const emptyDiscount: DiscountFormState = {
  name: '',
  code: '',
  type: DiscountType.Percentage,
  value: 10,
  appliesTo: { type: 'all_products' },
  startDate: '',
  endDate: '',
  usageLimit: null,
  usageLimitPerCustomer: null,
};

const DiscountFormModal: React.FC<DiscountFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  discountToEdit,
  allProducts,
}) => {
  const [data, setData] = useState<DiscountFormState>(emptyDiscount);
  // Track selector choices with disambiguated IDs (supports variants)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // const [data, setData] = useState<DiscountFormState>(emptyDiscount);

  useEffect(() => {
    if (discountToEdit) {
      setData({ ...emptyDiscount, ...discountToEdit });
      // Initialize selection from existing productIds (map to product-prefixed IDs)
      const existing = (discountToEdit.appliesTo?.productIds || []).map((pid) => `p-${pid}`);
      setSelectedIds(existing);
    } else {
      setData({ ...emptyDiscount, code: generateDiscountCode() });
      setSelectedIds([]);
    }
  }, [discountToEdit, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.currentTarget;
    if (name === 'type') {
      setData((prev) => ({ ...prev, type: value as DiscountType }));
      return;
    }
    if (["value", "usageLimit", "usageLimitPerCustomer"].includes(name)) {
      setData((prev) => ({ ...prev, [name]: value }));
      return;
    }
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAppliesToChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.currentTarget;
    if (value === "all_products") {
      setData((prev) => ({ ...prev, appliesTo: { type: "all_products" } }));
    } else {
      setData((prev) => ({
        ...prev,
        appliesTo: { type: "specific_products", productIds: [] },
      }));
    }
  };

  const handleProductSelectionChange = (ids: string[]) => {
    setSelectedIds(ids);
    // Map selection to parent product IDs for backend compatibility
    const parentIds = Array.from(new Set(ids.map((sid) => {
      if (sid.startsWith('p-')) {
        return Number(sid.slice(2));
      }
      if (sid.startsWith('v-')) {
        const vid = Number(sid.slice(2));
        const parent = allProducts.find(p => Array.isArray(p.variants) && p.variants.some(v => v.id === vid));
        return parent ? parent.id : undefined;
      }
      return undefined;
    }).filter((x): x is number => typeof x === 'number')));
    setData((prev) => ({
      ...prev,
      appliesTo: { type: "specific_products", productIds: parentIds },
    }));
  };
  const payload = {
    ...data,
    value: data.value ? Number(data.value) : 0,
    usageLimit: data.usageLimit ? Number(data.usageLimit) : undefined,
    usageLimitPerCustomer: data.usageLimitPerCustomer
      ? Number(data.usageLimitPerCustomer)
      : undefined,
  };

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  const now = new Date();
  const startDate = data.startDate ? new Date(data.startDate) : null;
  let status = DiscountStatus.Inactive;

  if (startDate && startDate > now) status = DiscountStatus.Scheduled;
  else status = DiscountStatus.Active;

  const payload = {
    ...data,
    value: Number(data.value),
    usageLimit: data.usageLimit ? Number(data.usageLimit) : undefined,
    usageLimitPerCustomer: data.usageLimitPerCustomer
      ? Number(data.usageLimitPerCustomer)
      : undefined,
    appliesTo: data.appliesTo,
    status: discountToEdit ? data.status : status,
  };

  if (discountToEdit) {
    onSave({ ...discountToEdit, ...payload });
  } else {
    onSave(payload);
  }
};


  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-2xl h-[90vh] rounded-2xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-text-primary">
              {discountToEdit ? "Edit Discount" : "Create Discount"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-text-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </header>

          {/* Scrollable Body */}
          <main className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Discount Name
              </label>
              <input
                type="text"
                name="name"
                value={data.name}
                onChange={handleChange}
                placeholder="e.g. Summer Sale"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Discount Code
                </label>
                <div className="flex items-center mt-1">
                  <input
                    type="text"
                    name="code"
                    value={data.code}
                    onChange={handleChange}
                    className="block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setData((d) => ({ ...d, code: generateDiscountCode() }))
                    }
                    className="ml-2 text-sm text-primary font-semibold whitespace-nowrap"
                  >
                    Autogenerate
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Type
                </label>
                <select
                  name="type"
                  value={data.type}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Discount Value
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">
                    {data.type === DiscountType.Fixed ? "₹" : "%"}
                  </span>
                </div>
                <input
                  type="number"
                  name="value"
                  value={data.value}
                  onChange={handleChange}
                  className="pl-7 block w-full border-gray-300 rounded-md shadow-sm"
                  required
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-md font-semibold text-gray-900 mb-2">
                Applies To
              </h3>
              <select
                value={data.appliesTo.type}
                onChange={handleAppliesToChange}
                className="block w-full border-gray-300 rounded-md shadow-sm mb-4"
              >
                <option value="all_products">All products</option>
                <option value="specific_products">Specific products</option>
              </select>

              {data.appliesTo.type === "specific_products" && (
                <ProductSelector
                  allProducts={allProducts}
                  selectedProductIds={selectedIds}
                  onSelectionChange={handleProductSelectionChange}
                  maxSelection={20}
                />
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="text-md font-semibold text-gray-900 mb-2">
                Usage Limits
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Total usage limit (optional)
                  </label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={data.usageLimit ?? ""}
                    onChange={handleChange}
                    placeholder="No limit"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Usage limit per customer (optional)
                  </label>
                  <input
                    type="number"
                    name="usageLimitPerCustomer"
                    value={data.usageLimitPerCustomer}
                    onChange={handleChange}
                    placeholder="No limit"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    min="1"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-md font-semibold text-gray-900 mb-2">
                Active Dates (optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Start date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={data.startDate || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    End date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={data.endDate || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="flex-shrink-0 flex items-center justify-end p-4 border-t border-gray-200 space-x-4 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="text-text-secondary font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary text-white font-semibold py-2 px-6 rounded-lg hover:bg-opacity-90 transition"
            >
              {discountToEdit ? "Save Changes" : "Create Discount"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default DiscountFormModal;

