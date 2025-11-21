'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Smartphone, Loader2 } from 'lucide-react';
import SearchInput from '@/components/public/SearchInput';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import type { Brand, Model } from '@/types';

export default function BrandModelsPage() {
  const params = useParams();
  const brandId = params.brandId as string;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [totalModels, setTotalModels] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Infinite scroll hook
  const { observerTarget, page, hasMore, setHasMore, resetPagination } = 
    useInfiniteScroll(loading || loadingMore);

  // Fetch brand data (only once)
  useEffect(() => {
    fetchBrand();
  }, [brandId]);

  // Fetch models when page or search changes
  useEffect(() => {
    fetchModels(page, searchQuery);
  }, [page, searchQuery]);

  // Reset pagination when search query changes
  useEffect(() => {
    if (page !== 1) {
      setModels([]);
      resetPagination();
    }
  }, [searchQuery]);

  const fetchBrand = async () => {
    try {
      const brandRes = await fetch(`/api/brands/${brandId}`);
      if (!brandRes.ok) throw new Error('Brand not found');
      
      const brandData = await brandRes.json();
      setBrand(brandData.brand);
      setTotalModels(brandData.modelsCount || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load brand');
    }
  };

  const fetchModels = async (pageNum: number, search: string) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError('');

      const params = new URLSearchParams({
        brandId: brandId,
        page: pageNum.toString(),
        limit: '20',
      });

      if (search.trim()) {
        params.append('search', search.trim());
      }

      const response = await fetch(`/api/models?${params}`);
      if (!response.ok) throw new Error('Failed to fetch models');

      const data = await response.json();

      // Replace or append models based on page number
      setModels((prev) => pageNum === 1 ? data.models : [...prev, ...data.models]);
      setTotalModels(data.total);
      setTotalPages(data.totalPages);
      setHasMore(pageNum < data.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to load models');
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  if (loading && models.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error && !brand) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm sm:text-base">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 overflow-x-auto">
        <Link href="/" className="hover:text-blue-600 whitespace-nowrap">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
        <span className="text-gray-900 font-medium truncate">
          {brand?.name}
        </span>
      </div>

      {/* Brand Header */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          {brand?.logo ? (
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 relative flex-shrink-0">
              <Image
                src={brand.logo}
                alt={brand.name}
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
              {brand?.name}
            </h1>
            {brand?.description && (
              <p className="text-sm sm:text-base text-gray-600 mb-2">
                {brand.description}
              </p>
            )}
            <p className="text-xs sm:text-sm text-gray-500">
              {totalModels} {totalModels === 1 ? 'model' : 'models'} available
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4 sm:mb-6">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search models by name, specs, or year..."
        />
        {searchQuery && (
          <p className="text-xs sm:text-sm text-gray-600 mt-2">
            Showing {models.length} of {totalModels} {totalModels === 1 ? 'model' : 'models'}
          </p>
        )}
      </div>

      {/* Models Section */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4 sm:mb-6">
          {searchQuery ? 'Search Results' : 'Select Model'}
        </h2>

        {models.length === 0 && !loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center">
            <Smartphone className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-gray-600 mb-2">
              {searchQuery
                ? `No models found matching "${searchQuery}"`
                : 'No models available for this brand yet.'}
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
            {/* Models Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {models.map((model) => (
                <Link
                  key={model._id}
                  href={`/brands/${brandId}/models/${model._id}`}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden group block
                             transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
                >
                  {model.image ? (
                    <div className="w-full h-32 sm:h-40 lg:h-48 relative bg-gray-50">
                      <Image
                        src={model.image}
                        alt={model.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="object-contain p-3"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 sm:h-40 lg:h-48 bg-gray-100 flex items-center justify-center">
                      <Smartphone className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-gray-300" />
                    </div>
                  )}

                  <div className="p-3 sm:p-4">
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1 line-clamp-2">
                      {model.name}
                    </h3>
                    {model.releaseYear && (
                      <p className="text-xs sm:text-sm text-gray-600">
                        Released: {model.releaseYear}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Infinite Scroll Sentinel */}
            <div ref={observerTarget} className="py-8 flex justify-center">
              {loadingMore && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading more models...</span>
                </div>
              )}
              {!hasMore && models.length > 0 && (
                <p className="text-sm text-gray-500">
                  {searchQuery ? (
                    <>All {models.length} matching models loaded</>
                  ) : (
                    <>You've reached the end • {models.length} of {totalModels} models</>
                  )}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}