'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, Package, Smartphone, Tag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, getStockStatus } from '@/lib/utils';
import type { SearchResults } from '@/types';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (response.ok) {
        setResults(data);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (query) {
        handleSearch(query);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Search Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Search Products
          </h1>
          <p className="text-xl text-gray-600">
            Find covers and screen guards for your phone
          </p>
        </div>

        {/* Search Input */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-4">
            <Search className="w-6 h-6 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by brand, model, or product..."
              className="flex-1 text-lg outline-none"
              autoFocus
            />
            {loading && <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Search Results */}
        {results && (
          <div>
            {/* Results Summary */}
            <div className="mb-6">
              <p className="text-gray-600">
                Found <span className="font-bold text-gray-900">{results.totalResults}</span> results
                for "<span className="font-bold text-gray-900">{results.query}</span>"
              </p>
            </div>

            {/* No Results */}
            {results.totalResults === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No results found</p>
                <p className="text-sm text-gray-500">Try searching with different keywords</p>
              </div>
            )}

            {/* Brands Results */}
            {results.results.brands.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Tag className="w-6 h-6" />
                  Brands ({results.results.brands.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {results.results.brands.map((brand) => (
                    <Link
                      key={brand._id}
                      href={`/brands/${brand._id}`}
                      className="bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all"
                    >
                      <div className="flex flex-col items-center">
                        {brand.logo ? (
                          <div className="w-16 h-16 relative mb-3">
                            <Image
                              src={brand.logo}
                              alt={brand.name}
                              fill
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                            <Smartphone className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <h3 className="font-semibold text-gray-900 text-center">
                          {brand.name}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Models Results */}
            {results.results.models.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Smartphone className="w-6 h-6" />
                  Models ({results.results.models.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.results.models.map((model) => (
                    <Link
                      key={model._id}
                      href={`/brands/${typeof model.brandId === 'object' ? model.brandId._id : model.brandId}/models/${model._id}`}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blue-500 hover:shadow-lg transition-all"
                    >
                      {model.image ? (
                        <div className="w-full h-40 relative bg-gray-50">
                          <Image
                            src={model.image}
                            alt={model.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                          <Smartphone className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                      <div className="p-4">
                        <p className="text-sm text-gray-600 mb-1">
                          {typeof model.brandId === 'object' && model.brandId.name}
                        </p>
                        <h3 className="font-semibold text-gray-900">
                          {model.name}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Products Results */}
            {results.results.products.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-6 h-6" />
                  Products ({results.results.products.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.results.products.map((product) => {
                    const stockStatus = getStockStatus(product.stockQuantity);
                    const mainImage = product.images?.[0];

                    return (
                      <div
                        key={product._id}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        {mainImage ? (
                          <div className="w-full h-48 relative bg-gray-50">
                            <Image
                              src={mainImage}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                            <Package className="w-12 h-12 text-gray-300" />
                          </div>
                        )}

                        <div className="p-4">
                          <p className="text-xs text-gray-500 mb-1">
                            {typeof product.modelId === 'object' &&
                              typeof product.modelId.brandId === 'object' &&
                              `${product.modelId.brandId.name} ${product.modelId.name}`}
                          </p>
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                            {product.name}
                          </h3>

                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {product.type === 'cover' ? 'Cover' : 'Screen Guard'}
                            </span>
                            {product.material && (
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {product.material}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-gray-900">
                              {formatPrice(product.price)}
                            </span>
                            <span className={`text-sm font-medium ${stockStatus.color}`}>
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

        {/* Initial State */}
        {!query && !results && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Start typing to search...</p>
          </div>
        )}
      </div>
    </div>
  );
}