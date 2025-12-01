import React from "react";
import { ProductStatus } from "../types";
import { ICONS, formatCurrency } from "../constants";
import ProductTagDropdown from "./ProductTagDropdown";

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

export interface DisplayableProduct {
  // Fix: Changed id to number to align with data types
  id: number;
  name: string;
  price: number;
  status: ProductStatus;
  mainCategory: string;
  images: string[];
  tags: string[];
  rpdId?: number;
  /** Optional color used to visually group parent product with its variants */
  groupColor?: string;
  /** True if this card represents a variant (styling can differ) */
  isVariant?: boolean;
  limitedDealEndsAt?: string | null;
}

interface ProductDisplayCardProps {
  product: DisplayableProduct;
  onEdit: (id: number) => void;
  onTagsChange: (id: number, newTags: string[]) => void;
  onViewRPD: (rpdId: number) => void;
}

const ProductDisplayCard: React.FC<ProductDisplayCardProps> = ({
  product,
  onEdit,
  onTagsChange,
  onViewRPD,
}) => {
  return (
    <div className="relative bg-card rounded-xl shadow-md flex flex-col transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl group hover:z-10">
      <div className="relative h-64 bg-gray-100 flex items-center justify-center overflow-hidden">
        {Array.isArray(product.images) && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="text-gray-400 h-16 w-16">{ICONS.products}</div>
        )}
        <span
          className={`absolute top-3 left-3 py-1 px-3 rounded-full text-xs font-semibold ${getStatusBadgeClass(
            product.status
          )}`}
        >
          {product.status}
        </span>
        {product.groupColor && (
          <span
            className="absolute top-3 right-3 h-3 w-3 rounded-full ring-2 ring-white"
            style={{ backgroundColor: product.groupColor }}
            title="Product group indicator"
          />
        )}
      </div>
      <div className="p-4 flex-grow flex flex-col">
        <h3
          className="font-bold text-lg text-text-primary truncate"
          title={product.name}
        >
          {product.name}
        </h3>
        <p className="text-sm text-text-secondary mt-1">
          {product.mainCategory}
        </p>

        <div className="mt-2">
          <ProductTagDropdown
            productTags={product.tags}
            onTagsChange={(newTags) => onTagsChange(product.id, newTags)}
          />
        </div>

        <div className="mt-4 flex-grow flex items-end justify-between">
          <p className="text-xl font-bold text-primary">
            {formatCurrency(product.price)}
          </p>
          <div className="flex items-center space-x-1">
            {product.rpdId && (
              <button
                onClick={() => onViewRPD(product.rpdId!)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition"
                title="View Rich Description"
              >
                {ICONS.richContent &&
                  React.cloneElement(ICONS.richContent, {
                    className: "h-5 w-5",
                  })}
              </button>
            )}
            <button
              onClick={() => onEdit(product.id)}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDisplayCard;
