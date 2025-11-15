'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Smartphone, Loader2, Shield, ChevronLeft } from 'lucide-react';
import SearchInput from '@/components/public/SearchInput';
import type { Brand, Model, Product } from '@/types';

type ProductType = 'cover' | 'screen-guard';

export default function ModelProductsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const modelId = params.modelId as string;
  const brandId = params.brandId as string;

  const [model, setModel] = useState<Model | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Active tab (cover or screen-guard)
  const [activeTab, setActiveTab] = useState<ProductType>('cover');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const limit = 12; // Products per page

  // Fetch model and brand data
  useEffect(() => {
    fetchModelAndBrand();
  }, [modelId, brandId]);

  // Fetch products when tab, page, or search changes
  useEffect(() => {
    fetchProducts();
  }, [activeTab, page, searchQuery]);

  // Reset to page 1 when tab or search changes
  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery]);

  const fetchModelAndBrand = async () => {
    try {
      // Fetch model
      const modelRes = await fetch(`/api/models/${modelId}`);
      if (!modelRes.ok) throw new Error('Model not found');
      const modelData = await modelRes.json();
      setModel(modelData.model);

      // Fetch brand
      const brandRes = await fetch(`/api/brands/${brandId}`);
      if (!brandRes.ok) throw new Error('Brand not found');
      const brandData = await brandRes.json();
      setBrand(brandData.brand);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        modelId: modelId,
        type: activeTab,
        page: page.toString(),
        limit: limit.toString(),
      });

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();
      setProducts(data.products || []);
      setTotalProducts(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: ProductType) => {
    setActiveTab(tab);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error && !model) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-blue-600">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
        <Link href={`/brands/${brandId}`} className="hover:text-blue-600">
          {brand?.name}
        </Link>
        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
        <span className="text-gray-900 font-medium truncate">
          {model?.name}
        </span>
      </div>

      {/* Model Header */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          {model?.image ? (
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 relative flex-shrink-0">
              <Image
                src={model.image}
                alt={model.name}
                fill
                sizes="(max-width: 640px) 64px, (max-width: 1024px) 80px, 96px"
                priority
                className="object-contain"
              />
            </div>
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-400" />
            </div>
          )}

          <div className="flex-1 w-full sm:w-auto">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
              {model?.name}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-2">
              {brand?.name}
            </p>
            {model?.releaseYear && (
              <p className="text-xs sm:text-sm text-gray-500">
                Released: {model.releaseYear}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs for Product Types */}
      <div className="bg-white rounded-xl shadow-md p-1 mb-6 inline-flex w-full sm:w-auto">
        <button
          onClick={() => handleTabChange('cover')}
          className={`flex-1 sm:flex-initial px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
            activeTab === 'cover'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Shield className="w-4 h-4 inline mr-2" />
          Covers
        </button>
        <button
          onClick={() => handleTabChange('screen-guard')}
          className={`flex-1 sm:flex-initial px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
            activeTab === 'screen-guard'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Shield className="w-4 h-4 inline mr-2" />
          Screen Guards
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4 sm:mb-6">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={`Search ${activeTab === 'cover' ? 'covers' : 'screen guards'}...`}
        />
        {searchQuery && (
          <p className="text-xs sm:text-sm text-gray-600 mt-2">
            Found {totalProducts} {activeTab === 'cover' ? 'cover' : 'screen guard'}
            {totalProducts !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Products Section */}
      <div>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {activeTab === 'cover' ? 'Available Covers' : 'Available Screen Guards'}
          </h2>
          {totalProducts > 0 && (
            <p className="text-sm text-gray-600">
              Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, totalProducts)} of {totalProducts}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center">
            <Shield className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-gray-600 mb-2">
              {searchQuery
                ? `No ${activeTab === 'cover' ? 'covers' : 'screen guards'} found matching "${searchQuery}"`
                : `No ${activeTab === 'cover' ? 'covers' : 'screen guards'} available for this model yet.`}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 sm:mt-4 text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden group
                             transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
                >
                  {product.images && product.images.length > 0 ? (
                    <div className="w-full h-40 sm:h-48 lg:h-56 relative bg-gray-50">
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-40 sm:h-48 lg:h-56 bg-gray-100 flex items-center justify-center">
                      <Shield className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300" />
                    </div>
                  )}

                  <div className="p-3 sm:p-4">
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center justify-between mb-2">
                      {product.material && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {product.material}
                        </span>
                      )}
                      {product.color && (
                        <span className="text-xs text-gray-500">
                          {product.color}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-lg sm:text-xl font-bold text-blue-600">
                        ₹{product.price}
                      </p>
                      {product.stockQuantity === 0 ? (
                        <span className="text-xs text-red-600 font-medium">
                          Out of Stock
                        </span>
                      ) : product.stockQuantity <= 5 ? (
                        <span className="text-xs text-orange-600 font-medium">
                          Only {product.stockQuantity} left
                        </span>
                      ) : (
                        <span className="text-xs text-green-600 font-medium">
                          In Stock
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    page === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-md hover:shadow-lg'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1 sm:gap-2">
                  {/* First page */}
                  {page > 3 && (
                    <>
                      <button
                        onClick={() => handlePageChange(1)}
                        className="w-10 h-10 rounded-lg font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
                      >
                        1
                      </button>
                      {page > 4 && (
                        <span className="text-gray-400 px-2">...</span>
                      )}
                    </>
                  )}

                  {/* Current page and neighbors */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === page || p === page - 1 || p === page + 1 || p === page - 2 || p === page + 2)
                    .filter(p => p > 0 && p <= totalPages)
                    .map(p => (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`w-10 h-10 rounded-lg font-medium transition-all ${
                          p === page
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                        }`}
                      >
                        {p}
                      </button>
                    ))}

                  {/* Last page */}
                  {page < totalPages - 2 && (
                    <>
                      {page < totalPages - 3 && (
                        <span className="text-gray-400 px-2">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className="w-10 h-10 rounded-lg font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    page === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-md hover:shadow-lg'
                  }`}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}