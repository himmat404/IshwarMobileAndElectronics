'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Plus } from 'lucide-react';
import Image from 'next/image';

interface MultiImageUploadProps {
  values: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  label?: string;
  maxImages?: number;
  token: string;
}

export default function MultiImageUpload({
  values,
  onChange,
  folder = 'products',
  label = 'Upload Images',
  maxImages = 5,
  token,
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check if adding these files would exceed max
    if (values.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate all files
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024;

    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
        return;
      }
      if (file.size > maxSize) {
        setError('One or more files are too large. Maximum size is 5MB per image.');
        return;
      }
    }

    setError('');
    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      // Upload files one by one
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
          uploadedUrls.push(data.url);
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      }

      onChange([...values, ...uploadedUrls]);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (indexToRemove: number) => {
    onChange(values.filter((_, index) => index !== indexToRemove));
  };

  const canAddMore = values.length < maxImages;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} ({values.length}/{maxImages})
      </label>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {/* Existing Images */}
        {values.map((url, index) => (
          <div
            key={index}
            className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
          >
            <Image
              src={url}
              alt={`Image ${index + 1}`}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* Upload Button */}
        {canAddMore && (
          <div className="relative aspect-square">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
              id={`multi-file-upload-${folder}`}
            />
            <label
              htmlFor={`multi-file-upload-${folder}`}
              className={`flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                uploading
                  ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-300 hover:border-blue-500 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {uploading ? (
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              ) : (
                <div className="flex flex-col items-center">
                  <Plus className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500 text-center px-2">
                    Add Image
                  </p>
                </div>
              )}
            </label>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-2">
        JPEG, PNG, WebP, GIF (Max 5MB per image)
      </p>
    </div>
  );
}