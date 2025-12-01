import React, { useEffect, useMemo, useState } from "react";
import { HomeCollageItem, Log } from "../types";
import {
  createCollageItem,
  updateCollageItem,
  deleteCollageItem,
  getCollageItems,
} from "../services/apiService";
import ConfirmationModal from "./ConfirmationModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  setToast: (toast: { message: string; type: "success" | "error" } | null) => void;
  collageItems: HomeCollageItem[];
  setCollageItems: (items: HomeCollageItem[]) => void;
  addLog: (message: string, type?: Log["type"]) => void;
}

type CollageForm = {
  name: string;
  item_type: HomeCollageItem["item_type"];
  image_url: string;
  grid_class: string;
  display_order: number | "";
  redirect_url: string;
  imageFile: File | null;
};

const defaultForm: CollageForm = {
  name: "",
  item_type: "occasion",
  image_url: "",
  grid_class: "",
  display_order: 0,
  redirect_url: "",
  imageFile: null,
};

const HomeCollageManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  setToast,
  collageItems,
  setCollageItems,
  addLog,
}) => {
  const [form, setForm] = useState<CollageForm>(defaultForm);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<HomeCollageItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<HomeCollageItem | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    (async () => {
      try {
        const latest = await getCollageItems();
        setCollageItems(latest);
      } catch (err) {
        console.error("Failed to load collage items", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, setCollageItems]);

  useEffect(() => {
    if (form.imageFile) {
      const objectUrl = URL.createObjectURL(form.imageFile);
      setLocalPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setLocalPreview(null);
  }, [form.imageFile]);

  if (!isOpen) return null;

  const handleInput = (key: keyof CollageForm, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(defaultForm);
    setLocalPreview(null);
    setEditingItem(null);
  };

  const handleEdit = (item: HomeCollageItem) => {
    setEditingItem(item);
    setForm({
      name: item.name || "",
      item_type: item.item_type,
      image_url: (item.imageUrl as string) || (item.image_url as string) || "",
      grid_class: item.grid_class || "",
      display_order: typeof item.display_order === "number" ? item.display_order : 0,
      redirect_url: (item.redirect_url as string) || "",
      imageFile: null,
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setToast({ message: "Name is required", type: "error" });
      return;
    }
    const existingImageUrl =
      form.image_url?.trim() ||
      (editingItem
        ? ((editingItem.imageUrl as string) || (editingItem.image_url as string) || "")
        : "");
    if (!form.imageFile && !existingImageUrl) {
      setToast({ message: "Please provide an image upload or image URL.", type: "error" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        item_type: form.item_type,
        imageFile: form.imageFile || undefined,
        image_url: existingImageUrl || undefined,
        grid_class: form.grid_class.trim(),
        display_order: form.display_order === "" ? undefined : Number(form.display_order),
        redirect_url: form.redirect_url.trim() || undefined,
      };

      let saved: HomeCollageItem;
      if (editingItem) {
        saved = await updateCollageItem(editingItem.id, payload);
        setCollageItems(
          collageItems.map((item) => (item.id === saved.id ? saved : item))
        );
        addLog(`Updated collage tile "${saved.name}"`, "info");
        setToast({ message: "Tile updated", type: "success" });
      } else {
        saved = await createCollageItem(payload);
        setCollageItems([...collageItems, saved]);
        addLog(`Added collage tile "${saved.name}"`, "success");
        setToast({ message: "Tile added", type: "success" });
      }
      resetForm();
    } catch (err) {
      console.error("Failed to save collage item", err);
      const detail =
        (err as any)?.response?.data?.error ||
        (err as any)?.response?.data?.detail ||
        (err as any)?.message ||
        "Unable to save tile. Please try again.";
      setToast({ message: String(detail), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteCollageItem(confirmDelete.id);
      setCollageItems(collageItems.filter((i) => i.id !== confirmDelete.id));
      addLog(`Removed collage tile "${confirmDelete.name}"`, "warning");
      setToast({ message: "Tile removed", type: "success" });
    } catch (err) {
      console.error("Failed to delete collage item", err);
      setToast({ message: "Could not delete tile", type: "error" });
    } finally {
      setConfirmDelete(null);
      if (editingItem?.id === confirmDelete?.id) {
        resetForm();
      }
    }
  };

  const previewImage = useMemo(() => {
    if (localPreview) return localPreview;
    if (form.image_url) return form.image_url;
    if (editingItem) return (editingItem.imageUrl as string) || (editingItem.image_url as string) || "";
    return "";
  }, [localPreview, form.image_url, editingItem]);

  const grouped = useMemo(() => {
    return {
      occasion: collageItems.filter((i) => i.item_type === "occasion"),
      crystal: collageItems.filter((i) => i.item_type === "crystal"),
      product_type: collageItems.filter((i) => i.item_type === "product_type"),
    };
  }, [collageItems]);

  const TileList = ({
    title,
    items,
  }: {
    title: string;
    items: HomeCollageItem[];
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        <span className="text-xs text-text-secondary">{items.length} items</span>
      </div>
      {items.length === 0 && (
        <p className="text-sm text-text-secondary bg-gray-50 border border-border rounded-lg p-4">
          Nothing here yet. Add a tile using the form.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex gap-3 items-center bg-white border border-border rounded-lg p-3 shadow-sm"
          >
            <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
              {((item.imageUrl as string) || (item.image_url as string)) ? (
                <img
                  src={(item.imageUrl as string) || (item.image_url as string) || ""}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                  No image
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-text-primary truncate">{item.name}</div>
              <div className="text-xs text-text-secondary flex gap-2 flex-wrap">
                {item.grid_class ? <span className="px-2 py-0.5 bg-gray-100 rounded">Grid: {item.grid_class}</span> : null}
                {typeof item.display_order === "number" ? <span className="px-2 py-0.5 bg-gray-100 rounded">Order: {item.display_order}</span> : null}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleEdit(item)}
                className="text-primary text-sm hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => setConfirmDelete(item)}
                className="text-red-500 text-sm hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="bg-card w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-text-primary">Manage Homepage Collage</h2>
              <p className="text-sm text-text-secondary">
                Add or edit tiles for Shop by Occasion and Shop by Crystal sections.
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </header>
          <main className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 overflow-y-auto">
            <div className="lg:col-span-2 space-y-4 bg-gray-50 rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">{editingItem ? "Edit Tile" : "Add Tile"}</h3>
                {editingItem && (
                  <button
                    onClick={resetForm}
                    className="text-sm text-primary hover:underline"
                  >
                    New tile
                  </button>
                )}
              </div>

              <label className="space-y-1 text-sm">
                <span className="text-text-secondary">Name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleInput("name", e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2"
                  placeholder="e.g., Wedding & Bridal"
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="space-y-1 text-sm">
                  <span className="text-text-secondary">Type</span>
                  <select
                    value={form.item_type}
                    onChange={(e) => handleInput("item_type", e.target.value as HomeCollageItem["item_type"])}
                    className="w-full border border-border rounded-md px-3 py-2"
                  >
                    <option value="occasion">Occasion</option>
                    <option value="crystal">Crystal</option>
                    <option value="product_type">Product Type</option>
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-text-secondary">Grid class (optional)</span>
                  <input
                    type="text"
                    value={form.grid_class}
                    onChange={(e) => handleInput("grid_class", e.target.value)}
                    placeholder="e.g., md:col-span-2"
                    className="w-full border border-border rounded-md px-3 py-2"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="space-y-1 text-sm">
                  <span className="text-text-secondary">Image URL (optional if uploading)</span>
                  <input
                    type="text"
                    value={form.image_url}
                    onChange={(e) => handleInput("image_url", e.target.value)}
                    placeholder="https://"
                    className="w-full border border-border rounded-md px-3 py-2"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-text-secondary">Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleInput("imageFile", e.target.files?.[0] || null)}
                    className="w-full border border-border rounded-md px-3 py-2 bg-white"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="space-y-1 text-sm">
                  <span className="text-text-secondary">Display order</span>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => handleInput("display_order", e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full border border-border rounded-md px-3 py-2"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-text-secondary">Redirect URL (optional)</span>
                  <input
                    type="text"
                    value={form.redirect_url}
                    onChange={(e) => handleInput("redirect_url", e.target.value)}
                    placeholder="Send users to a specific collection"
                    className="w-full border border-border rounded-md px-3 py-2"
                  />
                </label>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary text-white px-4 py-2 rounded-lg disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingItem ? "Update Tile" : "Add Tile"}
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 rounded-lg border border-border text-text-secondary hover:bg-gray-100"
                  type="button"
                >
                  Reset
                </button>
                {previewImage && (
                  <span className="text-xs text-text-secondary">Preview shown on the right</span>
                )}
              </div>

              <div className="border border-dashed border-border rounded-lg p-3 min-h-[160px] bg-white">
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="w-full h-40 object-cover rounded-md" />
                ) : (
                  <div className="text-sm text-text-secondary h-40 flex items-center justify-center">
                    Image preview will appear here
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-3 space-y-6">
              {loading ? (
                <p className="text-sm text-text-secondary">Loading tiles...</p>
              ) : (
                <>
                  <TileList title="Occasions" items={grouped.occasion} />
                  <TileList title="Crystals" items={grouped.crystal} />
                  <TileList title="Product Types" items={grouped.product_type} />
                </>
              )}
            </div>
          </main>
        </div>
      </div>
      {confirmDelete && (
        <ConfirmationModal
          isOpen={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
          title="Delete tile?"
          description={`This will remove "${confirmDelete.name}" from the homepage collage.`}
        />
      )}
    </>
  );
};

export default HomeCollageManagerModal;
