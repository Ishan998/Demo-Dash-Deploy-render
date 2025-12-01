import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Product,
  ProductVariant,
  ProductStatus,
  MainCategory,
  SubCategory,
  Material,
  Color,
  Occasion,
  RPD,
} from "../types";
import ProductTagDropdown from "../components/ProductTagDropdown";
import LimitedDealTimerModal from "../components/LimitedDealTimerModal";
import { LIMITED_DEAL_TAG } from "../constants";
import MultiSelectChipInput from "../components/MultiSelectChipInput";

/* ---------------------------------------------
   Helpers
---------------------------------------------- */
const generateSku = () =>
  `SKU-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
  });

// Parse numerics robustly, ignoring currency/commas and empty strings
const parseNumberSafe = (value: any): number => {
  try {
    const cleaned = (value ?? "").toString().replace(/[^0-9.]/g, "");
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
};

const AUTOSAVE_KEY_PREFIX = "product-form-draft";
const AUTOSAVE_VERSION = 1;
const AUTOSAVE_DEBOUNCE_MS = 600;

const getDraftStorageKey = (productId?: number | null) =>
  `${AUTOSAVE_KEY_PREFIX}:${productId ?? "new"}`;

const isBrowser = typeof window !== "undefined";

// Shared size options for both base product and variants
const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];

/* ---------------------------------------------
   Defaults
---------------------------------------------- */
const emptyProduct: Omit<Product, "id" | "status"> = {
  name: "",
  description: "",
  mainCategory: "",
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
  rpdId: undefined,
  limitedDealEndsAt: null,
};

  const normalizeProductData = (
  data: Partial<Omit<Product, "id" | "status">>
): Omit<Product, "id" | "status"> => {
  const safeVariants: ProductVariant[] = (data.variants || []).map((variant, idx) => ({
    ...variant,
    id: variant.id ?? Date.now() + idx,
    name: variant.name || "",
    images: Array.isArray(variant.images) ? variant.images : [],
    tags: Array.isArray(variant.tags) ? variant.tags : [],
    materials: Array.isArray((variant as any).materials) ? (variant as any).materials : (data.materials || []),
    colors: Array.isArray((variant as any).colors) ? (variant as any).colors : (data.colors || []),
    occasions: Array.isArray((variant as any).occasions) ? (variant as any).occasions : (data.occasions || []),
    sizes: Array.isArray((variant as any).sizes)
      ? (variant as any).sizes
      : Array.isArray((data as any).sizes)
        ? (data as any).sizes
        : (data as any).size
          ? [(data as any).size]
          : [],
    rpdId: variant.rpdId ?? null,
  }));

  const normalizedSizes =
    Array.isArray((data as any).sizes)
      ? (data as any).sizes
      : (data as any).size
        ? [(data as any).size]
        : [];

  return {
    ...emptyProduct,
    ...data,
    images: Array.isArray(data.images) ? data.images : [],
    materials: Array.isArray(data.materials) ? data.materials : [],
    colors: Array.isArray(data.colors) ? data.colors : [],
    occasions: Array.isArray(data.occasions) ? data.occasions : [],
    sizes: normalizedSizes,
    tags: Array.isArray(data.tags) ? data.tags : [],
    variants: safeVariants,
    deliveryInfo: {
      ...emptyProduct.deliveryInfo,
      ...(data.deliveryInfo || {}),
    },
    limitedDealEndsAt: (data as any).limitedDealEndsAt ?? (data as any).limited_deal_ends_at ?? null,
  };
};

/* ---------------------------------------------
   Props
---------------------------------------------- */
interface ProductFormPageProps {
  onClose: () => void;
  onSave: (product: Omit<Product, "id"> | Product) => void | Promise<any>;
  productToEdit: Product | null;
  mainCategories: MainCategory[];
  subCategories: SubCategory[];
  materials: Material[];
  colors: Color[];
  occasions: Occasion[];
  rpds: RPD[];
}

/* ---------------------------------------------
   Image Uploader (kept compact like your modal)
---------------------------------------------- */
const ImageUploader: React.FC<{
  images: string[];
  onUpload: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}> = ({ images, onUpload, onRemove }) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Product Images
      </label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          onUpload(e.dataTransfer.files);
        }}
        onClick={() => document.getElementById("file-upload")?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-primary bg-blue-50"
            : "border-gray-300 hover:border-primary"
        }`}
      >
        <input
          id="file-upload"
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => onUpload(e.target.files)}
        />
        <p className="text-gray-500">
          Drag & Drop Images Here or Click to Upload
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-4">
        {images.map((src, idx) => (
          <div key={idx} className="relative">
            <img
              src={src}
              alt={`preview ${idx}`}
              className="h-24 w-24 object-cover rounded-md"
            />
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------------------------------------------
   Component
---------------------------------------------- */
const ProductFormPage: React.FC<ProductFormPageProps> = ({
  onClose,
  onSave,
  productToEdit,
  mainCategories,
  subCategories,
  materials,
  colors,
  occasions,
  rpds,
}) => {
  const [productData, setProductData] = useState<
    Omit<Product, "id" | "status">
  >({ ...emptyProduct });
  const [saving, setSaving] = useState(false);
  const [isLimitedDealModalOpen, setIsLimitedDealModalOpen] = useState(false);

  // Tabs: "base" or variant index
  const [activeTab, setActiveTab] = useState<"base" | number>("base");
  const draftStorageKey = useMemo(
    () => getDraftStorageKey(productToEdit?.id),
    [productToEdit?.id]
  );
  const hasHydratedDraftRef = useRef(false);

  useEffect(() => {
    hasHydratedDraftRef.current = false;
  }, [draftStorageKey]);

  // Compact comma inputs (to match your alignment sample)
  // Multi-select for materials/colors/occasions is rendered only on base view

  // init + restore draft
  useEffect(() => {
    const baseData = productToEdit
      ? normalizeProductData(productToEdit)
      : normalizeProductData({ ...emptyProduct, sku: generateSku() });

    let nextData = baseData;
    let nextActiveTab: "base" | number = "base";

    if (isBrowser) {
      const rawDraft = localStorage.getItem(draftStorageKey);
      if (rawDraft) {
        try {
          const draft = JSON.parse(rawDraft);
          const matchesContext =
            draft &&
            draft.version === AUTOSAVE_VERSION &&
            draft.context === (productToEdit ? "edit" : "new") &&
            (productToEdit ? draft.productId === productToEdit.id : !draft.productId);

          if (matchesContext && draft.productData) {
            nextData = normalizeProductData(draft.productData);
            if (
              draft.activeTab === "base" ||
              (typeof draft.activeTab === "number" && nextData.variants[draft.activeTab])
            ) {
              nextActiveTab = draft.activeTab;
            }
          }
        } catch (err) {
          console.warn("[ProductForm] Failed to parse autosave draft", err);
        }
      }
    }

    setProductData(nextData);
    setActiveTab(nextActiveTab);
    hasHydratedDraftRef.current = true;
  }, [productToEdit, draftStorageKey]);

  const isVariantView = activeTab !== "base";
  const currentVariant: ProductVariant | null = useMemo(() => {
    if (isVariantView) {
      return productData.variants[activeTab as number] || null;
    }
    return null;
  }, [isVariantView, activeTab, productData.variants]);

  // Filter sub-categories based on selected main category
  const selectedMain = useMemo(() => {
    return mainCategories.find((m) => m.name === productData.mainCategory) || null;
  }, [mainCategories, productData.mainCategory]);

  const filteredSubCategories = useMemo(() => {
    if (!selectedMain) return [] as SubCategory[];
    return subCategories.filter((s) => {
      const val: any = (s as any).main_category;
      const id = val && typeof val === 'object' ? val.id : Number(val);
      return id === selectedMain.id;
    });
  }, [subCategories, selectedMain]);

  const clearDraft = useCallback(() => {
    if (!isBrowser) return;
    localStorage.removeItem(draftStorageKey);
  }, [draftStorageKey]);

  useEffect(() => {
    if (!isBrowser || !hasHydratedDraftRef.current) return;

    const payload = {
      version: AUTOSAVE_VERSION,
      context: productToEdit ? "edit" : "new",
      productId: productToEdit?.id ?? null,
      productData,
      activeTab,
      updatedAt: Date.now(),
    };

    const timeout = window.setTimeout(() => {
      try {
        localStorage.setItem(draftStorageKey, JSON.stringify(payload));
      } catch (err) {
        console.warn("[ProductForm] Failed to persist autosave draft", err);
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [productData, activeTab, draftStorageKey, productToEdit]);

  /* ---------------------------------------------
     Base handlers (typed to avoid TS 'unknown' issues)
  ---------------------------------------------- */
  const handleBaseChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement & HTMLTextAreaElement;
    const { name, type } = target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setProductData((p) => ({ ...p, [name]: checked }));
      return;
    }

    const value = target.value;

    if (name === "rpdId") {
      setProductData((p) => ({ ...p, rpdId: value ? parseInt(value, 10) : undefined }));
      return;
    }

    if (["mrp", "sellingPrice", "stock", "gst"].includes(name)) {
      const num = parseNumberSafe(value);
      console.log("[BaseChange]", name, { raw: value, parsed: num });
      setProductData((p) => ({ ...p, [name]: num }));
      return;
    }

    // Reset subCategory when mainCategory changes
    if (name === "mainCategory") {
      setProductData((p) => ({ ...p, mainCategory: value, subCategory: "" }));
      return;
    }

    setProductData((p) => ({ ...p, [name]: value }));
  };

  const handleDeliveryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const num = parseNumberSafe(value);
    console.log("[DeliveryChange]", name, { raw: value, parsed: num });
    setProductData((p) => ({
      ...p,
      deliveryInfo: { ...p.deliveryInfo, [name]: num },
    }));
  };

  const handleBaseImageUpload = async (files: FileList | null) => {
    if (!files) return;
    const imgs = await Promise.all(Array.from(files).map(fileToBase64));
    setProductData((p) => ({ ...p, images: [...p.images, ...imgs] }));
  };

  const removeBaseImage = (idx: number) => {
    setProductData((p) => ({
      ...p,
      images: p.images.filter((_, i) => i !== idx),
    }));
  };

  /* ---------------------------------------------
     Variant handlers
  ---------------------------------------------- */
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
      materials: [...productData.materials],
      colors: [...productData.colors],
      occasions: [...productData.occasions],
      sizes: [...productData.sizes],
      rpdId: null,
    };
    setProductData((p) => ({ ...p, variants: [...p.variants, newVariant] }));
    setActiveTab(productData.variants.length);
  };

  const removeVariant = (index: number) => {
    setProductData((p) => ({
      ...p,
      variants: p.variants.filter((_, i) => i !== index),
    }));
    setActiveTab("base");
  };

  const handleVariantChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const t = e.target as HTMLInputElement;
    const { name, value } = t;

    setProductData((p) => {
      const variants = [...p.variants];
      const v: any = { ...variants[index] };

      if (["mrp", "sellingPrice", "stock"].includes(name)) {
        const num = parseNumberSafe(value);
        console.log("[VariantChange]", { index, field: name, raw: value, parsed: num });
        v[name] = num;
      } else if (name === "rpdId") {
        v[name] = value ? parseInt(value, 10) : undefined;
      } else {
        v[name] = value;
      }

      variants[index] = v;
      return { ...p, variants };
    });
  };

  const handleVariantListChange = (
    index: number,
    key: "materials" | "colors" | "occasions" | "sizes",
    items: string[]
  ) => {
    setProductData((p) => {
      const variants = [...p.variants];
      variants[index] = { ...variants[index], [key]: items };
      return { ...p, variants };
    });
  };

  const handleVariantTagsChange = (index: number, tags: string[]) => {
    setProductData((p) => {
      const variants = [...p.variants];
      variants[index] = { ...variants[index], tags };
      return { ...p, variants };
    });
  };

  const handleVariantImageUpload = async (
    index: number,
    files: FileList | null
  ) => {
    if (!files) return;
    const imgs = await Promise.all(Array.from(files).map(fileToBase64));
    setProductData((p) => {
      const variants = [...p.variants];
      variants[index] = {
        ...variants[index],
        images: [...variants[index].images, ...imgs],
      };
      return { ...p, variants };
    });
  };

  const removeVariantImage = (index: number, imgIdx: number) => {
    setProductData((p) => {
      const variants = [...p.variants];
      variants[index] = {
        ...variants[index],
        images: variants[index].images.filter((_, i) => i !== imgIdx),
      };
      return { ...p, variants };
    });
  };

  /* ---------------------------------------------
     Submit
  ---------------------------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("[Submit] Base values", {
      isVariantView,
      mrp: productData.mrp,
      sellingPrice: productData.sellingPrice,
    });
    if (!isVariantView && productData.sellingPrice > productData.mrp) {
      console.warn("[Validation] Base Selling Price exceeds MRP", {
        mrp: productData.mrp,
        sellingPrice: productData.sellingPrice,
      });
      alert("Selling Price cannot exceed MRP!");
      return;
    }
    for (const v of productData.variants) {
      console.log("[Submit] Variant values", {
        name: v.name,
        mrp: v.mrp,
        sellingPrice: v.sellingPrice,
      });
      if (v.sellingPrice > v.mrp) {
        console.warn("[Validation] Variant Selling Price exceeds MRP", v);
        alert(`Variant "${v.name || "Unnamed"}": Selling Price > MRP`);
        return;
      }
    }

    const totalStock =
      Number(productData.stock) +
      productData.variants.reduce((s, v) => s + Number(v.stock || 0), 0);

    const status =
      totalStock > 0 ? ProductStatus.InStock : ProductStatus.OutOfStock;

    const finalProduct = productToEdit
      ? // For edits, merge carefully to preserve IDs and include new image data
        {
          ...productData, // Start with all the form's current data (including new images)
          id: productToEdit.id, // Explicitly keep the original product ID
          // Ensure variant IDs are preserved from the original object
          variants: productData.variants.map((variant) => {
            const originalVariant = productToEdit.variants.find(
              (v) => v.id === variant.id
            );
            return { ...variant, id: originalVariant ? originalVariant.id : variant.id };
          }),
          status, // Set the calculated status
        }
      : {
          ...productData,
          status,
        };

    let savedSuccessfully = false;
    try {
      setSaving(true);
      const maybePromise = onSave(finalProduct);
      if (maybePromise && typeof (maybePromise as any).then === "function") {
        await (maybePromise as Promise<any>);
      }
      savedSuccessfully = true;
    } finally {
      setSaving(false);
      if (savedSuccessfully) {
        clearDraft();
      }
    }
  };

  const handleClose = useCallback(() => {
    clearDraft();
    onClose();
  }, [clearDraft, onClose]);

  /* ---------------------------------------------
     UI (Alignment like your modal form)
  ---------------------------------------------- */
  return (
    <div className="bg-background flex flex-col h-full relative">
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
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0 bg-card">
          <h2 className="text-xl font-bold text-text-primary">
            {productToEdit ? "Edit Product" : "Add New Product"}
          </h2>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-gray-200"
              title="Close"
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
          </div>
        </header>

        {/* Tabs */}
        <nav className="flex items-center border-b bg-card px-4">
          <TabButton active={activeTab === "base"} onClick={() => setActiveTab("base")}>
            Base Product
          </TabButton>
          {productData.variants.map((v, i) => (
            <TabButton key={v.id ?? i} active={activeTab === i} onClick={() => setActiveTab(i)}>
              <span className="truncate max-w-[160px]">
                {v.name || `Variant ${i + 1}`}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeVariant(i);
                }}
                className="ml-2 text-gray-400 hover:text-red-500"
                title="Remove Variant"
              >
                &times;
              </button>
            </TabButton>
          ))}
          <button
            type="button"
            onClick={addVariant}
            className="ml-2 text-primary py-3 px-3 font-semibold text-sm"
          >
            + Add Variant
          </button>
        </nav>

        {/* Body */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className={`p-6 space-y-6 w-full max-w-5xl mx-auto ${saving ? 'pointer-events-none opacity-60' : ''}`}>
            {/* Image Uploader */}
            {!isVariantView ? (
              <ImageUploader
                images={productData.images}
                onUpload={handleBaseImageUpload}
                onRemove={removeBaseImage}
              />
            ) : (
              <ImageUploader
                images={currentVariant?.images || []}
                onUpload={(files) =>
                  handleVariantImageUpload(activeTab as number, files)
                }
                onRemove={(imgIdx) =>
                  removeVariantImage(activeTab as number, imgIdx)
                }
              />
            )}

            {/* Row: Name + Main Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Product Name
                </label>
                <input
                  name="name"
                  value={productData.name}
                  onChange={handleBaseChange}
                  disabled={isVariantView}
                  placeholder="e.g. Kundan Necklace Set"
                  className="mt-1 block w-full px-4 py-2 border-gray-300 rounded-xl shadow-sm focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Main Category
                </label>
                <select
                  name="mainCategory"
                  value={productData.mainCategory}
                  onChange={handleBaseChange}
                  disabled={isVariantView}
                  className="mt-1 block w-full px-4 py-2 border-gray-300 rounded-xl shadow-sm focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select</option>
                  {mainCategories.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row: Sub Category + SKU (Base/Variant) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Sub Category
                </label>
                <select
                  name="subCategory"
                  value={productData.subCategory}
                  onChange={handleBaseChange}
                  disabled={isVariantView || !productData.mainCategory}
                  className="mt-1 block w-full px-4 py-2 border-gray-300 rounded-xl shadow-sm focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select</option>
                  {filteredSubCategories.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {!isVariantView ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Unique Code (SKU)
                  </label>
                  <div className="flex items-center mt-1">
                    <input
                      name="sku"
                      value={productData.sku}
                      onChange={handleBaseChange}
                      placeholder="Auto-generate or enter custom"
                      className="block w-full px-4 py-2 border-gray-300 rounded-xl shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setProductData((p) => ({ ...p, sku: generateSku() }))
                      }
                      className="ml-2 text-sm text-primary font-semibold whitespace-nowrap"
                    >
                      Autogenerate
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Variant SKU
                  </label>
                  <input
                    name="sku"
                    value={currentVariant?.sku || ""}
                    onChange={(e) =>
                      handleVariantChange(activeTab as number, e)
                    }
                    className="mt-1 block w-full px-4 py-2 border-gray-300 rounded-xl shadow-sm"
                  />
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                value={productData.description}
                onChange={handleBaseChange}
                disabled={isVariantView}
                rows={3}
                placeholder="Short and clear product description"
                className="mt-1 block w-full px-4 py-3 border-gray-300 rounded-xl shadow-sm focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Product Specifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product Specifications
              </label>
              <textarea
                name="specifications"
                value={productData.specifications}
                onChange={handleBaseChange}
                disabled={isVariantView}
                rows={3}
                placeholder="Material, plating, care instructions, etc."
                className="mt-1 block w-full px-4 py-3 border-gray-300 rounded-xl shadow-sm focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Crystal + GST */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Crystal Name (Optional)
                </label>
                <input
                  name="crystalName"
                  value={productData.crystalName}
                  onChange={handleBaseChange}
                  disabled={isVariantView}
                  placeholder="e.g. Rose Quartz"
                  className="mt-1 block w-full px-4 py-2 border-gray-300 rounded-xl shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  GST (%)
                </label>
                <input
                  type="number"
                  name="gst"
                  value={productData.gst}
                  onChange={handleBaseChange}
                  disabled={isVariantView}
                  placeholder="e.g. 3"
                  className="mt-1 block w-full px-4 py-2 border-gray-300 rounded-xl shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Pricing & Stock */}
            {!isVariantView ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    MRP
                  </label>
                <input
                  type="number"
                  name="mrp"
                  value={productData.mrp}
                  onChange={handleBaseChange}
                  placeholder="e.g. 1299"
                  className="mt-1 block w-full px-4 py-2 border-gray-300 rounded-xl shadow-sm"
                />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Selling Price
                  </label>
                <input
                  type="number"
                  name="sellingPrice"
                  value={productData.sellingPrice}
                  onChange={handleBaseChange}
                  placeholder="e.g. 899"
                  className="mt-1 block w-full px-4 py-2 border-gray-300 rounded-xl shadow-sm"
                />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    In Stock Number
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={productData.stock}
                    onChange={handleBaseChange}
                    className="mt-1 block w-full px-4 py-2 border-gray-300 rounded-xl shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Product Tags
                  </label>
                  <div className="mt-1 block w-full">
                    <ProductTagDropdown
                      productTags={productData.tags}
                      onTagsChange={(t) => {
                        setProductData((p) => {
                          const next = { ...p, tags: t };
                          if (!t.includes(LIMITED_DEAL_TAG)) {
                            next.limitedDealEndsAt = null;
                          }
                          return next;
                        });
                        if (t.includes(LIMITED_DEAL_TAG)) {
                          setIsLimitedDealModalOpen(true);
                        }
                      }}
                      onTagToggle={(tag, checked) => {
                        if (tag === LIMITED_DEAL_TAG && checked) {
                          setIsLimitedDealModalOpen(true);
                        }
                        if (tag === LIMITED_DEAL_TAG && !checked) {
                          setProductData((p) => ({ ...p, limitedDealEndsAt: null }));
                        }
                      }}
                    />
                    {productData.tags.includes(LIMITED_DEAL_TAG) && (
                      <div className="mt-2 text-xs text-gray-600 flex items-center justify-between">
                        <span>
                          {productData.limitedDealEndsAt
                            ? `Limited Deal ends at: ${new Date(productData.limitedDealEndsAt).toLocaleString()}`
                            : "Limited Deal selected. Add an end time to show the timer."}
                        </span>
                        <button
                          type="button"
                          className="ml-3 text-primary font-semibold hover:underline"
                          onClick={() => setIsLimitedDealModalOpen(true)}
                        >
                          Set timer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-12 gap-x-4 items-center px-2">
                  <div className="col-span-3 text-sm font-medium text-gray-500">
                    Variant Name
                  </div>
                  <div className="col-span-3 text-sm font-medium text-gray-500">
                    SKU
                  </div>
                  <div className="col-span-2 text-sm font-medium text-gray-500">
                    MRP
                  </div>
                  <div className="col-span-2 text-sm font-medium text-gray-500">
                    Selling Price
                  </div>
                  <div className="col-span-2 text-sm font-medium text-gray-500">
                    Stock
                  </div>
                </div>
                <div className="grid grid-cols-12 gap-x-4 items-center p-2 bg-gray-50 rounded-md">
                  <div className="col-span-3">
                    <input
                      name="name"
                      placeholder="e.g., Red, S"
                      value={currentVariant?.name || ""}
                      onChange={(e) =>
                        handleVariantChange(activeTab as number, e)
                      }
                      className="w-full px-3 py-2 border-gray-300 rounded-lg shadow-sm text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      name="sku"
                      placeholder="SKU"
                      value={currentVariant?.sku || ""}
                      onChange={(e) =>
                        handleVariantChange(activeTab as number, e)
                      }
                      className="w-full px-3 py-2 border-gray-300 rounded-lg shadow-sm text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      name="mrp"
                      type="number"
                      placeholder="MRP"
                      value={currentVariant?.mrp ?? 0}
                      onChange={(e) =>
                        handleVariantChange(activeTab as number, e)
                      }
                      className="w-full px-3 py-2 border-gray-300 rounded-lg shadow-sm text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      name="sellingPrice"
                      type="number"
                      placeholder="Price"
                      value={currentVariant?.sellingPrice ?? 0}
                      onChange={(e) =>
                        handleVariantChange(activeTab as number, e)
                      }
                      className="w-full px-3 py-2 border-gray-300 rounded-lg shadow-sm text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      name="stock"
                      type="number"
                      placeholder="Stock"
                      value={currentVariant?.stock ?? 0}
                      onChange={(e) =>
                        handleVariantChange(activeTab as number, e)
                      }
                      className="w-full px-3 py-2 border-gray-300 rounded-lg shadow-sm text-sm"
                    />
                  </div>
                </div>

                {/* Variant Tags + Variant RPD */}
                <div className="border-t pt-4">
                  <h3 className="text-md font-semibold mb-2">Variant Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Variant Tags
                      </label>
                      <ProductTagDropdown
                        productTags={currentVariant?.tags || []}
                        onTagsChange={(t) =>
                          handleVariantTagsChange(activeTab as number, t)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Variant RPD
                      </label>
                      <select
                        name="rpdId"
                        value={currentVariant?.rpdId || ""}
                        onChange={(e) =>
                          handleVariantChange(activeTab as number, e)
                        }
                        className="mt-1 block w-full px-3 py-2 border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
                      >
                        <option value="">Select RPD</option>
                        {rpds.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-4">
                    <MultiSelectChipInput
                      label="Materials (Variant)"
                      placeholder="Select materials"
                      availableOptions={materials.map((m) => ({ id: m.id, name: m.name }))}
                      selectedItems={currentVariant?.materials || []}
                      onSelectedItemsChange={(items) =>
                        handleVariantListChange(activeTab as number, "materials", items)
                      }
                    />
                    <MultiSelectChipInput
                      label="Colors (Variant)"
                      placeholder="Select colors"
                      availableOptions={colors.map((c) => ({ id: c.id, name: c.name }))}
                      selectedItems={currentVariant?.colors || []}
                      onSelectedItemsChange={(items) =>
                        handleVariantListChange(activeTab as number, "colors", items)
                      }
                    />
                    <MultiSelectChipInput
                      label="Occasions (Variant)"
                      placeholder="Select occasions"
                      availableOptions={occasions.map((o) => ({ id: o.id, name: o.name }))}
                      selectedItems={currentVariant?.occasions || []}
                      onSelectedItemsChange={(items) =>
                        handleVariantListChange(activeTab as number, "occasions", items)
                      }
                    />
                    <MultiSelectChipInput
                      label="Sizes (Variant)"
                      placeholder="Select sizes"
                      availableOptions={sizeOptions.map((s, idx) => ({ id: idx, name: s }))}
                      selectedItems={currentVariant?.sizes || []}
                      onSelectedItemsChange={(items) =>
                        handleVariantListChange(activeTab as number, "sizes", items)
                      }
                    />
                  </div>
                </div>
              </>
            )}

            {!isVariantView && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <MultiSelectChipInput
                    label="Materials"
                    placeholder="Select materials"
                    availableOptions={materials.map((m) => ({ id: m.id, name: m.name }))}
                    selectedItems={productData.materials}
                    onSelectedItemsChange={(items) =>
                      setProductData((p) => ({ ...p, materials: items }))
                    }
                  />
                </div>
                <div>
                  <MultiSelectChipInput
                    label="Colors"
                    placeholder="Select colors"
                    availableOptions={colors.map((c) => ({ id: c.id, name: c.name }))}
                    selectedItems={productData.colors}
                    onSelectedItemsChange={(items) =>
                      setProductData((p) => ({ ...p, colors: items }))
                    }
                  />
                </div>
                <div>
                  <MultiSelectChipInput
                    label="Occasions"
                    placeholder="Select occasions"
                    availableOptions={occasions.map((o) => ({ id: o.id, name: o.name }))}
                    selectedItems={productData.occasions}
                    onSelectedItemsChange={(items) =>
                      setProductData((p) => ({ ...p, occasions: items }))
                    }
                  />
                </div>
                <div>
                  <MultiSelectChipInput
                    label="Sizes"
                    placeholder="Select sizes"
                    availableOptions={sizeOptions.map((s, idx) => ({ id: idx, name: s }))}
                    selectedItems={productData.sizes}
                    onSelectedItemsChange={(items) =>
                      setProductData((p) => ({ ...p, sizes: items }))
                    }
                  />
                </div>
              </div>
            )}

            {/* Returnable + Base RPD (RPD also editable for base) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center pt-6">
                <input
                  id="isReturnable"
                  type="checkbox"
                  name="isReturnable"
                  checked={productData.isReturnable}
                  onChange={handleBaseChange}
                  disabled={isVariantView}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded disabled:cursor-not-allowed"
                />
                <label
                  htmlFor="isReturnable"
                  className="ml-2 block text-sm font-medium text-gray-900"
                >
                  Returnable?
                </label>
              </div>

              {!isVariantView && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    RPD (Base Product)
                  </label>
                  <select
                    name="rpdId"
                    value={productData.rpdId || ""}
                    onChange={handleBaseChange}
                    className="mt-1 block w-full px-4 py-2 border-gray-300 rounded-xl shadow-sm focus:ring-primary focus:border-primary"
                  >
                    <option value="">Select RPD</option>
                    {rpds.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Delivery Information (kept compact like your sample) */}
            <div className="border-t pt-4">
              <h3 className="text-md font-semibold text-gray-900 mb-2">
                Delivery Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="weight"
                    value={productData.deliveryInfo.weight}
                    onChange={handleDeliveryChange}
                    disabled={isVariantView}
                    placeholder="e.g. 0.25"
                    className="w-full px-4 py-2 mt-1 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary bg-white/80 backdrop-blur shadow-sm text-sm placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Width (cm)
                  </label>
                  <input
                    type="number"
                    name="width"
                    value={productData.deliveryInfo.width}
                    onChange={handleDeliveryChange}
                    disabled={isVariantView}
                    placeholder="e.g. 10"
                    className="w-full px-4 py-2 mt-1 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary bg-white/80 backdrop-blur shadow-sm text-sm placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    name="height"
                    value={productData.deliveryInfo.height}
                    onChange={handleDeliveryChange}
                    disabled={isVariantView}
                    placeholder="e.g. 3"
                    className="w-full px-4 py-2 mt-1 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary bg-white/80 backdrop-blur shadow-sm text-sm placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Depth (cm)
                  </label>
                  <input
                    type="number"
                    name="depth"
                    value={productData.deliveryInfo.depth}
                    onChange={handleDeliveryChange}
                    disabled={isVariantView}
                    placeholder="e.g. 12"
                    className="w-full px-4 py-2 mt-1 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary bg-white/80 backdrop-blur shadow-sm text-sm placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Delivery (Days)
                  </label>
                  <input
                    type="number"
                    name="deliveryInDays"
                    value={productData.deliveryInfo.deliveryInDays}
                    onChange={handleDeliveryChange}
                    disabled={isVariantView}
                    placeholder="e.g. 3"
                    className="w-full px-4 py-2 mt-1 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary bg-white/80 backdrop-blur shadow-sm text-sm placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Delivery Charges
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="deliveryCharges"
                    value={productData.deliveryInfo.deliveryCharges}
                    onChange={handleDeliveryChange}
                    disabled={isVariantView}
                    placeholder="e.g. 49"
                    className="w-full px-4 py-2 mt-1 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary bg-white/80 backdrop-blur shadow-sm text-sm placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                {productData.isReturnable && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      Return Charges
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="returnCharges"
                      value={productData.deliveryInfo.returnCharges}
                      onChange={handleDeliveryChange}
                      disabled={isVariantView}
                      placeholder="e.g. 49"
                      className="w-full px-4 py-2 mt-1 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary bg-white/80 backdrop-blur shadow-sm text-sm placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="flex items-center justify-end p-4 border-t border-gray-200 space-x-4 bg-gray-50 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="text-text-secondary font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-white font-semibold py-2 px-6 rounded-lg hover:bg-opacity-90 transition disabled:opacity-60"
          >
            {saving ? 'Saving…' : (productToEdit ? "Save Changes" : "Add Product")}
          </button>
        </footer>
      </form>
      <LimitedDealTimerModal
        isOpen={isLimitedDealModalOpen}
        initialValue={productData.limitedDealEndsAt || null}
        onSave={(value) => {
          setIsLimitedDealModalOpen(false);
          try {
            setProductData((p) => ({
              ...p,
              limitedDealEndsAt: new Date(value).toISOString(),
            }));
          } catch {
            setProductData((p) => ({ ...p, limitedDealEndsAt: null }));
          }
        }}
        onCancel={() => setIsLimitedDealModalOpen(false)}
      />
    </div>
  );
};

/* ---------------------------------------------
   Tab Button (simple, matches your app)
---------------------------------------------- */
const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center py-3 px-3 text-sm font-medium border-b-2 ${
      active
        ? "border-primary text-primary"
        : "border-transparent text-gray-500 hover:text-primary"
    }`}
  >
    {children}
  </button>
);

export default ProductFormPage;
