import React, { useState, useRef, useEffect } from "react";
import { LIMITED_DEAL_TAG, SPECIAL_TAGS, WEDDING_COLLECTION_TAG } from "../constants";

interface ProductTagDropdownProps {
  productTags?: string[]; // optional now
  onTagsChange: (tags: string[]) => void;
  onTagToggle?: (tag: string, isChecked: boolean) => void;
}

const ProductTagDropdown: React.FC<ProductTagDropdownProps> = ({
  productTags,
  onTagsChange,
  onTagToggle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ Prevent crash if productTags is undefined
  const safeTags = Array.isArray(productTags) ? productTags : [];

  const specialTags = SPECIAL_TAGS;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleTagChange = (tag: string, isChecked: boolean) => {
    if (SPECIAL_TAGS.includes(tag)) {
      // Handle exclusive, special tags
      const nonSpecialTags = safeTags.filter((t) => !SPECIAL_TAGS.includes(t));
      if (isChecked) {
        onTagsChange([...nonSpecialTags, tag]);
      } else {
        onTagsChange(nonSpecialTags);
      }
    } else {
      // Handle regular, multi-select tags
      if (isChecked) {
        onTagsChange([...safeTags, tag]);
      } else {
        onTagsChange(safeTags.filter((t) => t !== tag));
      }
    }
    if (onTagToggle) {
      onTagToggle(tag, isChecked);
    }
  };

  const tagColors: { [key: string]: string } = {
    "New Arrival": "bg-blue-100 text-blue-800",
    "Featured Products": "bg-purple-100 text-purple-800",
    "Best Sellers": "bg-green-100 text-green-800",
    "Festive Sale": "bg-red-100 text-red-800",
    [LIMITED_DEAL_TAG]: "bg-yellow-100 text-yellow-800",
    [WEDDING_COLLECTION_TAG]: "bg-pink-100 text-pink-800",
  };
  const defaultColor = "bg-indigo-100 text-indigo-800";

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-wrap items-center gap-1 cursor-pointer"
        title="Manage Tags"
      >
        {safeTags.length > 0 ? (
          safeTags.map((tag) => (
            <span
              key={tag}
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                tagColors[tag] || defaultColor
              }`}
            >
              {tag}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-500 hover:text-primary">
            + Add Tag
          </span>
        )}
        <button
          type="button"
          className="p-1 text-gray-400 hover:text-primary rounded-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-56 origin-top-left bg-card rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div
            className="py-1"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="options-menu"
          >
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">
              Highlights (Select One)
            </div>
            {specialTags.map((tag) => (
              <label
                key={tag}
                className="flex items-center px-3 py-2 text-sm text-text-primary hover:bg-background cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  checked={safeTags.includes(tag)}
                  onChange={(e) => handleTagChange(tag, e.target.checked)}
                />
                <span className="ml-3">{tag}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ Proper place for defaultProps
ProductTagDropdown.defaultProps = {
  productTags: [],
};

export default ProductTagDropdown;
