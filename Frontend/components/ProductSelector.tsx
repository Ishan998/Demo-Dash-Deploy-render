import React, { useState, useMemo, useRef, useEffect } from "react";
import { Product } from "../types";

interface SelectableProduct {
  id: string; // 'p-<id>' for product, 'v-<id>' for variant
  name: string;
  sku: string;
}

interface ProductSelectorProps {
  allProducts: Product[];
  selectedProductIds: string[];
  onSelectionChange: (newIds: string[]) => void;
  maxSelection: number;
  excludeLinkedToRPD?: boolean;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
  allProducts =[],
  selectedProductIds=[],
  onSelectionChange,
  maxSelection,
  excludeLinkedToRPD = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

//   const selectableProducts = useMemo<SelectableProduct[]>(() => {
 const selectableProducts = useMemo<SelectableProduct[]>(() => {
  // Build options to allow selecting either a whole product or specific variants.
  // - Always include a product-level entry (id: `p-<id>`), labeled with just the product name.
  // - If variants exist, also include variant-level entries (id: `v-<id>`), labeled as `Product - Variant`.
  return allProducts
    .filter((p) => (excludeLinkedToRPD ? !p.rpdId : true))
    .flatMap((p) => {
      const entries: SelectableProduct[] = [
        { id: `p-${p.id}`, name: p.name, sku: p.sku },
      ];
      if (Array.isArray(p.variants) && p.variants.length > 0) {
        entries.push(
          ...p.variants.map((v) => ({
            id: `v-${v.id}`,
            name: `${p.name} - ${v.name}`,
            sku: v.sku,
          }))
        );
      }
      return entries;
    });
}, [allProducts, excludeLinkedToRPD]);


  const selectedProducts = useMemo<SelectableProduct[]>(() => {
    return selectedProductIds
      .map((id) => selectableProducts.find((p) => p.id === id))
      .filter((p): p is SelectableProduct => p !== undefined);
  }, [selectedProductIds, selectableProducts]);

  const searchResults = useMemo<SelectableProduct[]>(() => {
    if (!searchTerm) return [];
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return selectableProducts
      .filter(
        (p) =>
          !selectedProductIds.includes(p.id) &&
          (p.name.toLowerCase().includes(lowerCaseSearchTerm) ||
            p.sku.toLowerCase().includes(lowerCaseSearchTerm))
      )
      .slice(0, 10);
  }, [searchTerm, selectableProducts, selectedProductIds]);

  const handleSelectProduct = (product: SelectableProduct) => {
    if (selectedProductIds.length < maxSelection) {
      onSelectionChange([...selectedProductIds, product.id]);
      setSearchTerm("");
      setIsDropdownOpen(false);
    }
  };

  const handleRemoveProduct = (productId: string) => {
    onSelectionChange(selectedProductIds.filter((id) => id !== productId));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isMaxReached = selectedProductIds.length >= maxSelection;

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700">
        Select Products
      </label>
      <div className="mt-1 flex flex-wrap items-center gap-2 p-2 border border-gray-300 rounded-md shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
        {selectedProducts.map((product) => (
          <div
            key={product.id}
            className="flex items-center bg-primary text-white text-sm font-medium pl-3 pr-2 py-1 rounded-full"
          >
            <span title={product.name} className="truncate max-w-xs">
              {product.name}
            </span>
            <button
              type="button"
              onClick={() => handleRemoveProduct(product.id)}
              className="ml-2 text-white font-bold text-lg leading-none hover:text-gray-200"
            >
              &times;
            </button>
          </div>
        ))}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          placeholder={
            isMaxReached
              ? "Maximum products selected"
              : "Search by name or SKU..."
          }
          className="flex-grow p-1 border-none focus:ring-0 outline-none bg-transparent"
          disabled={isMaxReached}
        />
      </div>
      <p className="text-xs text-right text-gray-500 mt-1">
        {selectedProductIds.length} / {maxSelection} selected
      </p>

      {isDropdownOpen && searchTerm && searchResults.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          <ul>
            {searchResults.map((product) => (
              <li
                key={product.id}
                onClick={() => handleSelectProduct(product)}
                className="text-gray-900 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100"
              >
                <span className="block truncate font-normal">
                  {product.name}
                </span>
                <span className="block truncate text-xs text-gray-500">
                  {product.sku}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {isDropdownOpen && searchTerm && searchResults.length === 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md p-4 text-sm text-gray-500">
          No products found.
        </div>
      )}
    </div>
  );
};

export default ProductSelector;





