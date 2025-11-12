'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Package, Loader2 } from 'lucide-react';
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
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
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-6 flex-wrap">
        <Link href="/" className="hover:text-gray-900">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link 
          href={`/brands/${brandId}`}
          className="hover:text-gray-900"
        >
          {typeof model.brandId === 'object' ? model.brandId.name : 'Brand'}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">{model.name}</span>
      </div>
      
      {/* Model Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
        <div className="flex flex-col md:flex-row gap-6">
          {model.image ? (
            <div className="w-full md:w-48 h-48 relative flex-shrink-0">
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
            <div className="w-full md:w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="w-16 h-16 text-gray-400" />
            </div>
          )}
          
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {model.name}
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              {typeof model.brandId === 'object' && model.brandId.name}
            </p>
            {model.releaseYear && (
              <p className="text-gray-500 mb-2">Released: {model.releaseYear}</p>
            )}
            {model.specifications && (
              <p className="text-gray-600">{model.specifications}</p>
            )}
            <div className="flex gap-4 mt-4">
              <div className="bg-blue-50 px-4 py-2 rounded-lg">
                <p className="text-sm text-gray-600">Covers</p>
                <p className="text-2xl font-bold text-blue-600">{totalCovers}</p>
              </div>
              <div className="bg-green-50 px-4 py-2 rounded-lg">
                <p className="text-sm text-gray-600">Screen Guards</p>
                <p className="text-2xl font-bold text-green-600">{totalScreenGuards}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      {allProducts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Products ({allProducts.length})</option>
                <option value="cover">Covers ({totalCovers})</option>
                <option value="screen-guard">Screen Guards ({totalScreenGuards})</option>
              </select>
            </div>

            {/* Stock Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability
              </label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Products</option>
                <option value="in-stock">In Stock Only</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <div className="w-full px-4 py-2 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Showing Results</p>
                <p className="text-lg font-bold text-gray-900">{filteredProducts.length}</p>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(searchQuery || typeFilter !== 'all' || stockFilter !== 'all') && (
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-sm font-medium text-gray-700">Active filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-blue-900">
                    ×
                  </button>
                </span>
              )}
              {typeFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {typeFilter === 'cover' ? 'Covers' : 'Screen Guards'}
                  <button onClick={() => setTypeFilter('all')} className="hover:text-blue-900">
                    ×
                  </button>
                </span>
              )}
              {stockFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  In Stock
                  <button onClick={() => setStockFilter('all')} className="hover:text-blue-900">
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('all');
                  setStockFilter('all');
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Products Display */}
      {allProducts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No products available for this model yet.</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No products found matching your filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setTypeFilter('all');
              setStockFilter('all');
            }}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
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
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Phone Covers ({covers.length})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {covers.map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Screen Guards Section */}
              {screenGuards.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Screen Guards ({screenGuards.length})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {screenGuards.map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {typeFilter === 'cover' ? 'Phone Covers' : typeFilter === 'screen-guard' ? 'Screen Guards' : 'All Products'} ({filteredProducts.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const stockStatus = getStockStatus(product.stockQuantity);
  const mainImage = product.images?.[0];
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blue-500 hover:shadow-lg transition-all">
      {mainImage ? (
        <div className="w-full h-48 relative bg-gray-50">
          <Image
            src={mainImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
          <Package className="w-16 h-16 text-gray-300" />
        </div>
      )}
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>
        
        <div className="flex items-center gap-2 mb-2 text-sm flex-wrap">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            product.type === 'cover' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {product.type === 'cover' ? 'Cover' : 'Screen Guard'}
          </span>
          {product.material && (
            <span className="bg-gray-100 px-2 py-1 rounded text-gray-700 text-xs">
              {product.material}
            </span>
          )}
          {product.color && (
            <span className="bg-gray-100 px-2 py-1 rounded text-gray-700 text-xs">
              {product.color}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
          <span className={`text-sm font-medium ${stockStatus.color}`}>
            {stockStatus.label}
          </span>
        </div>
        
        <p className="text-xs text-gray-500">SKU: {product.sku}</p>
      </div>
    </div>
  );
}