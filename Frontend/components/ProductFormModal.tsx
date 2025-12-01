import React, { useEffect, useState } from "react";
import { Product, ProductVariant, ProductStatus } from "../types";
import ImageUploader from "./_shared/ImageUploader";
import DeliveryInfoForm from "./_shared/DeliveryInfoForm";

/**
 * Product Form Modal
 * - Polished Tailwind UI (matches your premium card look)
 * - Logic intact
 * - Adds Tags input
 * - "Enable Variant Mode" → forwards draft to VariantFormModal
 */

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void | Promise<any>;
  productToEdit: Product | null;

  /** When variant flow is enabled, send draft to variant modal */
  onOpenVariantForm?: (productDraft: Omit<Product, "id" | "status">) => void;
}

const generateSku = () =>
  `SKU-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

const emptyProduct: Omit<Product, "id" | "status"> = {
  name: "",
  description: "",
  mainCategory: "Apparel",
  subCategory: "",
  materials: [],
  sku: "",
  mrp: 0,
  sellingPrice: 0,
  stock: 0,
  gst: 0,
  images: [],
  specifications: "",
  crystalName: "",
  colors: [],
  occasions: [],
  sizes: [],
  isReturnable: true,
  variants: [],
  deliveryInfo: {
    weight: 0,
    width: 0,
    height: 0,
    depth: 0,
    deliveryCharges: 0,
    returnCharges: 0,
    deliveryInDays: 0,
  },
  tags: [],
};

const inputCls =
  "w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary bg-white/80 backdrop-blur shadow-sm placeholder:text-gray-400";
const labelCls = "block text-sm font-medium text-gray-700";
const sectionTitleCls =
  "text-lg font-semibold text-gray-800 mt-2 mb-3 flex items-center gap-2";
const cardCls =
  "rounded-2xl bg-white shadow-xl ring-1 ring-gray-100 p-6 space-y-6";

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  onOpenVariantForm,
}) => {
  const [productData, setProductData] =
    useState<Omit<Product, "id" | "status">>({ ...emptyProduct });

  // For UX + backward-compat
  const [hasVariants, setHasVariants] = useState(false);
  const [enableVariantMode, setEnableVariantMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Comma inputs
  const [colorsInput, setColorsInput] = useState("");
  const [occasionsInput, setOccasionsInput] = useState("");
  const [materialsInput, setMaterialsInput] = useState("");
  const [sizesInput, setSizesInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    if (productToEdit) {
      setProductData({ ...productToEdit });
      setHasVariants(productToEdit.variants.length > 0);
      setEnableVariantMode(productToEdit.variants.length > 0);

      setColorsInput(productToEdit.colors.join(", "));
      setOccasionsInput(productToEdit.occasions.join(", "));
      setMaterialsInput(productToEdit.materials.join(", "));
      setSizesInput((productToEdit as any).sizes?.join(", ") || "");
      setTagsInput(productToEdit.tags.join(", "));
    } else {
      setProductData({ ...emptyProduct, sku: generateSku() });
      setHasVariants(false);
      setEnableVariantMode(false);

      setColorsInput("");
      setOccasionsInput("");
      setMaterialsInput("");
      setSizesInput("");
      setTagsInput("");
    }
  }, [productToEdit, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setProductData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setProductData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDeliveryChange = (name: keyof Product["deliveryInfo"], value: number) => {
    setProductData((prev) => ({
      ...prev,
      deliveryInfo: { ...prev.deliveryInfo, [name]: value },
    }));
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: Date.now(),
      name: "",
      sku: `${productData.sku}-VAR-${productData.variants.length + 1}`,
      stock: 0,
      mrp: 0,
      sellingPrice: 0,
      images: [],
      tags: [],
    };
    setProductData((prev) => ({
      ...prev,
      variants: [...prev.variants, newVariant],
    }));
  };

  const handleToggleVariants = (checked: boolean) => {
    setEnableVariantMode(checked);
    setHasVariants(checked);
    if (checked && productData.variants.length === 0) addVariant();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parse comma lists
    const colors = colorsInput.split(",").map((s) => s.trim()).filter(Boolean);
    const occasions = occasionsInput.split(",").map((s) => s.trim()).filter(Boolean);
    const materials = materialsInput.split(",").map((s) => s.trim()).filter(Boolean);
    const sizes = sizesInput.split(",").map((s) => s.trim()).filter(Boolean);
    const tags = tagsInput.split(",").map((s) => s.trim()).filter(Boolean);

    // Status calc
    const totalStock = hasVariants
      ? productData.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
      : Number(productData.stock || 0);

    const status: ProductStatus =
      totalStock > 0 ? ProductStatus.InStock : ProductStatus.OutOfStock;

    // Variant Mode → forward to variant modal (product fields still editable there)
    if (enableVariantMode && onOpenVariantForm) {
      const draft: Omit<Product, "id" | "status"> = {
        ...productData,
        colors,
        occasions,
        materials,
        sizes,
        tags,
      };
      onOpenVariantForm(draft);
      return;
    }

    // Normal save (no variants)
    const finalProduct: Product = productToEdit
      ? { ...productToEdit, ...productData, colors, occasions, materials, sizes, tags, status }
      : { ...productData, id: Date.now(), colors, occasions, materials, sizes, tags, status };

    if (!hasVariants) {
      finalProduct.variants = [];
    } else {
      finalProduct.mrp = 0;
      finalProduct.sellingPrice = 0;
      finalProduct.stock = 0;
    }

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
        className="w-full max-w-6xl max-h-[92vh] rounded-3xl backdrop-blur bg-gradient-to-b from-white to-white/95 shadow-2xl ring-1 ring-black/5 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {saving && (
          <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white shadow-lg">
              <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm font-medium text-gray-700">Saving product…</span>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/70 backdrop-blur">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">
              {productToEdit ? "Edit Product" : "Add New Product"}
            </h2>

            {/* Enable Variant Mode */}
            <label className="inline-flex items-center gap-2 text-sm bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              <input
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                checked={enableVariantMode}
                onChange={(e) => handleToggleVariants(e.target.checked)}
              />
              <span className="text-gray-700">Enable Variant Mode</span>
            </label>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
            aria-label="Close"
            title="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto h-[calc(92vh-64px-68px)]">
          <div className={`p-6 space-y-8 ${saving ? 'pointer-events-none opacity-60' : ''}`}>

            {/* Product Images */}
            <div className={cardCls}>
              <div className="flex items-center justify-between">
                <h3 className={sectionTitleCls}>Product Images</h3>
              </div>
              <ImageUploader
                images={productData.images}
                onImagesChange={(imgs) => setProductData((p) => ({ ...p, images: imgs }))}
              />
            </div>

            {/* Basic Info */}
            <div className={cardCls}>
              <h3 className={sectionTitleCls}>Basic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={productData.name}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="e.g. Kundan Necklace Set"
                    required
                  />
                </div>

                <div>
                  <label className={labelCls}>Main Category</label>
                  <select
                    name="mainCategory"
                    value={productData.mainCategory}
                    onChange={handleChange}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Sub Category</label>
                  <input
                    type="text"
                    name="subCategory"
                    value={productData.subCategory}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="e.g. Necklaces, Earrings, Bangles"
                  />
                </div>

                <div>
                  <label className={labelCls}>Materials (comma-separated)</label>
                  <input
                    type="text"
                    value={materialsInput}
                    onChange={(e) => setMaterialsInput(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Alloy, Brass, AD Stones"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Will be saved as an array: {materialsInput ? JSON.stringify(materialsInput.split(",").map(s=>s.trim()).filter(Boolean)) : "[]"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelCls}>MRP</label>
                  <input
                    type="number"
                    name="mrp"
                    value={productData.mrp}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="e.g. 1299"
                    disabled={hasVariants}
                  />
                </div>
                <div>
                  <label className={labelCls}>Selling Price</label>
                  <input
                    type="number"
                    name="sellingPrice"
                    value={productData.sellingPrice}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="e.g. 899"
                    disabled={hasVariants}
                  />
                </div>
                <div>
                  <label className={labelCls}>GST (%)</label>
                  <input
                    type="number"
                    name="gst"
                    value={productData.gst}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="e.g. 3"
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  name="description"
                  value={productData.description}
                  onChange={handleChange}
                  rows={3}
                  className={inputCls}
                  placeholder="Write a short and clear description…"
                />
              </div>

              <div>
                <label className={labelCls}>Product Specifications</label>
                <textarea
                  name="specifications"
                  value={productData.specifications}
                  onChange={handleChange}
                  rows={3}
                  className={inputCls}
                  placeholder="Threadwork, stitch, care instructions, etc."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Crystal Name (Optional)</label>
                  <input
                    type="text"
                    name="crystalName"
                    value={productData.crystalName}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="e.g. Rose Quartz"
                  />
                </div>
                <div>
                  <label className={labelCls}>Unique Code (SKU)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      name="sku"
                      value={productData.sku}
                      onChange={handleChange}
                      className={inputCls}
                      placeholder="Auto-generate or enter custom"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setProductData((p) => ({ ...p, sku: generateSku() }))}
                      className="px-3 py-2 text-sm font-semibold text-primary border border-primary rounded-xl hover:bg-primary hover:text-white transition"
                    >
                      Autogenerate
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Colors (comma-separated)</label>
                  <input
                    type="text"
                    value={colorsInput}
                    onChange={(e) => setColorsInput(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Red, Mint, Off-white"
                  />
                </div>
                <div>
                  <label className={labelCls}>Occasions (comma-separated)</label>
                  <input
                    type="text"
                    value={occasionsInput}
                    onChange={(e) => setOccasionsInput(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Festive, Office, Daily wear"
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Sizes (comma-separated)</label>
                <input
                  type="text"
                  value={sizesInput}
                  onChange={(e) => setSizesInput(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. XS, S, M, L"
                />
              </div>

              {/* ✅ Tags field was missing earlier */}
              <div>
                <label className={labelCls}>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. New Arrival, Bestseller"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Will be saved as: {tagsInput ? JSON.stringify(tagsInput.split(",").map(s=>s.trim()).filter(Boolean)) : "[]"}
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isReturnable"
                  name="isReturnable"
                  checked={productData.isReturnable}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="isReturnable" className="ml-2 text-sm font-medium text-gray-900">
                  Returnable?
                </label>
              </div>
            </div>

            {/* Delivery / RPD */}
            <div className={cardCls}>
              <h3 className={sectionTitleCls}>Delivery &amp; RPD</h3>
              <DeliveryInfoForm
                deliveryInfo={productData.deliveryInfo}
                isReturnable={productData.isReturnable}
                onChange={handleDeliveryChange}
              />
            </div>

            {/* Variant Mode Note */}
            {enableVariantMode && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 text-blue-800 px-4 py-3 shadow-sm">
                <div className="text-sm">
                  <b>Variant Mode</b> is enabled. Clicking <b>Continue to Variants</b> will open the Variant Form.
                  You can still edit all product fields there and add per-variant rows (Name, SKU, MRP, Price, Stock) with variant images.
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white/70 backdrop-blur">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-700 font-semibold py-2 px-4 rounded-xl hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-white font-semibold py-2 px-6 rounded-xl shadow hover:bg-opacity-90 transition disabled:opacity-60"
            >
              {saving ? 'Saving…' : (productToEdit
                ? enableVariantMode
                  ? "Continue to Variants"
                  : "Save Changes"
                : enableVariantMode
                ? "Continue to Variants"
                : "Add Product")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
