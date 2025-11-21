'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Eye, Palette } from 'lucide-react';
import { formatPrice, getStockStatus } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductCardWithVariantsProps {
  product: Product;
  showVariants?: boolean;
}

export default function ProductCardWithVariants({
  product,
  showVariants = true,
}: ProductCardWithVariantsProps) {
  const [colorVariants, setColorVariants] = useState<Product[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<Product>(product);
  const [loadingVariants, setLoadingVariants] = useState(false);

  useEffect(() => {
    if (showVariants && product.color) {
      fetchColorVariants();
    }
  }, [product._id, showVariants]);

  const fetchColorVariants = async () => {
    try {
      setLoadingVariants(true);

      // Search for products with same name, type, and models
      const params = new URLSearchParams({
        search: product.name,
        type: product.type,
        limit: '10',
      });

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) return;

      const data = await response.json();

      // Filter to get variants (same name, different color, common model)
      const variants = data.products.filter((p: Product) => {
        if (p._id === product._id) return false;
        if (p.name !== product.name) return false;
        if (!p.color || p.color === product.color) return false;

        const currentModelIds = product.models.map((m) =>
          typeof m === 'object' ? m._id : m
        );
        const variantModelIds = p.models.map((m) =>
          typeof m === 'object' ? m._id : m
        );

        return currentModelIds.some((id) => variantModelIds.includes(id));
      });

      setColorVariants(variants);
    } catch (err) {
      console.error('Failed to fetch variants:', err);
    } finally {
      setLoadingVariants(false);
    }
  };

  const handleColorSelect = (variant: Product) => {
    setSelectedVariant(variant);
  };

  const stockStatus = getStockStatus(selectedVariant.stockQuantity);
  const firstModel =
    selectedVariant.models &&
    Array.isArray(selectedVariant.models) &&
    selectedVariant.models[0] &&
    typeof selectedVariant.models[0] === 'object'
      ? selectedVariant.models[0]
      : null;

  const hasVariants = colorVariants.length > 0;

  return (
    <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
      {/* Product Image */}
      <Link
        href={`/products/${selectedVariant._id}`}
        className="relative h-48 bg-gray-50 block"
      >
        {selectedVariant.images && selectedVariant.images.length > 0 ? (
          <Image
            src={selectedVariant.images[0]}
            alt={selectedVariant.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* View Count Badge */}
        {selectedVariant.viewCount > 0 && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {selectedVariant.viewCount}
          </div>
        )}

        {/* Variant Indicator Badge */}
        {hasVariants && (
          <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Palette className="w-3 h-3" />
            {colorVariants.length + 1}
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1">
        {firstModel && (
          <p className="text-xs text-gray-500 mb-1 truncate">
            {typeof firstModel.brandId === 'object' &&
              `${firstModel.brandId.name} ${firstModel.name}`}
          </p>
        )}

        <Link href={`/products/${selectedVariant._id}`}>
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 mb-2 line-clamp-2">
            {selectedVariant.name}
          </h3>
        </Link>

        {/* Color Variants Selector */}
        {showVariants && (product.color || hasVariants) && (
          <div className="mb-3">
            <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
              <Palette className="w-3 h-3" />
              Colors:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {/* Current Product */}
              {product.color && (
                <button
                  onClick={() => handleColorSelect(product)}
                  className={`px-2 py-1 text-xs rounded border transition-all ${
                    selectedVariant._id === product._id
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                  }`}
                  title={product.color}
                >
                  {product.color.length > 8
                    ? product.color.substring(0, 8) + '...'
                    : product.color}
                </button>
              )}

              {/* Variant Colors */}
              {colorVariants.slice(0, 3).map((variant) => (
                <button
                  key={variant._id}
                  onClick={() => handleColorSelect(variant)}
                  disabled={variant.stockQuantity === 0}
                  className={`px-2 py-1 text-xs rounded border transition-all ${
                    selectedVariant._id === variant._id
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                      : variant.stockQuantity === 0
                      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                  }`}
                  title={variant.color || 'Unknown'}
                >
                  {variant.color && variant.color.length > 8
                    ? variant.color.substring(0, 8) + '...'
                    : variant.color}
                </button>
              ))}

              {/* Show "+X more" if more variants exist */}
              {colorVariants.length > 3 && (
                <Link
                  href={`/products/${product._id}`}
                  className="px-2 py-1 text-xs rounded border border-dashed border-gray-400 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-600"
                >
                  +{colorVariants.length - 3}
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Price and Stock - Push to bottom */}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {formatPrice(selectedVariant.price)}
          </span>
          <span className={`text-xs font-medium ${stockStatus.color}`}>
            {stockStatus.status === 'in-stock' ? 'In Stock' : stockStatus.label}
          </span>
        </div>
      </div>
    </div>
  );
}