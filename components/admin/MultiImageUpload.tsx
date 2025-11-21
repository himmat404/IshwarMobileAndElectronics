'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Plus, AlertCircle } from 'lucide-react';
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // ✅ Check authentication
    if (!token) {
      setError('Authentication required. Please log in again.');
      return;
    }

    // Check if adding these files would exceed max
    if (values.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed. You can add ${maxImages - values.length} more.`);
      return;
    }

    // Validate all files before uploading
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        setError(`Invalid file type: ${file.name}. Only JPEG, PNG, WebP, and GIF are allowed.`);
        return;
      }
      if (file.size > maxSize) {
        setError(`File too large: ${file.name}. Maximum size is 5MB per image.`);
        return;
      }
      // ✅ Check file name length
      if (file.name.length > 255) {
        setError(`File name too long: ${file.name}. Please rename the file.`);
        return;
      }
    }

    setError('');
    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedUrls: string[] = [];
      const totalFiles = files.length;

      // Upload files one by one
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        try {
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
            setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
          } else {
            // ✅ Handle different error types
            if (response.status === 401) {
              throw new Error('Session expired. Please log in again.');
            } else if (response.status === 403) {
              throw new Error('You do not have permission to upload images.');
            } else {
              throw new Error(data.error || `Failed to upload ${file.name}`);
            }
          }
        } catch (fetchError: any) {
          console.error('Upload fetch error:', fetchError);
          throw new Error(fetchError.message || `Network error while uploading ${file.name}`);
        }
      }

      // ✅ Only update if we successfully uploaded all files
      if (uploadedUrls.length > 0) {
        onChange([...values, ...uploadedUrls]);
      }
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (indexToRemove: number) => {
    onChange(values.filter((_, index) => index !== indexToRemove));
    setError(''); // Clear any errors when removing
  };

  const canAddMore = values.length < maxImages;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} ({values.length}/{maxImages})
      </label>

      {/* ✅ Enhanced error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Upload Error</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => setError('')}
            className="text-red-700 hover:text-red-900"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ✅ Upload progress indicator */}
      {uploading && uploadProgress > 0 && (
        <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-700 font-medium">
              Uploading... {uploadProgress}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {/* Existing Images */}
        {values.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group"
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
              disabled={uploading}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full 
                       hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 
                       transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Remove image ${index + 1}`}
            >
              <X className="w-3 h-3" />
            </button>
            {/* ✅ Image number badge */}
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
              {index + 1}
            </div>
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
              disabled={uploading || !token}
              className="hidden"
              id={`multi-file-upload-${folder}`}
            />
            <label
              htmlFor={`multi-file-upload-${folder}`}
              className={`flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-lg transition-all ${
                uploading || !token
                  ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-50'
                  : 'border-gray-300 hover:border-blue-500 bg-gray-50 hover:bg-gray-100 cursor-pointer'
              }`}
            >
              {uploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                  <p className="text-xs text-gray-500">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Plus className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500 text-center px-2">
                    {token ? 'Add Image' : 'Login Required'}
                  </p>
                  {canAddMore && token && (
                    <p className="text-xs text-gray-400 mt-1">
                      {maxImages - values.length} more
                    </p>
                  )}
                </div>
              )}
            </label>
          </div>
        )}
      </div>

      <div className="mt-2 space-y-1">
        <p className="text-xs text-gray-500">
          JPEG, PNG, WebP, GIF (Max 5MB per image)
        </p>
        {canAddMore && (
          <p className="text-xs text-gray-400">
            You can select multiple images at once
          </p>
        )}
      </div>
    </div>
  );
}