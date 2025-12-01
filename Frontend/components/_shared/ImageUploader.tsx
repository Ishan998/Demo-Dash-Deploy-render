// ✅ FILE: src/components/_shared/ImageUploader.tsx

import React, { useRef, useState } from "react";

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

const ImageUploader: React.FC<ImageUploaderProps> = ({ images, onImagesChange }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const base64Files = await Promise.all(Array.from(files).map(fileToBase64));
    onImagesChange([...(images || []), ...base64Files]);
  };

  return (
    <div>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
          isDragging
            ? "border-primary bg-blue-50"
            : "border-gray-300 hover:border-primary"
        }`}
        onClick={() => inputRef.current?.click()}
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
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-gray-500">
          <span className="font-medium text-primary">Click to upload</span> or drag & drop images
        </p>
      </div>

      {/* Preview Thumbnails */}
      {images?.length > 0 && (
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {images.map((src, index) => (
            <div key={index} className="relative group">
              <img
                src={src}
                alt={`upload-${index}`}
                className="w-full h-24 object-cover rounded-xl shadow-md"
              />
              <button
                type="button"
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                onClick={() =>
                  onImagesChange(images.filter((_, i) => i !== index))
                }
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
