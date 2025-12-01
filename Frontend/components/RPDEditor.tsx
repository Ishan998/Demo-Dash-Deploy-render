import React, { useState, useEffect, DragEvent } from "react";
const ICON_MAX_SIZE_KB = 200; // still 200 KB
const ICON_REQUIRED_WIDTH = 512;
const ICON_REQUIRED_HEIGHT = 512;

import {
  RPD,
  RPDContentBlock,
  Product,
  RPDImageTextBlock,
  RPDFeatureListBlock,
  RPDBannerBlock,
  RPDFeature,
} from "../types";
import ProductSelector from "./ProductSelector";
import Toast from "./Toast";

interface RPDEditorProps {
  rpdToEdit: RPD | null;
  onSave: (rpd: Omit<RPD, "id"> | RPD) => void;
  onClose: () => void;
  allProducts: Product[];
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const RPDEditor: React.FC<RPDEditorProps> = ({
  rpdToEdit,
  onSave,
  onClose,
  allProducts,
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<RPDContentBlock[]>([]);
  // String IDs for selection: 'p-<id>' | 'v-<id>'
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  useEffect(() => {
    if (rpdToEdit) {
      setTitle(rpdToEdit.title);
      setContent(rpdToEdit.content);
      // Initialize selection from existing product IDs
      setSelectedIds((rpdToEdit.products || []).map((pid) => `p-${pid}`));
    } else {
      setTitle("More To Love");
      setContent([]);
      setSelectedIds([]);
    }
  }, [rpdToEdit]);

  const handleSave = () => {
    if (!title.trim()) {
      setToast({ message: "Title is required.", type: "error" });
      return;
    }
    // Map selection to parent product IDs for backend compatibility
    const productIds = Array.from(
      new Set(
        selectedIds
          .map((sid) => {
            if (sid.startsWith('p-')) return Number(sid.slice(2));
            if (sid.startsWith('v-')) {
              const vid = Number(sid.slice(2));
              const parent = allProducts.find(
                (p) => Array.isArray(p.variants) && p.variants.some((v) => v.id === vid)
              );
              return parent ? parent.id : undefined;
            }
            return undefined;
          })
          .filter((x): x is number => typeof x === 'number')
      )
    );
    const rpdData = { title, content, products: productIds };
    if (rpdToEdit) {
      onSave({ ...rpdToEdit, ...rpdData });
    } else {
      onSave(rpdData);
    }
  };

  const addBlock = (type: "image-text" | "feature-list" | "banner") => {
    let newBlock: RPDContentBlock;
    const id = `block-${Date.now()}`;

    switch (type) {
      case "image-text":
        newBlock = {
          id,
          layout: "image-text",
          props: {
            image: "",
            title: "Exquisite Craftsmanship",
            text: "Each piece is meticulously crafted...",
            imagePosition: "left",
          },
        };
        break;
      case "feature-list":
        newBlock = {
          id,
          layout: "feature-list",
          props: {
            features: [
              {
                icon: "hypoallergenic",
                title: "Hypoallergenic",
                text: "Safe for sensitive skin...",
              },
              {
                icon: "lustrous",
                title: "Lustrous Finish",
                text: "Features a superior plating...",
              },
              {
                icon: "hand-crafted",
                title: "Hand-Crafted",
                text: "Every piece is carefully assembled...",
              },
            ],
          },
        };
        break;
      case "banner":
        newBlock = {
          id,
          layout: "banner",
          props: {
            image: "",
            title: "Versatile & Timeless",
            text: "Perfect for any occasion...",
          },
        };
        break;
    }

    setContent([...content, newBlock]);
    setIsAddMenuOpen(false);
  };

  const updateBlock = (id: string, newProps: RPDContentBlock["props"]) => {
    setContent(
      content.map((block) =>
        block.id === id
          ? ({ ...block, props: newProps } as RPDContentBlock)
          : block
      )
    );
  };

  const removeBlock = (id: string) => {
    setContent(content.filter((block) => block.id !== id));
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const newContent = [...content];
    const [draggedItem] = newContent.splice(draggedIndex, 1);
    newContent.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setContent(newContent);
  };

  const handleDrop = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="container mx-auto">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <header className="flex items-center justify-between p-4 mb-6 border-b-2 bg-card shadow-sm rounded-lg sticky top-0 z-20">
        <h2 className="text-xl font-bold text-text-primary">
          {rpdToEdit ? "Edit Rich Content" : "Create Rich Content"}
        </h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="text-text-secondary font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-primary text-white font-semibold py-2 px-6 rounded-lg hover:bg-opacity-90 transition"
          >
            Save
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card p-6 rounded-xl shadow-md">
            <label
              htmlFor="rpd-title"
              className="block text-sm font-medium text-gray-700"
            >
              Content Title
            </label>
            <input
              id="rpd-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., More To Love"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-lg font-semibold"
            />
          </div>

          <div className="space-y-4">
            {content.map((block, index) => (
              <div
                key={block.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={() => handleDragOver(index)}
                onDrop={handleDrop}
                className="opacity-100"
              >
                <BlockEditor
                  block={block}
                  onUpdate={updateBlock}
                  onRemove={removeBlock}
                  setToast={setToast}
                />
              </div>
            ))}
          </div>
          <div className="relative">
            <button
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              className="w-full bg-primary/10 text-primary border-2 border-dashed border-primary/50 font-semibold py-4 px-4 rounded-lg hover:bg-primary/20 transition flex items-center justify-center"
            >
              + Add Section
            </button>
            {isAddMenuOpen && (
              <div className="absolute bottom-full mb-2 w-full bg-card rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                <button
                  onClick={() => addBlock("image-text")}
                  className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background"
                >
                  Image & Text Block
                </button>
                <button
                  onClick={() => addBlock("feature-list")}
                  className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background"
                >
                  Three-Column Features
                </button>
                <button
                  onClick={() => addBlock("banner")}
                  className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background"
                >
                  Full-Width Banner
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card p-6 rounded-xl shadow-md sticky top-24">
            <ProductSelector
              allProducts={allProducts}
              selectedProductIds={selectedIds}
              onSelectionChange={setSelectedIds}
              maxSelection={50}
              excludeLinkedToRPD
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const BlockEditor: React.FC<{
  block: RPDContentBlock;
  onUpdate: (id: string, newProps: RPDContentBlock["props"]) => void;
  onRemove: (id: string) => void;
  setToast: React.Dispatch<
    React.SetStateAction<{ message: string; type: "success" | "error" } | null>
  >;
}> = ({ block, onUpdate, onRemove, setToast }) => {
  const handleImageUpload = async (file: File | null) => {
    if (!file) return;
    const base64Image = await fileToBase64(file);
    if (block.layout === "image-text" || block.layout === "banner") {
      onUpdate(block.id, { ...block.props, image: base64Image });
    }
  };

  const handleIconUpload = async (file: File | null, featureIndex: number) => {
    if (!file) return;

    // File size validation
    const fileSizeKB = file.size / 1024;
    if (fileSizeKB > ICON_MAX_SIZE_KB) {
      setToast({
        message: `Icon must be under ${ICON_MAX_SIZE_KB} KB.`,
        type: "error",
      });
      return;
    }

    // Dimension validation
    const img = new Image();
    img.onload = async () => {
      if (
        img.width !== ICON_REQUIRED_WIDTH ||
        img.height !== ICON_REQUIRED_HEIGHT
      ) {
        setToast({
          message: `Icon must be exactly ${ICON_REQUIRED_WIDTH}x${ICON_REQUIRED_HEIGHT}px. Uploaded: ${img.width}x${img.height}px.`,
          type: "error",
        });
        return;
      }

      // Convert to Base64 and update feature
      const base64 = await fileToBase64(file);
      const props = block.props as RPDFeatureListBlock["props"];
      const newFeatures = [...props.features] as [
        RPDFeature,
        RPDFeature,
        RPDFeature
      ];
      newFeatures[featureIndex] = {
        ...newFeatures[featureIndex],
        iconUrl: base64,
        icon: undefined,
      };
      onUpdate(block.id, { features: newFeatures });
    };
    img.src = URL.createObjectURL(file);
  };

  const renderHeader = (title: string) => (
    <div className="flex justify-between items-center mb-4 pb-2 border-b">
      <h4 className="font-semibold text-gray-600 uppercase tracking-wider text-sm">
        {title}
      </h4>
      <button
        onClick={() => onRemove(block.id)}
        className="text-red-500 hover:text-red-700 p-1 text-xl leading-none"
      >
        &times;
      </button>
    </div>
  );

  switch (block.layout) {
    case "image-text": {
      const props = block.props as RPDImageTextBlock["props"];
      return (
        <div className="bg-card border p-4 rounded-xl shadow-sm cursor-grab active:cursor-grabbing">
          {renderHeader("Image & Text Block")}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Image Position</label>
              <select
                value={props.imagePosition}
                onChange={(e) =>
                  onUpdate(block.id, {
                    ...props,
                    imagePosition: e.target.value as "left" | "right",
                  })
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
              >
                <option value="left">Image Left, Text Right</option>
                <option value="right">Text Left, Image Right</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Image</label>
              {props.image ? (
                <img src={props.image} className="mt-1 h-24 w-auto rounded" />
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleImageUpload(e.target.files?.[0] || null)
                  }
                  className="mt-1 text-sm"
                />
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Title</label>
              <input
                type="text"
                value={props.title}
                onChange={(e) =>
                  onUpdate(block.id, { ...props, title: e.target.value })
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Text</label>
              <textarea
                value={props.text}
                onChange={(e) =>
                  onUpdate(block.id, { ...props, text: e.target.value })
                }
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
              />
            </div>
          </div>
        </div>
      );
    }
    case "feature-list": {
      const props = block.props as RPDFeatureListBlock["props"];

      const handleFeatureChange = (
        index: number,
        field: keyof RPDFeature,
        value: string
      ) => {
        const newFeatures = [...props.features] as [
          RPDFeature,
          RPDFeature,
          RPDFeature
        ];
        newFeatures[index] = { ...newFeatures[index], [field]: value };
        onUpdate(block.id, { features: newFeatures });
      };

      return (
        <div className="bg-card border p-4 rounded-xl shadow-sm cursor-grab active:cursor-grabbing">
          {renderHeader("Three-Column Features")}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {props.features.map((feature, i) => (
              <div key={i} className="space-y-2 bg-gray-50 p-3 rounded-lg">
                <h5 className="font-semibold text-sm">Feature {i + 1}</h5>
                {/* <div>
                  <label className="text-xs font-medium">Icon</label>
                  <div className="space-y-2">
                    {feature.iconUrl ? (
                      <img
                        src={feature.iconUrl}
                        alt="Icon"
                        className="h-12 w-12 object-contain mx-auto border rounded bg-white"
                      />
                    ) : feature.icon ? (
                      <span className="text-sm text-gray-500">
                        {feature.icon}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        No icon selected
                      </span>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleIconUpload(e.target.files?.[0] || null, i)}
                      className="mt-1 block w-full text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Required: {ICON_REQUIRED_WIDTH}x{ICON_REQUIRED_HEIGHT}px, ≤ {ICON_MAX_SIZE_KB}KB
                    </p>
                  </div>
                </div> */}
                <div>
                  <label className="text-xs font-medium">Icon</label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center">
                      {feature.iconUrl ? (
                        <div className="relative">
                          <img
                            src={feature.iconUrl}
                            alt="Uploaded Icon"
                            className="h-12 w-12 object-contain border rounded bg-white"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleFeatureChange(i, "iconUrl", "")
                            }
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs"
                            title="Remove Icon"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="h-12 w-12 flex items-center justify-center border rounded bg-gray-100 text-xs text-gray-400">
                          No Icon
                        </div>
                      )}
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleIconUpload(e.target.files?.[0] || null, i)
                      }
                      className="mt-1 block w-full text-sm"
                    />

                    <p className="text-xs text-gray-500 mt-1">
                      Required: {ICON_REQUIRED_WIDTH}x{ICON_REQUIRED_HEIGHT}px,
                      ≤ {ICON_MAX_SIZE_KB}KB
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium">Title</label>
                  <input
                    type="text"
                    value={feature.title}
                    onChange={(e) =>
                      handleFeatureChange(i, "title", e.target.value)
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Text</label>
                  <textarea
                    value={feature.text}
                    onChange={(e) =>
                      handleFeatureChange(i, "text", e.target.value)
                    }
                    rows={2}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "banner": {
      const props = block.props as RPDBannerBlock["props"];
      return (
        <div className="bg-card border p-4 rounded-xl shadow-sm cursor-grab active:cursor-grabbing">
          {renderHeader("Full-Width Banner")}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Background Image</label>
              {props.image ? (
                <img src={props.image} className="mt-1 h-24 w-auto rounded" />
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleImageUpload(e.target.files?.[0] || null)
                  }
                  className="mt-1 text-sm"
                />
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Title</label>
              <input
                type="text"
                value={props.title}
                onChange={(e) =>
                  onUpdate(block.id, { ...props, title: e.target.value })
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Text</label>
              <input
                type="text"
                value={props.text}
                onChange={(e) =>
                  onUpdate(block.id, { ...props, text: e.target.value })
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
              />
            </div>
          </div>
        </div>
      );
    }
    default:
      return null;
  }
};

export default RPDEditor;
