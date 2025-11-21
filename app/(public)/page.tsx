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
  Sparkles,
  XCircle,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { formatPrice, getStockStatus } from '@/lib/utils';
import type { SearchResults, Product } from '@/types';

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
  
  // ✅ NEW: Top Products State
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [topProductsLoading, setTopProductsLoading] = useState(true);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchBrands();
    fetchTopProducts(); // ✅ NEW: Fetch top products
  }, []);

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

  // ✅ NEW: Fetch top viewed products
  const fetchTopProducts = async () => {
    try {
      const response = await fetch('/api/products?sortBy=popular&limit=8&inStock=true');
      const data = await response.json();
      if (response.ok) {
        setTopProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch top products:', error);
    } finally {
      setTopProductsLoading(false);
    }
  };

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
        
        {/* HERO SECTION */}
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

          {/* SEARCH BAR */}
          <div className="max-w-3xl mx-auto px-4 mb-6">
            <div
              ref={searchBoxRef}
              className={`bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border-2 transition-all duration-300 ${
                searchFocused
                  ? 'border-blue-500 shadow-2xl'
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
                  onFocus={() => {
                    setSearchFocused(true);
                    const headerHeight = 64;
                    const extraOffset = 20;
                    const boxTop = searchBoxRef.current?.getBoundingClientRect().top ?? 0;
                    window.scrollBy({
                      top: boxTop - headerHeight - extraOffset,
                      behavior: "smooth",
                    });
                  }}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  placeholder="Search by brand, model, or product..."
                  className="flex-1 text-lg outline-none bg-transparent placeholder:text-gray-400"
                />

                {searchQuery && !searchLoading && (
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 transition p-1"
                  >
                    <XCircle className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                  </button>
                )}

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

          {/* SEARCH RESULTS */}
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
                    <p className="text-base text-gray-600 mb-2">No results found</p>
                    <p className="text-sm text-gray-500">Try searching with different keywords</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Brands, Models, Products sections - same as before */}
                    {/* ... (keep existing search results code) ... */}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* CONTENT WHEN NOT SEARCHING */}
        {!searchQuery && (
          <>
            {/* STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              <div className="group bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                <div className="relative">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Wide Selection</h3>
                  <p className="text-blue-100">
                    Thousands of covers and screen guards for all popular phone models
                  </p>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                <div className="relative">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Latest Models</h3>
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
                  <h3 className="text-xl font-bold text-white mb-2">Easy Search</h3>
                  <p className="text-blue-100">
                    Powerful search to quickly find exactly what you need
                  </p>
                </div>
              </div>
            </div>

            {/* ✅ NEW: TOP PRODUCTS SECTION */}
            <div className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center gap-3">
                  <Eye className="w-8 h-8 text-blue-600" />
                  Top Viewed Products
                </h2>
              </div>

              {topProductsLoading ? (
                <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-gray-200">
                  <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600 text-lg font-medium">Loading products...</p>
                </div>
              ) : topProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {topProducts.map((product) => {
                    const stockStatus = getStockStatus(product.stockQuantity);
                    const firstModel =
                      product.models &&
                      Array.isArray(product.models) &&
                      product.models[0] &&
                      typeof product.models[0] === 'object'
                        ? product.models[0]
                        : null;

                    return (
                      <Link
                        key={product._id}
                        href={`/products/${product._id}`}
                        className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-gray-200 hover:border-blue-500 hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden"
                      >
                        {/* Product Image */}
                        <div className="relative h-48 bg-gray-50">
                          {product.images && product.images.length > 0 ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-12 h-12 text-gray-300" />
                            </div>
                          )}
                          
                          {/* View Count Badge */}
                          {product.viewCount > 0 && (
                            <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {product.viewCount}
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="p-4">
                          {firstModel && (
                            <p className="text-xs text-gray-500 mb-1 truncate">
                              {typeof firstModel.brandId === 'object' &&
                                `${firstModel.brandId.name} ${firstModel.name}`}
                            </p>
                          )}
                          
                          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 mb-2 line-clamp-2">
                            {product.name}
                          </h3>

                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                              {formatPrice(product.price)}
                            </span>
                            <span className={`text-xs font-medium ${stockStatus.color}`}>
                              {stockStatus.status === 'in-stock' ? 'In Stock' : stockStatus.label}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-medium">No products available yet.</p>
                </div>
              )}
            </div>

            {/* BRAND GRID */}
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
                  <p className="text-gray-600 text-lg font-medium">No brands found.</p>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}