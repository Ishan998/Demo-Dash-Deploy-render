// ✅ FILE: src/components/VariantFormModal.tsx

import React, { useEffect, useState } from "react";
import { Product, ProductVariant, ProductStatus } from "../types";
import ImageUploader from "./_shared/ImageUploader";
import DeliveryInfoForm from "./_shared/DeliveryInfoForm";
import VariantTable from "./_shared/VariantTable";

interface VariantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseProduct: Omit<Product, "id" | "status">;
  onSave: (product: Product) => void | Promise<any>;
  productToEdit?: Product | null;
}

const sectionTitleCls = "text-lg font-semibold text-gray-800 mb-3";
const cardCls =
  "rounded-2xl bg-white shadow-xl ring-1 ring-gray-100 p-6 space-y-6";
const inputCls =
  "w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary bg-white/80 placeholder:text-gray-400";

const VariantFormModal: React.FC<VariantFormModalProps> = ({
  isOpen,
  onClose,
  baseProduct,
  onSave,
  productToEdit = null,
}) => {
  const [product, setProduct] = useState<Omit<Product, "id" | "status">>(
    baseProduct
  );
  const normalizeVariants = (list: ProductVariant[]) =>
    (list || []).map((v, idx) => ({
      ...v,
      id: v.id ?? Date.now() + idx,
      materials: Array.isArray((v as any).materials) ? (v as any).materials : baseProduct.materials || [],
      colors: Array.isArray((v as any).colors) ? (v as any).colors : baseProduct.colors || [],
      occasions: Array.isArray((v as any).occasions) ? (v as any).occasions : baseProduct.occasions || [],
      sizes: Array.isArray((v as any).sizes)
        ? (v as any).sizes
        : (v as any).size
          ? [(v as any).size]
          : (baseProduct as any).sizes || [],
    }));

  const [variants, setVariants] = useState<ProductVariant[]>(
    normalizeVariants(baseProduct.variants || [])
  );
  const [showCopyPrompt, setShowCopyPrompt] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setVariants(normalizeVariants(baseProduct.variants || []));
  }, [baseProduct]);

  // Auto status logic
  const totalStock = variants.reduce(
    (sum, variant) => sum + (Number(variant.stock) || 0),
    0
  );
  const status: ProductStatus =
    totalStock > 0 ? ProductStatus.InStock : ProductStatus.OutOfStock;

  // Copy product fields only if user clicks "Copy" button
  const copyBaseProduct = () => {
    setProduct({ ...baseProduct });
    setShowCopyPrompt(false);
  };

  // If user doesn't want to copy, just continue
  const skipCopyProduct = () => {
    setShowCopyPrompt(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalProduct: Product = productToEdit
      ? {
          ...productToEdit,
          ...product,
          id: productToEdit.id,
          status,
          variants,
          mrp: 0,
          sellingPrice: 0,
          stock: 0,
        }
      : {
          ...(product as Product),
          id: Date.now(),
          status,
          variants,
          mrp: 0,
          sellingPrice: 0,
          stock: 0,
        };

    try {
      setSaving(true);
      const maybe = onSave(finalProduct);
      if (maybe && typeof (maybe as any).then === 'function') {
        await (maybe as Promise<any>);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[60] flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl max-h-[92vh] rounded-3xl bg-gradient-to-b from-white to-white/95 shadow-2xl ring-1 ring-gray-200 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {saving && (
          <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white shadow-lg">
              <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm font-medium text-gray-700">Saving variants…</span>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white/70 backdrop-blur">
          <h2 className="text-xl font-bold text-gray-900">
            {productToEdit ? "Edit Product Variants" : "Create Product Variants"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Show Copy Prompt */}
        {showCopyPrompt && (
          <div className="p-6 bg-blue-50 border-b border-blue-200 text-blue-800 text-sm flex justify-between items-center">
            <span>
              Do you want to copy all product details (images, delivery info, GST, tags, etc) into this variant form?
            </span>
            <div className="flex gap-3">
              <button
                onClick={copyBaseProduct}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                ✅ Yes, Copy
              </button>
              <button
                onClick={skipCopyProduct}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                ❌ No, I’ll Enter Manually
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto h-[calc(92vh-64px-64px)] p-6 space-y-8">

          {/* Product Details Section */}
          <div className={`${cardCls} ${saving ? 'pointer-events-none opacity-60' : ''}`}>
            <h3 className={sectionTitleCls}>Product Details (Editable)</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={product.name}
                  onChange={(e) =>
                    setProduct((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className={inputCls}
                  placeholder="e.g. Kundan Necklace Set"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Main Category</label>
                <select
                  value={product.mainCategory}
                  onChange={(e) =>
                    setProduct((prev) => ({ ...prev, mainCategory: e.target.value }))
                  }
                  className={inputCls}
                >
                  <option>Apparel</option>
                  <option>Electronics</option>
                  <option>Accessories</option>
                  <option>Home Goods</option>
                  <option>Groceries</option>
                  <option>Crystals</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                rows={3}
                value={product.description}
                onChange={(e) =>
                  setProduct((prev) => ({ ...prev, description: e.target.value }))
                }
                className={inputCls}
                placeholder="Short and clear product description"
              />
            </div>
          </div>

          {/* Image Section */}
          <div className={`${cardCls} ${saving ? 'pointer-events-none opacity-60' : ''}`}>
            <h3 className={sectionTitleCls}>Product Images</h3>
            <ImageUploader
              images={product.images}
              onImagesChange={(imgs) =>
                setProduct((prev) => ({ ...prev, images: imgs }))
              }
            />
          </div>

          {/* Delivery Info Section */}
          <div className={`${cardCls} ${saving ? 'pointer-events-none opacity-60' : ''}`}>
            <h3 className={sectionTitleCls}>Delivery / RPD Information</h3>
            <DeliveryInfoForm
              deliveryInfo={product.deliveryInfo}
              isReturnable={product.isReturnable}
              onChange={(name, val) =>
                setProduct((prev) => ({
                  ...prev,
                  deliveryInfo: { ...prev.deliveryInfo, [name]: val },
                }))
              }
            />
          </div>

          {/* Variant Table Section */}
          <div className={cardCls}>
            <h3 className={sectionTitleCls}>Variants</h3>
            <VariantTable
              baseSku={product.sku}
              variants={variants}
              onChange={setVariants}
              enableVariantImageUpload={true}
            />
            <p className="text-sm text-gray-600 mt-2">
              Total Stock: <b>{totalStock}</b>
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-white/70 backdrop-blur">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Product & Variants'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VariantFormModal;
