'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronRight,
  Loader2,
  Package,
  Shield,
  Truck,
  RefreshCw,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react';
import { formatPrice, getStockStatus } from '@/lib/utils';
import type { Product } from '@/types';

export default function ProductViewPage() {
  const params = useParams();
  const productId = params.productId as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);

      // Fetch product details
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error('Product not found');

      const data = await response.json();
      setProduct(data.product);

      // Increment view count (don't wait for response)
      fetch(`/api/products/${productId}/view`, { method: 'POST' }).catch(
        () => {} // Silently fail if view count update fails
      );
    } catch (err: any) {
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Product not found'}
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus(product.stockQuantity);
  const firstModel =
    product.models &&
    Array.isArray(product.models) &&
    product.models[0] &&
    typeof product.models[0] === 'object'
      ? product.models[0]
      : null;

  const brand =
    firstModel && typeof firstModel.brandId === 'object'
      ? firstModel.brandId
      : null;

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-blue-600">
          Home
        </Link>
        {brand && (
          <>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <Link href={`/brands/${brand._id}`} className="hover:text-blue-600">
              {brand.name}
            </Link>
          </>
        )}
        {firstModel && (
          <>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <Link
              href={`/brands/${brand?._id}/models/${firstModel._id}`}
              className="hover:text-blue-600"
            >
              {firstModel.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
        <span className="text-gray-900 font-medium truncate">
          {product.name}
        </span>
      </div>

      {/* Product Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden aspect-square">
            {product.images && product.images.length > 0 ? (
              <div className="relative w-full h-full">
                <Image
                  src={product.images[selectedImage]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <Package className="w-20 h-20 text-gray-300" />
              </div>
            )}
          </div>

          {/* Thumbnail Images */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index
                      ? 'border-blue-600 scale-105'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} - ${index + 1}`}
                    fill
                    sizes="100px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          {/* Product Name */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {product.name}
          </h1>

          {/* SKU and View Count */}
          <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
            <span>SKU: {product.sku}</span>
            {product.viewCount > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {product.viewCount} views
              </span>
            )}
          </div>

          {/* Compatible Models */}
          {product.models && Array.isArray(product.models) && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Compatible with:
              </p>
              <div className="flex flex-wrap gap-2">
                {product.models.map((model, idx) => {
                  if (typeof model === 'object') {
                    const brandName =
                      typeof model.brandId === 'object'
                        ? model.brandId.name
                        : '';
                    return (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {brandName} {model.name}
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}

          {/* Product Type and Details */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-sm font-medium">
              {product.type === 'cover' ? 'Phone Cover' : 'Screen Guard'}
            </span>
            {product.material && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                {product.material}
              </span>
            )}
            {product.color && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                {product.color}
              </span>
            )}
          </div>

          {/* Price */}
          <div className="mb-6">
            <p className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {formatPrice(product.price)}
            </p>
          </div>

          {/* Stock Status */}
          <div className="mb-6">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                stockStatus.status === 'in-stock'
                  ? 'bg-green-50 text-green-700'
                  : stockStatus.status === 'low-stock'
                  ? 'bg-orange-50 text-orange-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {stockStatus.status === 'in-stock' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span>{stockStatus.label}</span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Description
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Features */}
          <div className="border-t pt-6 space-y-3">
            <div className="flex items-center gap-3 text-gray-700">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span className="text-sm">Premium quality protection</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Truck className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span className="text-sm">Fast delivery available</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <RefreshCw className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span className="text-sm">Easy returns & exchanges</span>
            </div>
          </div>

          {/* Contact/Order Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900 font-medium mb-2">
              Interested in this product?
            </p>
            <p className="text-sm text-blue-800">
              Visit us in-store or contact us for more details and to place
              your order.
            </p>
          </div>
        </div>
      </div>

      {/* SEO Information (hidden, for search engines) */}
      {product.seoTitle && (
        <div className="hidden">
          <h2>{product.seoTitle}</h2>
          {product.seoDescription && <p>{product.seoDescription}</p>}
          {product.seoKeywords && (
            <meta name="keywords" content={product.seoKeywords.join(', ')} />
          )}
        </div>
      )}
    </div>
  );
}