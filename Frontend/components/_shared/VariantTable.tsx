// ✅ FILE: src/components/_shared/VariantTable.tsx

import React from "react";
import { ProductVariant } from "../../types";
import ImageUploader from "./ImageUploader";

interface VariantTableProps {
  baseSku: string;
  variants: ProductVariant[];
  onChange: (updated: ProductVariant[]) => void;
  enableVariantImageUpload?: boolean;
}

const inputCls =
  "w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-primary focus:border-primary text-sm";

const VariantTable: React.FC<VariantTableProps> = ({
  baseSku,
  variants,
  onChange,
  enableVariantImageUpload = true,
}) => {
  const updateVariant = (
    index: number,
    key: keyof ProductVariant,
    value: string | number | string[]
  ) => {
    const updated = [...variants];
    (updated[index] as any)[key] = value;
    onChange(updated);
  };

  const addVariant = () => {
    onChange([
      ...variants,
      {
        id: Date.now(),
        name: "",
        sku: `${baseSku || "SKU"}-VAR-${variants.length + 1}`,
        mrp: 0,
        sellingPrice: 0,
        stock: 0,
        images: [],
        tags: [],
        materials: [],
        colors: [],
        occasions: [],
        sizes: [],
      },
    ]);
  };

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-600 px-2">
        <div className="col-span-3">Variant Name</div>
        <div className="col-span-3">SKU</div>
        <div className="col-span-2">MRP</div>
        <div className="col-span-2">Selling Price</div>
        <div className="col-span-1">Stock</div>
        <div className="col-span-1 text-right">Actions</div>
      </div>

      {/* Rows */}
      {variants.map((variant, index) => (
        <div
          key={variant.id}
          className="grid grid-cols-12 gap-4 items-start bg-gray-50 px-2 py-3 rounded-xl"
        >
          <input
            className={`${inputCls} col-span-3`}
            placeholder="Variant Name"
            value={variant.name}
            onChange={(e) => updateVariant(index, "name", e.target.value)}
          />
          <input
            className={`${inputCls} col-span-3`}
            placeholder="SKU"
            value={variant.sku}
            onChange={(e) => updateVariant(index, "sku", e.target.value)}
          />
          <input
            type="number"
            className={`${inputCls} col-span-2`}
            placeholder="MRP"
            value={variant.mrp}
            onChange={(e) => updateVariant(index, "mrp", parseFloat(e.target.value))}
          />
          <input
            type="number"
            className={`${inputCls} col-span-2`}
            placeholder="Selling Price"
            value={variant.sellingPrice}
            onChange={(e) =>
              updateVariant(index, "sellingPrice", parseFloat(e.target.value))
            }
          />
          <input
            type="number"
            className={`${inputCls} col-span-1`}
            placeholder="Stock"
            value={variant.stock}
            onChange={(e) =>
              updateVariant(index, "stock", parseInt(e.target.value))
            }
          />

          <div className="col-span-1 text-right">
            <button
              type="button"
              onClick={() => removeVariant(index)}
              className="text-red-500 hover:text-red-700 text-lg"
            >
              &times;
            </button>
          </div>

          {/* Variant Image Upload */}
          {enableVariantImageUpload && (
            <div className="col-span-12 mt-2">
              <ImageUploader
                images={variant.images || []}
                onImagesChange={(imgs) => updateVariant(index, "images", imgs)}
              />
            </div>
          )}

          <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
            <input
              className={inputCls}
              placeholder="Materials (comma separated)"
              value={(variant.materials || []).join(", ")}
              onChange={(e) =>
                updateVariant(
                  index,
                  "materials",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
            />
            <input
              className={inputCls}
              placeholder="Colors (comma separated)"
              value={(variant.colors || []).join(", ")}
              onChange={(e) =>
                updateVariant(
                  index,
                  "colors",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
            />
            <input
              className={inputCls}
              placeholder="Occasions (comma separated)"
              value={(variant.occasions || []).join(", ")}
              onChange={(e) =>
                updateVariant(
                  index,
                  "occasions",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
            />
            <input
              className={inputCls}
              placeholder="Sizes (comma separated)"
              value={(variant.sizes || []).join(", ")}
              onChange={(e) =>
                updateVariant(
                  index,
                  "sizes",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
            />
          </div>
        </div>
      ))}

      {/* Add Button */}
      <button
        type="button"
        onClick={addVariant}
        className="w-full py-2 border-2 border-dashed border-primary text-primary font-semibold rounded-xl hover:bg-primary/10 transition"
      >
        + Add Another Variant
      </button>
    </div>
  );
};

export default VariantTable;
