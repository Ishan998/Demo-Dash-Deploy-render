
import React, { useState, useEffect, DragEvent } from 'react';
import { Banner, BannerStatus } from '../types';
import Toast from './Toast';

interface BannerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (banner: Omit<Banner, 'id'> | Banner) => void;
  bannerToEdit: Banner | null;
}

// Local form state allows File or string for image
type BannerFormState = {
  title: string;
  image: File | string | null;
  startDate?: string;
  endDate?: string;
};

const emptyBanner: BannerFormState = {
  title: '',
  image: null,
  startDate: undefined,
  endDate: undefined,
};

const BannerFormModal: React.FC<BannerFormModalProps> = ({ isOpen, onClose, onSave, bannerToEdit }) => {
  const [data, setData] = useState<BannerFormState>(emptyBanner);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const REQUIRED_WIDTH = 1200;
  const REQUIRED_HEIGHT = 400;

  useEffect(() => {
    if (bannerToEdit) {
      setData({
        ...emptyBanner,
        title: bannerToEdit.title,
        image: bannerToEdit.image || null,
        startDate: bannerToEdit.startDate,
        endDate: bannerToEdit.endDate,
      });
      setPreviewUrl(bannerToEdit.image || null);
    } else {
      setData({ ...emptyBanner });
      setPreviewUrl(null);
    }
  }, [bannerToEdit, isOpen]);

  // Generate preview URL whenever image changes
  useEffect(() => {
    if (!data.image) {
      setPreviewUrl(null);
      return;
    }
    if (typeof data.image === 'string') {
      setPreviewUrl(data.image);
      return;
    }
    const url = URL.createObjectURL(data.image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [data.image]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const validateImageDimensions = (file: File): Promise<{ ok: boolean; width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        URL.revokeObjectURL(url);
        const ok = width === REQUIRED_WIDTH && height === REQUIRED_HEIGHT;
        resolve({ ok, width, height });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ ok: false, width: 0, height: 0 });
      };
      img.src = url;
    });
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Please upload a valid image file.', type: 'error' });
      return;
    }
    const { ok, width, height } = await validateImageDimensions(file);
    if (!ok) {
      setToast({
        message: `Banner must be ${REQUIRED_WIDTH}×${REQUIRED_HEIGHT}. Selected is ${width}×${height}.`,
        type: 'error',
      });
      return;
    }
    setData(prev => ({ ...prev, image: file }));
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); handleImageUpload(e.dataTransfer.files); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.image) {
        alert("Please upload a banner image.");
        return;
    }
    
    const now = new Date();
    const startDate = data.startDate ? new Date(data.startDate) : null;
    let status = BannerStatus.Inactive;

    if (startDate && startDate > now) {
        status = BannerStatus.Scheduled;
    } else {
        status = BannerStatus.Active;
    }

    if (bannerToEdit) {
      onSave({ ...bannerToEdit, ...data } as any);
    } else {
      onSave({ ...(data as any), status });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-card w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <header className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-text-primary">{bannerToEdit ? 'Edit Banner' : 'Create Banner'}</h2>
            <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </header>

          <main className="p-6 overflow-y-auto space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Banner Title</label>
                <input type="text" name="title" value={data.title} onChange={handleChange} placeholder="e.g. Summer Sale Banner" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Banner Image</h3>
              {previewUrl ? (
                <div className="relative">
                  <img src={previewUrl} alt="Banner preview" className="w-full h-auto max-h-48 object-contain rounded-md bg-gray-100" />
                  <div className="absolute top-2 right-2 flex gap-2">
                    {previewUrl && (
                      <a href={previewUrl} target="_blank" rel="noreferrer" className="bg-black/60 text-white text-xs px-2 py-1 rounded-md">View</a>
                    )}
                    <button
                      type="button"
                      onClick={() => { setData(d => ({ ...d, image: null })); setPreviewUrl(null); }}
                      className="bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => document.getElementById('banner-upload')?.click()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragging ? 'border-primary bg-green-50' : 'border-gray-300 hover:border-primary'}`}
                  >
                    <input id="banner-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files)} />
                    <p className="text-gray-500">Drag & Drop Banner or Click to Upload</p>
                    <p className="text-xs text-gray-500 mt-1">Required: {REQUIRED_WIDTH}px × {REQUIRED_HEIGHT}px (3:1). JPG/PNG.</p>
                  </div>
                </div>
              )}
            </div>

            {toast && (
              <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}

            <div className="border-t pt-4">
                 <h3 className="text-md font-semibold text-gray-900 mb-2">Active Dates (optional)</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Start date</label>
                        <input type="date" name="startDate" value={data.startDate || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">End date</label>
                        <input type="date" name="endDate" value={data.endDate || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                     </div>
                 </div>
            </div>
          </main>

          <footer className="flex items-center justify-end p-4 border-t border-gray-200 space-x-4 bg-gray-50">
            <button type="button" onClick={onClose} className="text-text-secondary font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 transition">
              Cancel
            </button>
            <button type="submit" className="bg-primary text-white font-semibold py-2 px-6 rounded-lg hover:bg-opacity-90 transition">
              {bannerToEdit ? 'Save Changes' : 'Save Banner'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default BannerFormModal;
