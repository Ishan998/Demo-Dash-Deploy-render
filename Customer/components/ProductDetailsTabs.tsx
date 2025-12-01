import React, { useState } from "react";
import type { Product, ProductReview } from "../types";
import { StarIcon } from "./Icon";
import CustomerReviewsModal from "./CustomerReviewsModal";

interface ProductDetailsTabsProps {
  product: Product;
}

const ProductDetailsTabs: React.FC<ProductDetailsTabsProps> = ({ product }) => {
  const [activeTab, setActiveTab] = useState("description");
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [showAllSpecs, setShowAllSpecs] = useState(false);

  const TABS = [
    { id: "description", label: "Description" },
    { id: "specifications", label: "Specifications" },
    { id: "reviews", label: `Reviews (${product.reviews?.length || 0})` },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "description":
        // return <p className="text-gray-600 leading-relaxed">{product.description}</p>;
        return (
          <div className="space-y-4">
            {product.description && (
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            )}
            {product.product_specification && (
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Product Specification
                </h4>
                <p className="text-gray-600">{product.product_specification}</p>
              </div>
            )}
          </div>
        );
      case "specifications":
        const MAX_SPECS_VISIBLE = 6;
        // const specs = product.specifications || [];
        const skuValue = product.unique_code || (product as any)?.variants?.map((v: any) => v?.sku).filter(Boolean).join(", ") || undefined;
        const mainCategoryValue = (product as any).main_category || (product as any).category;
        const subCategoryValue = (product as any).sub_category || (product as any).subcategory;
        const specs = [
          { key: "Product Title", value: product.name },
          { key: "SKU ID", value: skuValue },
          { key: "Main Category", value: mainCategoryValue },
          { key: "Sub Category", value: subCategoryValue },
          { key: "Crystal Name", value: product.crystal_name },
          { key: "Tags", value: product.tags?.join(", ") },
          { key: "Material", value: product.materials?.join(", ") },
          { key: "Colors", value: product.colors?.join(", ") },
          { key: "Occasions", value: product.occasions?.join(", ") },
          { key: "GST", value: (product as any).gst },
          { key: "Returnable", value: typeof (product as any).is_returnable === 'boolean' ? ((product as any).is_returnable ? "Yes" : "No") : undefined },
        ].filter(
          (item) =>
            item.value !== undefined && item.value !== null && item.value !== ""
        );
        const weightValue = (product as any).delivery_weight ?? (product as any).weight;
        const widthValue = (product as any).delivery_width ?? (product as any).width;
        const heightValue = (product as any).delivery_height ?? (product as any).height;
        const depthValue = (product as any).delivery_depth ?? (product as any).depth;
        const deliveryDaysValue = (product as any).delivery_days ?? (product as any).deliveryDays;
        const deliveryInfo = [
          { key: "Weight (grams)", value: weightValue },
          { key: "Width (cm)", value: widthValue },
          { key: "Height (cm)", value: heightValue },
          { key: "Depth (cm)", value: depthValue },
          {
            key: "Delivery Days",
            value: (deliveryDaysValue || deliveryDaysValue === 0)
              ? `Approx. ${deliveryDaysValue} days`
              : null,
          },
          { key: "Delivery Charges", value: (product as any).delivery_charges ?? (product as any).deliveryCharges },
          { key: "Return Charges", value: (product as any).return_charges ?? (product as any).returnCharges },
        ].filter(
          (item) =>
            item.value !== undefined && item.value !== null && item.value !== ""
        );

        const specsToShow = showAllSpecs
          ? specs
          : specs.slice(0, MAX_SPECS_VISIBLE);
        const hasMoreSpecs = specs.length > MAX_SPECS_VISIBLE;

        return (
          <div>
            {/* <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {specsToShow.map((spec) => (
                  <div
                    key={spec.key}
                    className="flex justify-between border-b pb-2"
                  >
                    <span className="font-semibold text-gray-700">
                      {spec.key}
                    </span>
                    <span className="text-gray-600">{spec.value}</span>
                  </div>
                ))}
              </div> */}
            <div className="relative">
              {/* ✅ General Specs */}
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Product Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3"> 
                {specsToShow.map((spec) => (
                  <div
                    key={spec.key}
                    className="flex justify-between border-b pb-2"
                  >
                    <span className="font-semibold text-gray-700">
                      {spec.key}
                    </span>
                    <span className="text-gray-600 text-right">
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>

              {!showAllSpecs && hasMoreSpecs && (
                <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
              )}
            </div>

            {hasMoreSpecs && (
              <div className="text-center mt-4">
                <button
                  onClick={() => setShowAllSpecs((prev) => !prev)}
                  className="font-bold text-[#D4AF37] hover:underline"
                >
                  {showAllSpecs ? "View Less" : "View All"}
                </button>
              </div>
            )}

            {/* {deliveryInfo.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  Delivery Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {deliveryInfo.map((info) => (
                    <div
                      key={info.key}
                      className="flex justify-between border-b pb-2"
                    >
                      <span className="font-semibold text-gray-700">
                        {info.key}
                      </span>
                      <span className="text-gray-600">{info.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ); */}
            {/* ✅ Delivery Info */}
            {deliveryInfo.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  Delivery Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  {deliveryInfo.map((info) => (
                    <div
                      key={info.key}
                      className="flex justify-between border-b pb-2"
                    >
                      <span className="font-semibold text-gray-700">
                        {info.key}
                      </span>
                      <span className="text-gray-600 text-right">
                        {info.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case "reviews":
        return (
          <div>
            {product.reviews?.slice(0, 2).map((review) => (
              <ReviewItem key={review.id} review={review} />
            ))}
            {product.reviews && product.reviews.length > 2 && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setIsReviewsModalOpen(true)}
                  className="font-bold text-[#D4AF37] hover:underline"
                >
                  View All {product.reviews.length} Reviews
                </button>
              </div>
            )}
            {(!product.reviews || product.reviews.length === 0) && (
              <p className="text-center text-gray-500 py-4">
                No reviews yet for this product.
              </p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? "border-[#D4AF37] text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="py-8">{renderContent()}</div>
      {isReviewsModalOpen && (
        <CustomerReviewsModal
          reviews={product.reviews || []}
          productName={product.name}
          onClose={() => setIsReviewsModalOpen(false)}
        />
      )}
    </div>
  );
};

export const ReviewItem: React.FC<{ review: ProductReview }> = ({ review }) => (
  <div className="py-4 border-b border-gray-200 last:border-b-0">
    <div className="flex items-center mb-2">
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            className={`w-5 h-5 ${
              i < (review.rating || 0) ? "text-[#D4AF37]" : "text-gray-300"
            }`}
          />
        ))}
      </div>
      <div className="ml-4">
        <p className="font-bold text-gray-800">{review.customer_name || "Customer"}</p>
        {review.created_at && (
          <p className="text-xs text-gray-500">
            {new Date(review.created_at).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        )}
      </div>
    </div>
    {review.title && <p className="font-semibold text-gray-800 mb-1">{review.title}</p>}
    {review.comment && <p className="text-gray-600">{review.comment}</p>}
    {!review.comment && !review.title && (
      <p className="text-gray-500 italic">No comment provided.</p>
    )}
  </div>
);

export default ProductDetailsTabs;
