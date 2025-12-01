import React, { useState, useRef, useEffect } from "react";
import { Product, ProductStatus } from "../types";
import ProductTagDropdown from "./ProductTagDropdown";
import { formatCurrency } from "../constants";

const getStatusBadgeClass = (status: ProductStatus): string => {
  switch (status) {
    case ProductStatus.InStock:
      return "bg-green-100 text-green-800";
    case ProductStatus.OutOfStock:
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getTotalStock = (product: Product): number => {
  let totalStock = product.stock; // Start with base product stock
  if (product.variants.length > 0) {
    totalStock += product.variants.reduce(
      (total, variant) => total + variant.stock,
      0
    );
  }
  return totalStock;
};

const getPriceRange = (product: Product): string => {
  if (product.variants.length > 0) {
    const prices = product.variants.map((v) => v.sellingPrice);
    if (product.sellingPrice > 0) {
      // Include base price if set
      prices.push(product.sellingPrice);
    }
    if (prices.length === 0) return formatCurrency(0);

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return formatCurrency(min);
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  }
  return formatCurrency(product.sellingPrice);
};

const getMrpRange = (product: Product): string => {
  if (product.variants.length > 0) {
    const prices = product.variants.map((v) => v.mrp);
    if (product.mrp > 0) {
      // Include base MRP if set
      prices.push(product.mrp);
    }
    if (prices.length === 0) return formatCurrency(0);

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return formatCurrency(min);
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  }
  return formatCurrency(product.mrp);
};

const EditablePrice: React.FC<{
  value: number;
  mrp: number;
  onSave: (newValue: number) => void;
}> = ({ value, mrp, onSave }) => {
  //   const [currentValue, setCurrentValue] = useState(value.toString());
  const [currentValue, setCurrentValue] = useState(
    value !== undefined && value !== null ? value.toString() : "0"
  );
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  //   useEffect(() => {
  //     setCurrentValue(value.toString());
  //   }, [value]);
  useEffect(() => {
    setCurrentValue(
      value !== undefined && value !== null ? value.toString() : "0"
    );
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    const newPrice = parseFloat(currentValue);
    if (isNaN(newPrice) || newPrice === value) {
      setCurrentValue(value.toString());
      return;
    }
    if (newPrice > mrp) {
      alert(
        `Selling Price cannot be higher than MRP (${formatCurrency(mrp)}).`
      );
      setCurrentValue(value.toString());
    } else {
      onSave(newPrice);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setIsEditing(false);
      setCurrentValue(value.toString());
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-24 text-right p-1 border rounded-md bg-white"
        max={mrp}
        step="0.01"
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="cursor-pointer font-medium p-1 rounded-md hover:bg-gray-200"
    >
      {formatCurrency(value)}
    </div>
  );
};

interface InventoryTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: number) => void;
  onTagsChange: (productId: number, tags: string[]) => void;
  onPriceChange: (productId: number, newPrice: number) => void;
  onVariantPriceChange: (
    productId: number,
    variantId: number,
    newPrice: number
  ) => void;
  onVariantTagsChange: (
    productId: number,
    variantId: number,
    newTags: string[]
  ) => void;
  onEditVariant: (productId: number, variantId: number) => void;
  onDeleteVariant: (
    productId: number,
    variantId: number,
    variantName: string
  ) => void;
  itemOffset: number;
}

const GROUP_COLORS = [
  "#4f46e5",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#ef4444",
  "#3b82f6",
];

const InventoryTable: React.FC<InventoryTableProps> = ({
  products,
  onEdit,
  onDelete,
  onTagsChange,
  onPriceChange,
  onVariantPriceChange,
  onVariantTagsChange,
  onEditVariant,
  onDeleteVariant,
  itemOffset,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  // ✅ Defensive normalization to avoid "undefined.length" crash
  const safeProducts = (products || []).map((p) => ({
    ...p,
    images: Array.isArray(p.images) ? p.images : [],
    variants: Array.isArray(p.variants) ? p.variants : [],
  }));

  const toggleRowExpansion = (productId: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // ✅ Add a more robust check to prevent crashes if products are not yet loaded.
  if (!safeProducts || safeProducts.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">No products found.</div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-md overflow-visible">
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-50 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-1 w-2"></th>
              <th className="py-3 px-6 text-center w-16">S.No.</th>
              <th className="py-3 px-6 text-left">Image</th>
              <th className="py-3 px-6 text-left">Product Name</th>
              <th className="py-3 px-6 text-left">SKU</th>
              <th className="py-3 px-6 text-center">Total Stock</th>
              <th className="py-3 px-6 text-right">MRP</th>
              <th className="py-3 px-6 text-right">Selling Price</th>
              <th className="py-3 px-6 text-center">Status</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {safeProducts.map((product, index) => {
              const groupColor = GROUP_COLORS[index % GROUP_COLORS.length];
              const isExpanded = expandedRows.has(product.id);
              return (
                <React.Fragment key={product.id}>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td
                      className="py-3"
                      style={{
                        borderLeft: isExpanded
                          ? `4px solid ${groupColor}`
                          : "4px solid transparent",
                      }}
                    ></td>
                    <td className="py-3 px-6 text-center font-semibold text-text-secondary">
                      {itemOffset + index + 1}
                    </td>
                    <td className="py-3 px-6 text-left">
                      <div className="flex items-center justify-center">
                        {Array.isArray(product.images) &&
                        product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-md bg-gray-100"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-6 text-left">
                      <div className="flex items-center">
                        {product.variants.length > 0 && (
                          <button
                            onClick={() => toggleRowExpansion(product.id)}
                            className="mr-2 p-1 rounded-full hover:bg-gray-200"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={`h-4 w-4 transition-transform ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                        )}
                        <div>
                          <div className="font-medium text-text-primary">
                            {product.name}
                          </div>
                          <div className="mt-1">
                            <ProductTagDropdown
                              productTags={product.tags}
                              onTagsChange={(newTags) =>
                                onTagsChange(product.id, newTags)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-left">{product.sku}</td>
                    <td className="py-3 px-6 text-center">
                      {getTotalStock(product)}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {getMrpRange(product)}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {product.variants.length > 0 ? (
                        <span className="font-medium">
                          {getPriceRange(product)}
                        </span>
                      ) : (
                        <EditablePrice
                          value={product.sellingPrice}
                          mrp={product.mrp}
                          onSave={(newPrice) =>
                            onPriceChange(product.id, newPrice)
                          }
                        />
                      )}
                    </td>
                    {/* <td className="py-3 px-6 text-center">
                      <span
                        className={`py-1 px-3 rounded-full text-xs ${getStatusBadgeClass(
                          product.status
                        )}`}
                      >
                        {product.status}
                      </span>
                    </td> */}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <select
                        value={product.status}
                        onChange={(e) =>
                          onEdit({
                            ...product,
                            status: e.target.value,
                          })
                        }
                        className="py-1 px-2 text-xs rounded-md border border-gray-300 bg-white text-gray-700 focus:outline-none"
                      >
                        <option value="in_stock">In Stock</option>
                        <option value="out_of_stock">Out of Stock</option>
                        <option value="discontinued">Discontinued</option>
                      </select>
                    </td>

                    <td className="py-3 px-6 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => onEdit(product)}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-gray-100 rounded-full transition"
                          title="Edit"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDelete(product.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-full transition"
                          title="Delete"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded &&
                    product.variants.map((variant, variantIndex) => (
                      <tr key={variant.id} className="bg-gray-50">
                        <td
                          className="py-2"
                          style={{ borderLeft: `4px solid ${groupColor}` }}
                        ></td>
                        <td className="py-2 px-6 text-center font-semibold text-text-secondary">
                          {`${itemOffset + index + 1}.${variantIndex + 1}`}
                        </td>
                        <td className="py-2 px-6 text-left">
                          <div className="flex items-center justify-center">
                            {(() => {
                              const imageSrc =
                                Array.isArray(variant.images) &&
                                variant.images.length > 0
                                  ? variant.images[0]
                                  : Array.isArray(product.images) &&
                                    product.images.length > 0
                                  ? product.images[0]
                                  : null;

                              return imageSrc ? (
                                <img
                                  src={imageSrc}
                                  alt={variant.name}
                                  className="w-10 h-10 object-cover rounded-md"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded-md"></div>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="py-2 px-6 text-left pl-12">
                          <div>{variant.name}</div>
                          <div className="mt-1">
                            <ProductTagDropdown
                              productTags={variant.tags}
                              onTagsChange={(newTags) =>
                                onVariantTagsChange(
                                  product.id,
                                  variant.id,
                                  newTags
                                )
                              }
                            />
                          </div>
                        </td>
                        <td className="py-2 px-6 text-left">{variant.sku}</td>
                        <td className="py-2 px-6 text-center">
                          {variant.stock}
                        </td>
                        <td className="py-2 px-6 text-right">
                          {formatCurrency(variant.mrp)}
                        </td>
                        <td className="py-2 px-6 text-right">
                          <EditablePrice
                            value={variant.sellingPrice}
                            mrp={variant.mrp}
                            onSave={(newPrice) =>
                              onVariantPriceChange(
                                product.id,
                                variant.id,
                                newPrice
                              )
                            }
                          />
                        </td>
                        <td className="py-2 px-6 text-center">
                          {(() => {
                            const status =
                              variant.stock > 0
                                ? ProductStatus.InStock
                                : ProductStatus.OutOfStock;
                            return (
                              <span
                                className={`py-1 px-3 rounded-full text-xs ${getStatusBadgeClass(
                                  status
                                )}`}
                              >
                                {status}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-2 px-6 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() =>
                                onEditVariant(product.id, variant.id)
                              }
                              className="p-2 text-gray-500 hover:text-green-600 hover:bg-gray-100 rounded-full transition"
                              title="Edit Variant"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() =>
                                onDeleteVariant(
                                  product.id,
                                  variant.id,
                                  variant.name
                                )
                              }
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-full transition"
                              title="Delete Variant"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryTable;
