'use client';

import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import type { Product, Model } from '@/types';
import MultiImageUpload from '@/components/admin/MultiImageUpload';
import ModelMultiSelect from '@/components/admin/ModelMultiSelect';

interface ProductModalProps {
  product: Product | null;
  onClose: (updated?: boolean) => void;
  token: string | null;
  allModels: Model[];
}

export default function ProductModal({
  product,
  onClose,
  token,
  allModels,
}: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    models: product?.models?.map((m) => (typeof m === 'object' ? m._id : m)) || [],
    type: product?.type || 'cover',
    material: product?.material || '',
    color: product?.color || '',
    price: product?.price || 0,
    images: product?.images || [],
    description: product?.description || '',
    stockQuantity: product?.stockQuantity || 0,
    // SEO fields
    seoTitle: product?.seoTitle || '',
    seoDescription: product?.seoDescription || '',
    seoKeywords: product?.seoKeywords || [],
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addKeyword = () => {
    const keyword = keywordInput.trim();
    if (keyword && !formData.seoKeywords.includes(keyword)) {
      setFormData({
        ...formData,
        seoKeywords: [...formData.seoKeywords, keyword],
      });
      setKeywordInput('');
    }
  };

  const removeKeyword = (index: number) => {
    setFormData({
      ...formData,
      seoKeywords: formData.seoKeywords.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    // Validation
    if (!formData.name.trim()) {
      setError('Product name is required');
      setSaving(false);
      return;
    }
    if (formData.models.length === 0) {
      setError('Please select at least one compatible model');
      setSaving(false);
      return;
    }

    try {
      const url = product ? `/api/products/${product._id}` : '/api/products';
      const method = product ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price.toString()),
          stockQuantity: parseInt(formData.stockQuantity.toString()),
          seoTitle: formData.seoTitle.trim() || undefined,
          seoDescription: formData.seoDescription.trim() || undefined,
          seoKeywords: formData.seoKeywords.filter(k => k.trim()),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onClose(true);
      } else {
        setError(data.error || 'Failed to save product');
      }
    } catch (err) {
      setError('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const inputStyles = `w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-[var(--border)] rounded-lg
                       focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-colors bg-white`;
  const labelStyles = `block text-sm font-medium text-[var(--muted)] mb-1.5`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-3 sm:p-4 overflow-y-auto">
      <div className="card max-w-2xl w-full my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-xl sm:text-2xl font-bold gradient-text">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button
            onClick={() => onClose(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-3 sm:mb-4 text-sm sm:text-base">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Compatible Models */}
            <div className="sm:col-span-2">
              <ModelMultiSelect
                selectedModels={formData.models}
                onChange={(modelIds) =>
                  setFormData({ ...formData, models: modelIds })
                }
                label="Compatible Phone Models"
                allModels={allModels}
              />
            </div>

            {/* Product Name */}
            <div className="sm:col-span-2">
              <label className={labelStyles}>Product Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className={inputStyles}
                placeholder="e.g., Silicone Case - Black"
              />
            </div>

            {/* Type */}
            <div>
              <label className={labelStyles}>Type *</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as any })
                }
                required
                className={inputStyles}
              >
                <option value="cover">Cover</option>
                <option value="screen-guard">Screen Guard</option>
              </select>
            </div>

            {/* SKU */}
            <div>
              <label className={labelStyles}>
                SKU
                <span className="text-xs text-[var(--muted)] font-normal ml-2">
                  (Auto-generated)
                </span>
              </label>
              <input
                type="text"
                value={product?.sku || 'Will be auto-generated'}
                disabled
                className={`${inputStyles} bg-gray-50 cursor-not-allowed`}
                placeholder="Auto-generated on save"
              />
            </div>

            {/* Material */}
            <div>
              <label className={labelStyles}>Material</label>
              <input
                type="text"
                value={formData.material}
                onChange={(e) =>
                  setFormData({ ...formData, material: e.target.value })
                }
                className={inputStyles}
                placeholder="e.g., Silicone"
              />
            </div>

            {/* Color */}
            <div>
              <label className={labelStyles}>Color</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className={inputStyles}
                placeholder="e.g., Black"
              />
            </div>

            {/* Price */}
            <div>
              <label className={labelStyles}>Price (₹) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                }
                required
                min="0"
                step="0.01"
                className={inputStyles}
              />
            </div>

            {/* Stock Quantity */}
            <div>
              <label className={labelStyles}>Stock Quantity *</label>
              <input
                type="number"
                value={formData.stockQuantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stockQuantity: parseInt(e.target.value) || 0,
                  })
                }
                required
                min="0"
                className={inputStyles}
              />
            </div>

            {/* Product Images */}
            <div className="sm:col-span-2">
              <MultiImageUpload
                values={formData.images}
                onChange={(urls) => setFormData({ ...formData, images: urls })}
                folder="products"
                label="Product Images"
                maxImages={5}
                token={token || ''}
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className={labelStyles}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className={`${inputStyles} resize-none`}
                placeholder="Enter a short product description..."
              />
            </div>

            <div className='hidden'>
                {/* SEO Section Divider */}
                <div className="sm:col-span-2 border-t pt-4 mt-2">
                <h3 className="text-base font-semibold text-[var(--foreground)] mb-3">
                    SEO Settings (Optional)
                </h3>
                <p className="text-xs text-[var(--muted)] mb-4">
                    Leave blank to auto-generate based on product details
                </p>
                </div>

                {/* SEO Title */}
                <div className="sm:col-span-2">
                <label className={labelStyles}>
                    SEO Title
                    <span className="text-xs text-[var(--muted)] ml-2">
                    ({formData.seoTitle.length}/60 chars)
                    </span>
                </label>
                <input
                    type="text"
                    value={formData.seoTitle}
                    onChange={(e) => {
                    if (e.target.value.length <= 60) {
                        setFormData({ ...formData, seoTitle: e.target.value });
                    }
                    }}
                    className={inputStyles}
                    placeholder="Auto-generated: Product Name - Brand Model | Type"
                />
                <p className="text-xs text-[var(--muted)] mt-1">
                    Appears in search engine results. Keep under 60 characters.
                </p>
                </div>

                {/* SEO Description */}
                <div className="sm:col-span-2">
                <label className={labelStyles}>
                    SEO Description
                    <span className="text-xs text-[var(--muted)] ml-2">
                    ({formData.seoDescription.length}/160 chars)
                    </span>
                </label>
                <textarea
                    value={formData.seoDescription}
                    onChange={(e) => {
                    if (e.target.value.length <= 160) {
                        setFormData({ ...formData, seoDescription: e.target.value });
                    }
                    }}
                    rows={2}
                    className={`${inputStyles} resize-none`}
                    placeholder="Auto-generated: Buy [Product] for [Brand Model]. Price: ₹[Price]..."
                />
                <p className="text-xs text-[var(--muted)] mt-1">
                    Appears in search results. Keep under 160 characters.
                </p>
                </div>

                {/* SEO Keywords */}
                <div className="sm:col-span-2">
                <label className={labelStyles}>SEO Keywords</label>
                <div className="flex gap-2 mb-2">
                    <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                        e.preventDefault();
                        addKeyword();
                        }
                    }}
                    className={`${inputStyles} flex-1`}
                    placeholder="Enter keyword and press Enter"
                    />
                    <button
                    type="button"
                    onClick={addKeyword}
                    className="px-4 py-2 bg-blue-500/10 text-[var(--accent)] rounded-lg
                                hover:bg-blue-500/20 font-medium transition-colors text-sm"
                    >
                    Add
                    </button>
                </div>

                {/* Keywords Display */}
                {formData.seoKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                    {formData.seoKeywords.map((keyword, index) => (
                        <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 
                                    text-blue-700 rounded-full text-sm"
                        >
                        {keyword}
                        <button
                            type="button"
                            onClick={() => removeKeyword(index)}
                            className="hover:text-blue-900"
                            aria-label={`Remove ${keyword}`}
                        >
                            <X className="w-3 h-3" />
                        </button>
                        </span>
                    ))}
                    </div>
                )}
                <p className="text-xs text-[var(--muted)] mt-1">
                    Add relevant keywords to improve search visibility
                </p>
                </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
            <button
              type="button"
              onClick={() => onClose(false)}
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm sm:text-base border border-[var(--border)] text-[var(--muted)] rounded-xl
                         hover:bg-gray-500/10 hover:text-[var(--foreground)] font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="btn-gradient flex-1 py-2 text-sm sm:text-base flex items-center justify-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : product ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}