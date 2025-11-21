'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Plus,
  Loader2,
  Package,
  Search,
  X,
  Filter as FilterIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Product, Model, Brand } from '@/types';
import ProductModal from '@/components/admin/ProductModal';
import ProductCard from '@/components/admin/ProductCard';

// Configuration
const ITEMS_PER_PAGE = 12;
const SEARCH_DEBOUNCE_MS = 300;

// Sort options
type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'date-newest'
  | 'date-oldest'
  | 'price-low'
  | 'price-high'
  | 'popular';

export default function AdminProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>('date-newest');
  const [filters, setFilters] = useState({
    brandId: '',
    modelId: '',
    type: '',
    inStock: '',
  });
  const [filterDataLoading, setFilterDataLoading] = useState(true);
  const [error, setError] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch initial data (brands and models for filters)
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        setFilterDataLoading(true);
        const [brandsRes, modelsRes] = await Promise.all([
          fetch('/api/brands?limit=1000'),
          fetch('/api/models?limit=10000'),
        ]);
        const brandsData = await brandsRes.json();
        const modelsData = await modelsRes.json();
        if (brandsRes.ok) setBrands(brandsData.brands);
        if (modelsRes.ok) setModels(modelsData.models);
      } catch (error) {
        console.error('Failed to fetch filter data:', error);
        setError('Failed to load filters. Please refresh the page.');
      } finally {
        setFilterDataLoading(false);
      }
    };
    fetchFilterData();
  }, []);

  // Main function to fetch products from the server
  const fetchProducts = useCallback(async () => {
    try {
      setSearching(true);
      setError('');

      // Build query parameters
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
      if (filters.brandId) params.append('brandId', filters.brandId);
      if (filters.modelId) params.append('modelId', filters.modelId);
      if (filters.type) params.append('type', filters.type);
      if (filters.inStock) params.append('inStock', filters.inStock);
      params.append('page', currentPage.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());
      params.append('sortBy', sortBy);

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setProducts(data.products);
        setTotalCount(data.total || data.products.length);
      } else {
        setError(data.error || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setError('Failed to fetch products. Please try again.');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [debouncedSearchQuery, filters, sortBy, currentPage]);

  // Fetch products when filters, search, or page changes
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset to page 1 when filters or search changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchQuery, filters, sortBy]);

  // CRUD operations
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchProducts();
        const newTotalPages = Math.ceil((totalCount - 1) / ITEMS_PER_PAGE);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        }
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete product');
      }
    } catch (error) {
      alert('Failed to delete product');
    }
  };

  const handleModalClose = async (updated?: boolean) => {
    setShowModal(false);
    setEditingProduct(null);
    if (updated) {
      await fetchProducts();
    }
  };

  const clearFilters = () => {
    setFilters({ brandId: '', modelId: '', type: '', inStock: '' });
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSortBy('date-newest');
  };

  // Get models for the filter dropdown, filtered by the selected brand
  const getFilteredModels = () => {
    if (!filters.brandId) return models;
    return models.filter((model) => {
      const brandId =
        typeof model.brandId === 'object' ? model.brandId._id : model.brandId;
      return brandId === filters.brandId;
    });
  };

  // Loading state
  if ((loading && products.length === 0) || filterDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
        <p className="text-sm text-[var(--muted)]">
          {filterDataLoading ? 'Loading filters...' : 'Loading products...'}
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const hasActiveFilters =
    filters.brandId ||
    filters.modelId ||
    filters.type ||
    filters.inStock ||
    searchQuery;

  return (
    <div className="card animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-1 sm:mb-2">
            Manage Products
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted)]">
            {totalCount} product{totalCount !== 1 ? 's' : ''}
            {hasActiveFilters && ' (filtered)'}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowModal(true);
          }}
          className="btn-gradient flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            className="text-red-700 hover:text-red-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Search and Sort Bar */}
      <div className="card p-3 sm:p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[var(--muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, SKU, material, color..."
              className="w-full pl-10 sm:pl-12 pr-10 py-2 sm:py-3 text-sm sm:text-base bg-white border border-[var(--border)] rounded-xl
                         focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-colors"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-[var(--accent)]" />
            )}
            {!searching && searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
                aria-label="Clear search"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-[var(--border)] rounded-xl
                       focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-colors bg-white"
          >
            <option value="date-newest">Newest First</option>
            <option value="date-oldest">Oldest First</option>
            <option value="popular">Most Popular</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="price-low">Price (Low to High)</option>
            <option value="price-high">Price (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-3 sm:p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <FilterIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--muted)]" />
          <h3 className="font-semibold text-[var(--foreground)]">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Brand Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-[var(--muted)] mb-1.5">
              Brand {brands.length > 0 && `(${brands.length})`}
            </label>
            <select
              value={filters.brandId}
              onChange={(e) =>
                setFilters({ ...filters, brandId: e.target.value, modelId: '' })
              }
              className="w-full px-3 py-2 text-sm sm:text-base border border-[var(--border)] rounded-lg
                         focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-white"
            >
              <option value="">All Brands</option>
              {brands.map((brand) => (
                <option key={brand._id} value={brand._id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          {/* Model Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-[var(--muted)] mb-1.5">
              Model {getFilteredModels().length > 0 && `(${getFilteredModels().length})`}
            </label>
            <select
              value={filters.modelId}
              onChange={(e) => setFilters({ ...filters, modelId: e.target.value })}
              className="w-full px-3 py-2 text-sm sm:text-base border border-[var(--border)] rounded-lg
                         focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-white"
              disabled={
                filters.brandId !== '' && getFilteredModels().length === 0
              }
            >
              <option value="">All Models</option>
              {getFilteredModels().map((model) => (
                <option key={model._id} value={model._id}>
                  {typeof model.brandId === 'object'
                    ? `${model.brandId.name} - `
                    : ''}
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-[var(--muted)] mb-1.5">
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 text-sm sm:text-base border border-[var(--border)] rounded-lg
                         focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-white"
            >
              <option value="">All Types</option>
              <option value="cover">Cover</option>
              <option value="screen-guard">Screen Guard</option>
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-[var(--muted)] mb-1.5">
              Stock
            </label>
            <select
              value={filters.inStock}
              onChange={(e) =>
                setFilters({ ...filters, inStock: e.target.value })
              }
              className="w-full px-3 py-2 text-sm sm:text-base border border-[var(--border)] rounded-lg
                         focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-white"
            >
              <option value="">All Products</option>
              <option value="true">In Stock Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
            No products found
          </h3>
          <p className="text-[var(--muted)] mb-4">
            {hasActiveFilters
              ? 'Try adjusting your filters or search query'
              : 'Get started by adding your first product'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-6">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onEdit={() => {
                  setEditingProduct(product);
                  setShowModal(true);
                }}
                onDelete={() => handleDelete(product._id, product.name)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="card p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-[var(--muted)]">
                  Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalCount)} to{' '}
                  {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount}{' '}
                  results
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentPage((prev) => Math.max(1, prev - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="p-2 border border-[var(--border)] rounded-lg
                               hover:bg-gray-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Page numbers - show up to 5 pages */}
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setCurrentPage(pageNum);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`px-3 py-1 rounded-lg transition-colors text-sm ${
                            currentPage === pageNum
                              ? 'bg-[var(--accent)] text-white'
                              : 'border border-[var(--border)] hover:bg-gray-500/10'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <span className="sm:hidden text-sm text-[var(--muted)]">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => {
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-[var(--border)] rounded-lg
                               hover:bg-gray-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <ProductModal
          product={editingProduct}
          onClose={handleModalClose}
          token={token}
          allModels={models}
        />
      )}
    </div>
  );
}