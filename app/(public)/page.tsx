'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Package,
  TrendingUp,
  Smartphone,
  Tag,
  Loader2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { formatPrice, getStockStatus } from '@/lib/utils';
import type { SearchResults } from '@/types';

const POPULAR_SEARCHES = [
  'iPhone 15 Pro',
  'Samsung S24',
  'OnePlus',
  'Screen Guard',
  'Leather Cover',
  'Transparent Case'
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch('/api/brands');
        const data = await response.json();
        setBrands(data.brands);
      } catch (error) {
        console.error('Failed to fetch brands:', error);
      } finally {
        setBrandsLoading(false);
      }
    };
    fetchBrands();
  }, []);

  const performSearch = async (query: string) => {
    const trimmedQuery = query.trim();
    
    if (trimmedQuery.length === 0) {
      setSearchResults(null);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`);
      const data = await response.json();
      if (response.ok) {
        setSearchResults(data);
      } else {
        setSearchResults(null);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults(null);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchQuery.trim().length === 0) {
      setSearchResults(null);
    } else if (searchQuery.trim().length <= 2) {
      performSearch(searchQuery);
    } else {
      debounceTimerRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  const handlePopularSearch = (term: string) => {
    setSearchQuery(term);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 -z-10" />
      <div className="fixed top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-blue-200 mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              Premium Mobile Accessories
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 px-4">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
              Find the Perfect
            </span>
            <br />
            <span className="text-gray-900">Mobile Accessories</span>
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto px-4">
            Browse through our comprehensive collection of mobile covers and
            screen guards organized by brand and model.
          </p>

          {/* Search */}
          <div className="max-w-3xl mx-auto px-4 mb-6">
            <div
              className={`bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border-2 transition-all duration-300 ${
                searchFocused
                  ? 'border-blue-500 shadow-2xl scale-105'
                  : 'border-transparent hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-4 p-5">
                <Search
                  className={`w-6 h-6 flex-shrink-0 transition-colors duration-300 ${
                    searchFocused ? 'text-blue-600' : 'text-gray-400'
                  }`}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  placeholder="Search by brand, model, or product..."
                  className="flex-1 text-lg outline-none bg-transparent placeholder:text-gray-400"
                />
                {searchLoading && (
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin flex-shrink-0" />
                )}
              </div>
            </div>

            {/* Popular Searches */}
            {!searchQuery && (
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => handlePopularSearch(term)}
                    className="px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 hover:bg-white hover:shadow-md hover:scale-105 transition-all duration-200 border border-gray-200"
                  >
                    {term}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Results */}
          {searchResults && searchQuery && (
            <div className="max-w-6xl mx-auto px-4 mt-8">
              <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-200">
                <div className="mb-6">
                  <p className="text-sm sm:text-base text-gray-600">
                    Found{' '}
                    <span className="font-bold text-gray-900">
                      {searchResults.totalResults}
                    </span>{' '}
                    results for{' '}
                    <span className="font-bold text-gray-900">
                      "{searchResults.query}"
                    </span>
                  </p>
                </div>

                {searchResults.totalResults === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-base text-gray-600 mb-2">
                      No results found
                    </p>
                    <p className="text-sm text-gray-500">
                      Try searching with different keywords
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Brands */}
                    {searchResults.results.brands.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Tag className="w-5 h-5 text-blue-600" />
                          <span>
                            Brands ({searchResults.results.brands.length})
                          </span>
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {searchResults.results.brands.map((brand) => (
                            <Link
                              key={brand._id}
                              href={`/brands/${brand._id}`}
                              className="group bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-300 hover:scale-105"
                            >
                              <div className="flex flex-col items-center">
                                {brand.logo ? (
                                  <div className="w-16 h-16 relative mb-3">
                                    <Image
                                      src={brand.logo}
                                      alt={brand.name}
                                      fill
                                      sizes="64px"
                                      className="object-contain"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mb-3">
                                    <Smartphone className="w-8 h-8 text-blue-600" />
                                  </div>
                                )}
                                <h4 className="text-sm font-semibold text-gray-900 text-center line-clamp-2">
                                  {brand.name}
                                </h4>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Models */}
                    {searchResults.results.models.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Smartphone className="w-5 h-5 text-indigo-600" />
                          <span>
                            Models ({searchResults.results.models.length})
                          </span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {searchResults.results.models.map((model) => (
                            <Link
                              key={model._id}
                              href={`/brands/${
                                typeof model.brandId === 'object'
                                  ? model.brandId._id
                                  : model.brandId
                              }/models/${model._id}`}
                              className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-indigo-500 hover:shadow-lg transition-all duration-300"
                            >
                              {model.image ? (
                                <div className="w-full h-40 relative bg-gradient-to-br from-gray-50 to-gray-100">
                                  <Image
                                    src={model.image}
                                    alt={model.name}
                                    fill
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-40 bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
                                  <Smartphone className="w-12 h-12 text-indigo-400" />
                                </div>
                              )}
                              <div className="p-4">
                                <p className="text-xs text-gray-500 mb-1 truncate">
                                  {typeof model.brandId === 'object' &&
                                    model.brandId.name}
                                </p>
                                <h4 className="text-base font-semibold text-gray-900 line-clamp-2">
                                  {model.name}
                                </h4>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Products - UPDATED FOR MULTIPLE MODELS */}
                    {searchResults.results.products.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Package className="w-5 h-5 text-blue-700" />
                          <span>
                            Products ({searchResults.results.products.length})
                          </span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {searchResults.results.products.map((product) => {
                            const stockStatus = getStockStatus(product.stockQuantity);
                            const mainImage = product.images?.[0];
                            
                            // Get models information
                            const productModels = product.models && Array.isArray(product.models) 
                              ? product.models.filter(m => typeof m === 'object') 
                              : [];
                            const firstModel = productModels[0];
                            const modelCount = productModels.length;

                            return (
                              <div
                                key={product._id}
                                className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
                              >
                                {mainImage ? (
                                  <div className="w-full h-48 relative bg-gradient-to-br from-gray-50 to-gray-100">
                                    <Image
                                      src={mainImage}
                                      alt={product.name}
                                      fill
                                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    {modelCount > 1 && (
                                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                        {modelCount} models
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                    <Package className="w-12 h-12 text-blue-400" />
                                  </div>
                                )}

                                <div className="p-4">
                                  <p className="text-xs text-gray-500 mb-1 truncate">
                                    {firstModel && typeof firstModel.brandId === 'object' &&
                                      `${firstModel.brandId.name} ${firstModel.name}`}
                                    {modelCount > 1 && ` +${modelCount - 1} more`}
                                  </p>
                                  <h4 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                                    {product.name}
                                  </h4>

                                  <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <span className="text-xs bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                                      {product.type === 'cover'
                                        ? 'Cover'
                                        : 'Screen Guard'}
                                    </span>
                                    {product.material && (
                                      <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                                        {product.material}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                      {formatPrice(product.price)}
                                    </span>
                                    <span
                                      className={`text-sm font-medium ${stockStatus.color}`}
                                    >
                                      {stockStatus.label}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Stats & Brand Grid (only visible when not searching) */}
        {!searchQuery && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {/* Stat Cards */}
              <div className="group bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                <div className="relative">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Wide Selection
                  </h3>
                  <p className="text-blue-100">
                    Thousands of covers and screen guards for all popular phone
                    models
                  </p>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                <div className="relative">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Latest Models
                  </h3>
                  <p className="text-indigo-100">
                    Accessories for the newest phone releases added regularly
                  </p>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-blue-600 to-indigo-600 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden sm:col-span-2 lg:col-span-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                <div className="relative">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Easy Search
                  </h3>
                  <p className="text-blue-100">
                    Powerful search to quickly find exactly what you need
                  </p>
                </div>
              </div>
            </div>

            {/* Brand Grid */}
            <div id="brands" className="scroll-mt-20">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                  Browse by Brand
                </h2>
              </div>

              {brandsLoading ? (
                <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-gray-200">
                  <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600 text-lg font-medium">Loading brands...</p>
                </div>
              ) : brands.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {brands.map((brand) => (
                    <Link
                      key={brand._id}
                      href={`/brands/${brand._id}`}
                      className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-gray-200 hover:border-blue-500 hover:shadow-xl hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center p-6"
                    >
                      {brand.logo ? (
                        <div className="w-20 h-20 relative mb-4">
                          <Image
                            src={brand.logo}
                            alt={brand.name}
                            fill
                            sizes="80px"
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mb-4">
                          <Smartphone className="w-10 h-10 text-blue-600" />
                        </div>
                      )}
                      <h3 className="text-base font-semibold text-gray-900 text-center group-hover:text-blue-700">
                        {brand.name}
                      </h3>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-medium">
                    No brands found.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}