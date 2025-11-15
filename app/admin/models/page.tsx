'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Search,
  X,
  Filter,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import Image from 'next/image';
import type { Model, Brand } from '@/types';
import ImageUpload from '@/components/admin/ImageUpload';

const MODELS_PER_PAGE = 20;

export default function AdminModelsPage() {
  const { token } = useAuth();
  // Data and loading
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandsLoading, setBrandsLoading] = useState(true); // ✅ NEW: Separate loading for brands
  const [error, setError] = useState(''); // ✅ NEW: Error handling

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);

  // Filter and Search state
  const [filterBrandId, setFilterBrandId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalModels, setTotalModels] = useState(0);

  // ✅ FIXED: Fetch ALL brands (not just 20)
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setBrandsLoading(true);
        const response = await fetch('/api/brands?limit=1000'); // ✅ FIXED
        const data = await response.json();
        if (response.ok) {
          setBrands(data.brands);
        } else {
          console.error('Failed to fetch brands:', data.error);
          setError('Failed to load brands');
        }
      } catch (error) {
        console.error('Failed to fetch brands:', error);
        setError('Failed to load brands');
      } finally {
        setBrandsLoading(false);
      }
    };
    fetchBrands();
  }, []);

  // Main data fetching function
  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(''); // ✅ NEW: Clear previous errors
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', MODELS_PER_PAGE.toString());
      params.append('sortBy', sortBy);

      if (filterBrandId) {
        params.append('brandId', filterBrandId);
      }
      if (debouncedSearchQuery) {
        params.append('search', debouncedSearchQuery);
      }

      const response = await fetch(`/api/models?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setFilteredModels(data.models);
        setTotalPages(data.totalPages);
        setTotalModels(data.total);
      } else {
        console.error('Failed to fetch models:', data.error);
        setError(data.error || 'Failed to fetch models');
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      setError('Failed to fetch models. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterBrandId, debouncedSearchQuery, sortBy]);

  // Effect to fetch models when filters or page changes
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Effect to debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to page 1 on new search
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Effect to reset page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1); // Reset to page 1 on filter change
    }
  }, [filterBrandId, sortBy]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const response = await fetch(`/api/models/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refresh the current page of models
        fetchModels();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete model');
      }
    } catch (error) {
      alert('Failed to delete model');
    }
  };

  const openCreateModal = () => {
    setEditingModel(null);
    setShowModal(true);
  };

  const openEditModal = (model: Model) => {
    setEditingModel(model);
    setShowModal(true);
  };

  const handleModalClose = (updated?: boolean) => {
    setShowModal(false);
    setEditingModel(null);
    if (updated) {
      // Refresh the current page of models
      fetchModels();
    }
  };

  const clearFilters = () => {
    setFilterBrandId('');
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSortBy('name-asc'); // Reset sort
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' }); // ✅ NEW: Smooth scroll
    }
  };

  const selectedBrandName = brands.find((b) => b._id === filterBrandId)?.name;

  // ✅ IMPROVED: Better initial loading state
  if (loading && filteredModels.length === 0 && !error) {
    return (
      <div className="card animate-fade-in">
        <div className="flex items-center justify-center h-64 flex-col gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
          <p className="text-sm text-[var(--muted)]">Loading models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-1 sm:mb-2">
            Manage Models
          </h1>
          {/* ✅ IMPROVED: Show loading skeleton or actual count */}
          {brandsLoading ? (
            <div className="h-5 w-32 bg-gray-200 animate-pulse rounded"></div>
          ) : (
            <p className="text-sm sm:text-base text-[var(--muted)]">
              {totalModels} {totalModels === 1 ? 'model' : 'models'} in total
            </p>
          )}
        </div>
        <button
          onClick={openCreateModal}
          className="btn-gradient flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Add Model</span>
        </button>
      </div>

      {/* ✅ NEW: Error Alert */}
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

      {/* Filter and Search */}
      <div className="card p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Brand Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-[var(--muted)] mb-1.5 sm:mb-2">
              <Filter className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
              Filter by Brand
            </label>
            <select
              value={filterBrandId}
              onChange={(e) => setFilterBrandId(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-[var(--border)] rounded-lg
                         focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-colors bg-white"
              disabled={brandsLoading}
            >
              {/* ✅ IMPROVED: Show loading state and count */}
              <option value="">
                {brandsLoading ? 'Loading brands...' : `All Brands (${brands.length})`}
              </option>
              {brands.map((brand) => (
                <option key={brand._id} value={brand._id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-[var(--muted)] mb-1.5 sm:mb-2">
              <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-[var(--border)] rounded-lg
                         focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-colors bg-white"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="date-newest">Date Created (Newest)</option>
              <option value="date-oldest">Date Created (Oldest)</option>
              <option value="year-newest">Release Year (Newest)</option>
              <option value="year-oldest">Release Year (Oldest)</option>
            </select>
          </div>

          {/* Search Bar */}
          <div className="md:col-span-1">
            <label className="block text-xs sm:text-sm font-medium text-[var(--muted)] mb-1.5 sm:mb-2">
              <Search className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
              Search {selectedBrandName ? `in ${selectedBrandName}` : 'All Models'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or specs..."
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-[var(--border)] rounded-lg
                           focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(filterBrandId || debouncedSearchQuery || sortBy !== 'name-asc') && (
          <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[var(--border)]">
            <span className="text-xs sm:text-sm font-medium text-[var(--muted)]">
              Active filters:
            </span>
            {filterBrandId && (
              <span className="badge badge-blue">
                Brand: {selectedBrandName}
                <button
                  onClick={() => setFilterBrandId('')}
                  className="hover:text-blue-900 ml-1"
                  aria-label="Remove brand filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {debouncedSearchQuery && (
              <span className="badge badge-blue">
                Search: "
                {debouncedSearchQuery.length > 20
                  ? debouncedSearchQuery.substring(0, 20) + '...'
                  : debouncedSearchQuery}
                "
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setDebouncedSearchQuery('');
                  }}
                  className="hover:text-blue-900 ml-1"
                  aria-label="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {sortBy !== 'name-asc' && (
              <span className="badge badge-indigo">
                Sort: {(() => {
                  const sortOptions: Record<string, string> = {
                    'name-asc': 'Name (A-Z)',
                    'name-desc': 'Name (Z-A)',
                    'date-newest': 'Date Created (Newest)',
                    'date-oldest': 'Date Created (Oldest)',
                    'year-newest': 'Release Year (Newest)',
                    'year-oldest': 'Release Year (Oldest)',
                  };
                  return sortOptions[sortBy] || sortBy;
                })()}
                <button
                  onClick={() => setSortBy('name-asc')}
                  className="hover:text-indigo-900 ml-1"
                  aria-label="Reset sort"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-xs sm:text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium ml-2"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Results Count */}
        <p className="text-xs sm:text-sm text-[var(--muted)] mt-2">
          Showing {filteredModels.length} of {totalModels}{' '}
          {totalModels === 1 ? 'model' : 'models'}
        </p>
      </div>

      {/* Loading Spinner (only when filtering/searching) */}
      {loading && filteredModels.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
        </div>
      ) : /* Empty State */
      totalModels === 0 ? (
        <div className="card text-center py-8 sm:py-12">
          <Smartphone className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-[var(--muted)] mb-4">
            {debouncedSearchQuery || filterBrandId
              ? 'No models found matching your filters'
              : 'No models yet. Create your first model!'}
          </p>
          <button
            onClick={
              debouncedSearchQuery || filterBrandId
                ? clearFilters
                : openCreateModal
            }
            className="btn-gradient inline-flex items-center gap-2"
          >
            {debouncedSearchQuery || filterBrandId ? (
              <>
                <X className="w-4 h-4" />
                <span>Clear Filters</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add Model</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <>
          {/* Models Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-6">
            {filteredModels.map((model) => (
              <ModelCard
                key={model._id}
                model={model}
                onEdit={() => openEditModal(model)}
                onDelete={() => handleDelete(model._id, model.name)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="card p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-[var(--muted)]">
                  Showing {(currentPage - 1) * MODELS_PER_PAGE + 1} to{' '}
                  {Math.min(currentPage * MODELS_PER_PAGE, totalModels)} of {totalModels}{' '}
                  results
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
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
                          onClick={() => handlePageChange(pageNum)}
                          disabled={loading}
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
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
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

      {showModal && (
        <ModelModal
          model={editingModel}
          onClose={handleModalClose}
          token={token!}
          allBrands={brands} // ✅ NEW: Pass all brands to modal
        />
      )}
    </div>
  );
}

// Model Card Component
function ModelCard({
  model,
  onEdit,
  onDelete,
}: {
  model: Model;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const brandName =
    typeof model.brandId === 'object' && model.brandId ? model.brandId.name : 'Unknown';

  return (
    <div className="glass rounded-2xl shadow-lg overflow-hidden flex flex-col hover:shadow-2xl hover:scale-[1.02] transition-all">
      {/* Image */}
      <div className="relative h-48 bg-gray-500/5">
        {model.image ? (
          <Image
            src={model.image}
            alt={model.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Smartphone className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-3">
          <h3 className="font-bold text-[var(--foreground)] mb-1">{model.name}</h3>
          <p className="text-sm text-[var(--muted)]">{brandName}</p>
        </div>

        {model.releaseYear && (
          <p className="text-xs text-[var(--muted)] mb-3">
            Released: {model.releaseYear}
          </p>
        )}

        {model.specifications && (
          <p className="text-xs text-[var(--muted)] line-clamp-2 mb-3">
            {model.specifications}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2
                       bg-blue-500/10 text-[var(--accent)] rounded-lg
                       hover:bg-blue-500/20 font-medium transition-colors"
            aria-label={`Edit ${model.name}`}
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2
                       bg-red-500/10 text-red-600 rounded-lg
                       hover:bg-red-500/20 font-medium transition-colors"
            aria-label={`Delete ${model.name}`}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Model Modal Component
function ModelModal({
  model,
  onClose,
  token,
  allBrands, // ✅ NEW: Receive all brands
}: {
  model: Model | null;
  onClose: (updated?: boolean) => void;
  token: string;
  allBrands: Brand[]; // ✅ NEW: All brands prop
}) {
  const [formData, setFormData] = useState({
    name: model?.name || '',
    brandId: typeof model?.brandId === 'object' ? model.brandId._id : model?.brandId || '',
    image: model?.image || '',
    releaseYear: model?.releaseYear || new Date().getFullYear(),
    specifications: model?.specifications || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const url = model ? `/api/models/${model._id}` : '/api/models';
      const method = model ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onClose(true);
      } else {
        setError(data.error || 'Failed to save model');
      }
    } catch (err) {
      setError('Failed to save model');
    } finally {
      setSaving(false);
    }
  };

  const inputStyles = `w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-[var(--border)] rounded-lg
                       focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-colors bg-white`;
  const labelStyles = `block text-sm font-medium text-[var(--muted)] mb-1.5`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-3 sm:p-4 animate-fade-in">
      <div className="card max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl sm:text-2xl font-bold gradient-text mb-3 sm:mb-4">
          {model ? 'Edit Model' : 'Add Model'}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-3 sm:mb-4 text-sm sm:text-base">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className={labelStyles}>Model Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className={inputStyles}
              placeholder="e.g., iPhone 15 Pro"
            />
          </div>

          <div>
            <label className={labelStyles}>
              Brand * {allBrands.length > 0 && `(${allBrands.length} available)`}
            </label>
            <select
              value={formData.brandId}
              onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
              required
              className={inputStyles}
            >
              <option value="">Select a brand</option>
              {allBrands.map((brand) => (
                <option key={brand._id} value={brand._id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelStyles}>Release Year</label>
            <input
              type="number"
              value={formData.releaseYear}
              onChange={(e) =>
                setFormData({ ...formData, releaseYear: parseInt(e.target.value) || 0 })
              }
              min="1900"
              max={new Date().getFullYear() + 1}
              className={inputStyles}
            />
          </div>

          <ImageUpload
            value={formData.image}
            onChange={(url) => setFormData({ ...formData, image: url })}
            folder="models"
            label="Model Image"
            token={token}
          />

          <div>
            <label className={labelStyles}>Specifications</label>
            <textarea
              value={formData.specifications}
              onChange={(e) =>
                setFormData({ ...formData, specifications: e.target.value })
              }
              rows={3}
              className={`${inputStyles} resize-none`}
              placeholder="e.g., 6.1-inch display, A17 Pro chip..."
            />
          </div>

          <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
            <button
              type="button"
              onClick={() => onClose()}
              className="flex-1 px-4 py-2 text-sm sm:text-base border border-[var(--border)] text-[var(--muted)] rounded-xl
                         hover:bg-gray-500/10 hover:text-[var(--foreground)] font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-gradient flex-1 py-2 text-sm sm:text-base flex items-center justify-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : model ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}