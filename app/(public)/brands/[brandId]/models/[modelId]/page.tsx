'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Package, Loader2, Filter, X } from 'lucide-react';
import { formatPrice, getStockStatus } from '@/lib/utils';
import SearchInput from '@/components/public/SearchInput';
import type { Model, Product } from '@/types';

export default function ModelProductsPage() {
  const params = useParams();
  const brandId = params.brandId as string;
  const modelId = params.modelId as string;

  const [model, setModel] = useState<Model | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'cover' | 'screen-guard'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, [modelId]);

  useEffect(() => {
    // Filter products based on search query and filters
    let filtered = [...allProducts];

    // Search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((product) => {
        return (
          product.name.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.material?.toLowerCase().includes(query) ||
          product.color?.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query)
        );
      });
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((product) => product.type === typeFilter);
    }

    // Stock filter
    if (stockFilter === 'in-stock') {
      filtered = filtered.filter((product) => product.stockQuantity > 0);
    }

    setFilteredProducts(filtered);
  }, [searchQuery, typeFilter, stockFilter, allProducts]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch model
      const modelRes = await fetch(`/api/models/${modelId}`);
      if (!modelRes.ok) {
        throw new Error('Model not found');
      }
      const modelData = await modelRes.json();
      setModel(modelData.model);

      // Fetch products
      const productsRes = await fetch(`/api/products?modelId=${modelId}`);
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setAllProducts(productsData.products);
        setFilteredProducts(productsData.products);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStockFilter('all');
    setShowMobileFilters(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
        </div>
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm sm:text-base">
          {error || 'Model not found'}
        </div>
      </div>
    );
  }

  const covers = filteredProducts.filter((p) => p.type === 'cover');
  const screenGuards = filteredProducts.filter((p) => p.type === 'screen-guard');
  const totalCovers = allProducts.filter((p) => p.type === 'cover').length;
  const totalScreenGuards = allProducts.filter((p) => p.type === 'screen-guard').length;

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs sm:text-sm text-[var(--muted)] mb-4 sm:mb-6 overflow-x-auto pb-2">
        <Link href="/" className="hover:text-[var(--accent)] whitespace-nowrap">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
        <Link
          href={`/brands/${brandId}`}
          className="hover:text-[var(--accent)] whitespace-nowrap"
        >
          {typeof model.brandId === 'object' ? model.brandId.name : 'Brand'}
        </Link>
        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
        <span className="text-[var(--foreground)] font-medium truncate">{model.name}</span>
      </div>

      {/* Model Header */}
      <div className="card p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
          {model.image ? (
            <div className="w-full md:w-40 lg:w-48 h-40 sm:h-48 relative flex-shrink-0 mx-auto md:mx-0">
              <Image
                src={model.image}
                alt={model.name}
                fill
                sizes="(max-width: 768px) 100vw, 192px"
                priority
                className="object-contain"
              />
            </div>
          ) : (
            <div className="w-full md:w-40 lg:w-48 h-40 sm:h-48 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mx-auto md:mx-0">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--foreground)] mb-1 sm:mb-2">
              {model.name}
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-[var(--muted)] mb-2 sm:mb-4">
              {typeof model.brandId === 'object' && model.brandId.name}
            </p>
            {model.releaseYear && (
              <p className="text-sm sm:text-base text-[var(--muted)] mb-2">
                Released: {model.releaseYear}
              </p>
            )}
            {model.specifications && (
              <p className="text-sm sm:text-base text-[var(--muted)] mb-3 sm:mb-4">
                {model.specifications}
              </p>
            )}
            <div className="flex gap-3 sm:gap-4">
              <div className="bg-blue-100/50 border border-blue-200/50 px-3 sm:px-4 py-2 rounded-xl flex-1 sm:flex-initial">
                <p className="text-xs sm:text-sm text-blue-600">Covers</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-700">
                  {totalCovers}
                </p>
              </div>
              <div className="bg-indigo-100/50 border border-indigo-200/50 px-3 sm:px-4 py-2 rounded-xl flex-1 sm:flex-initial">
                <p className="text-xs sm:text-sm text-indigo-600">Screen Guards</p>
                <p className="text-xl sm:text-2xl font-bold text-indigo-700">
                  {totalScreenGuards}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      {allProducts.length > 0 && (
        <div className="card p-3 sm:p-4 mb-4 sm:mb-6">
          {/* Mobile Filter Toggle */}
          <div className="md:hidden mb-3">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters{' '}
              {(typeFilter !== 'all' || stockFilter !== 'all') &&
                `(${[typeFilter !== 'all', stockFilter !== 'all'].filter(Boolean).length})`}
            </button>
          </div>

          <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 ${
              showMobileFilters ? 'block' : 'hidden md:grid'
            }`}
          >
            {/* Search */}
            <div className="md:col-span-3">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by name, material, color, or SKU..."
              />
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[var(--muted)] mb-2">
                Product Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-[var(--border)] rounded-lg bg-white"
              >
                <option value="all">All Products ({allProducts.length})</option>
                <option value="cover">Covers ({totalCovers})</option>
                <option value="screen-guard">
                  Screen Guards ({totalScreenGuards})
                </option>
              </select>
            </div>

            {/* Stock Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[var(--muted)] mb-2">
                Availability
              </label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-[var(--border)] rounded-lg bg-white"
              >
                <option value="all">All Products</option>
                <option value="in-stock">In Stock Only</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <div className="w-full px-3 sm:px-4 py-2 bg-gray-100 rounded-lg">
                <p className="text-xs sm:text-sm text-[var(--muted)]">Showing Results</p>
                <p className="text-base sm:text-lg font-bold text-[var(--foreground)]">
                  {filteredProducts.length}
                </p>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(searchQuery || typeFilter !== 'all' || stockFilter !== 'all') && (
            <div className="flex flex-wrap gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[var(--border)]">
              <span className="text-xs sm:text-sm font-medium text-[var(--muted)]">
                Active filters:
              </span>
              {searchQuery && (
                <span className="badge badge-blue">
                  Search: "
                  {searchQuery.length > 20
                    ? searchQuery.substring(0, 20) + '...'
                    : searchQuery}
                  "
                  <button onClick={() => setSearchQuery('')} className="hover:text-blue-900 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {typeFilter !== 'all' && (
                <span className="badge badge-blue">
                  {typeFilter === 'cover' ? 'Covers' : 'Screen Guards'}
                  <button onClick={() => setTypeFilter('all')} className="hover:text-blue-900 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {stockFilter !== 'all' && (
                <span className="badge badge-blue">
                  In Stock
                  <button onClick={() => setStockFilter('all')} className="hover:text-blue-900 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs sm:text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}

      {/* Products Display */}
      {allProducts.length === 0 ? (
        <div className="card text-center py-8 sm:py-12">
          <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-[var(--muted)]">
            No products available for this model yet.
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card text-center py-8 sm:py-12">
          <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-[var(--muted)] mb-2">
            No products found matching your filters.
          </p>
          <button
            onClick={clearAllFilters}
            className="mt-3 sm:mt-4 text-sm sm:text-base text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          {/* Show by Type or All Together */}
          {typeFilter === 'all' && !searchQuery ? (
            <>
              {/* Covers Section */}
              {covers.length > 0 && (
                <div className="mb-8 sm:mb-12">
                  <h2 className="text-xl sm:text-2xl font-bold gradient-text mb-4 sm:mb-6">
                    Phone Covers ({covers.length})
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    {covers.map((product) => (
                      <ProductCard key={product._id} product={product} currentModelId={modelId} />
                    ))}
                  </div>
                </div>
              )}

              {/* Screen Guards Section */}
              {screenGuards.length > 0 && (
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold gradient-text mb-4 sm:mb-6">
                    Screen Guards ({screenGuards.length})
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    {screenGuards.map((product) => (
                      <ProductCard key={product._id} product={product} currentModelId={modelId} />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold gradient-text mb-4 sm:mb-6">
                {typeFilter === 'cover'
                  ? 'Phone Covers'
                  : typeFilter === 'screen-guard'
                  ? 'Screen Guards'
                  : 'All Products'}{' '}
                ({filteredProducts.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product._id} product={product} currentModelId={modelId} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ProductCard({ product, currentModelId }: { product: Product; currentModelId: string }) {
  const stockStatus = getStockStatus(product.stockQuantity);
  const mainImage = product.images?.[0];

  const allModels =
    product.models && Array.isArray(product.models)
      ? product.models.filter((m) => typeof m === 'object')
      : [];

  const otherModels = allModels.filter((m) => m._id !== currentModelId);
  const hasOtherModels = otherModels.length > 0;

  return (
    <div
      className="glass rounded-2xl shadow-lg overflow-hidden group block
                 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
    >
      {mainImage ? (
        <div className="w-full h-48 relative bg-gray-50">
          <Image
            src={mainImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover"
          />
          {/* Compatibility Badge */}
          {hasOtherModels && (
            <div className="absolute top-2 right-2 bg-[var(--accent-indigo)] text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
              +{otherModels.length} {otherModels.length === 1 ? 'model' : 'models'}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
          <Package className="w-16 h-16 text-gray-300" />
        </div>
      )}

      <div className="p-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors mb-2 line-clamp-2">
          {product.name}
        </h3>

        <div className="flex items-center gap-2 mb-2 text-sm flex-wrap">
          <span
            className={`badge ${
              product.type === 'cover' ? 'badge-blue' : 'badge-indigo'
            }`}
          >
            {product.type === 'cover' ? 'Cover' : 'Screen Guard'}
          </span>
          {product.material && (
            <span className="badge bg-gray-100 text-[var(--muted)] border border-gray-200">
              {product.material}
            </span>
          )}
          {product.color && (
            <span className="badge bg-gray-100 text-[var(--muted)] border border-gray-200">
              {product.color}
            </span>
          )}
        </div>

        {/* Compatible Models Info */}
        {hasOtherModels && (
          <div className="mb-2 text-xs text-indigo-700 bg-indigo-100/50 px-2 py-1 rounded">
            <span className="font-medium">Also fits:</span>{' '}
            {otherModels.slice(0, 2).map((model, idx: number) => (
              <span key={model._id}>
                {idx > 0 && ', '}
                {model.name}
              </span>
            ))}
            {otherModels.length > 2 && <span> +{otherModels.length - 2} more</span>}
          </div>
        )}

        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-[var(--foreground)]">
            {formatPrice(product.price)}
          </span>
          <span className={`text-sm font-medium ${stockStatus.color}`}>
            {stockStatus.label}
          </span>
        </div>

        <p className="text-xs text-[var(--muted)]">SKU: {product.sku}</p>
      </div>
    </div>
  );
}