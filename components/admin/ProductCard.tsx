'use client';

import { Edit2, Trash2, Package } from 'lucide-react';
import Image from 'next/image';
import { formatPrice, getStockStatus } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ProductCard({
  product,
  onEdit,
  onDelete,
}: ProductCardProps) {
  const stockStatus = getStockStatus(product.stockQuantity);

  const modelsList =
    product.models && Array.isArray(product.models)
      ? product.models
          .map((m) => {
            if (typeof m === 'object') {
              const brandName =
                typeof m.brandId === 'object' ? m.brandId.name : '';
              return brandName ? `${brandName} ${m.name}` : m.name;
            }
            return '';
          })
          .filter(Boolean)
      : [];

  return (
    <div
      className="glass rounded-2xl shadow-lg border border-white/20 overflow-hidden 
                 flex flex-col hover:shadow-2xl hover:scale-[1.02] transition-all"
    >
      {/* Product Image */}
      <div className="relative h-48 bg-gray-500/5">
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Stock Status Badge */}
        <div className="absolute top-2 right-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium border ${
              stockStatus.status === 'in-stock'
                ? 'bg-green-100/20 border-green-200 text-green-700'
                : stockStatus.status === 'low-stock'
                ? 'bg-yellow-100/20 border-yellow-200 text-yellow-700'
                : 'bg-red-100/20 border-red-200 text-red-700'
            }`}
          >
            {stockStatus.label}
          </span>
        </div>

        {/* View Count Badge */}
        {product.viewCount > 0 && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100/20 border border-blue-200 text-blue-700">
              {product.viewCount} views
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-[var(--foreground)] line-clamp-2 flex-1 text-sm">
          {product.name}
        </h3>

        {/* Compatible Models */}
        {modelsList.length > 0 && (
          <div className="mt-2 mb-3">
            <p className="text-xs font-medium text-[var(--muted)] mb-1">
              Compatible with:
            </p>
            <div className="flex flex-wrap gap-1">
              {modelsList.map((model, idx) => (
                <span key={idx} className="badge badge-blue !text-xs">
                  {model}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* SKU and Type */}
        <div className="space-y-1 mt-2 mb-3 text-xs text-[var(--muted)]">
          <p>
            <span className="font-medium text-[var(--foreground)]">SKU:</span>{' '}
            {product.sku}
          </p>
          <p>
            <span className="font-medium text-[var(--foreground)]">Type:</span>{' '}
            {product.type === 'cover' ? 'Cover' : 'Screen Guard'}
          </p>
        </div>

        {/* Price */}
        <p className="text-xl font-bold gradient-text mb-3">
          {formatPrice(product.price)}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2
                       bg-blue-500/10 text-[var(--accent)] rounded-lg text-xs
                       hover:bg-blue-500/20 font-medium transition-colors"
            aria-label={`Edit ${product.name}`}
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>

          <button
            onClick={onDelete}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2
                       bg-red-500/10 text-red-600 rounded-lg text-xs
                       hover:bg-red-500/20 font-medium transition-colors"
            aria-label={`Delete ${product.name}`}
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}