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
  ArrowUpDown, // Added for sorting icon
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

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);

  // Filter and Search state
  const [filterBrandId, setFilterBrandId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc'); // <-- New state for sorting

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalModels, setTotalModels] = useState(0);

  // Fetch Brands (only runs once)
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch('/api/brands');
        const data = await response.json();
        if (response.ok) {
          setBrands(data.brands);
        }
      } catch (error) {
        console.error('Failed to fetch brands:', error);
      }
    };
    fetchBrands();
  }, []);

  // Main data fetching function
  const fetchModels = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', MODELS_PER_PAGE.toString());
      params.append('sortBy', sortBy); // <-- Added sort parameter

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
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterBrandId, debouncedSearchQuery, sortBy]); // <-- Added sortBy dependency

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
  }, [filterBrandId, sortBy]); // <-- Added sortBy dependency

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this model?')) return;

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
    }
  };

  const selectedBrandName = brands.find((b) => b._id === filterBrandId)?.name;

  return (
    <div className="card animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-1 sm:mb-2">
            Manage Models
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted)]">
            {totalModels} {totalModels === 1 ? 'model' : 'models'} in total
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-gradient flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Add Model</span>
        </button>
      </div>

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
            >
              <option value="">All Brands ({brands.length})</option>
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
                placeholder="Search by name, specs, or year..."
                className="w-full pl-3 sm:pl-4 pr-10 py-2 text-sm sm:text-base border border-[var(--border)] rounded-lg
                           focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-colors bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
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
                Sort: {document.querySelector(`option[value="${sortBy}"]`)?.textContent}
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

      {/* Loading Spinner */}
      {loading ? (
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
              <span>Clear Filters</span>
            ) : (
              <>
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Add Model</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <>
          {/* Models Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {filteredModels.map((model) => (
              <div
                key={model._id}
                className="glass rounded-2xl shadow-lg flex flex-col
                           hover:shadow-2xl hover:scale-[1.02] transition-all"
              >
                {/* Image area */}
                <div className="flex justify-center items-center h-32 sm:h-36 p-3">
                  <div className="relative w-20 h-28">
                    {model.image ? (
                      <Image
                        src={model.image}
                        alt={model.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 200px"
                        className="object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-500/10 rounded-md flex items-center justify-center">
                        <Smartphone className="w-8 h-8 text-[var(--muted)]" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Text */}
                <div className="px-3 text-center h-20">
                  <p className="text-xs text-[var(--muted)] truncate">
                    {typeof model.brandId === 'object'
                      ? model.brandId.name
                      : 'Unknown'}
                  </p>
                  <p className="text-sm font-semibold text-[var(--foreground)] leading-tight line-clamp-2">
                    {model.name}
                  </p>
                  {model.releaseYear && (
                    <p className="text-xs text-[var(--muted)] mt-1">
                      Released: {model.releaseYear}
                    </p>
                  )}
                </div>

                {/* Fixed footer for buttons */}
                <div className="flex justify-center gap-3 py-2 border-t border-white/20 mt-auto">
                  <button
                    onClick={() => openEditModal(model)}
                    className="p-1.5 text-[var(--accent)] hover:bg-blue-500/10 rounded-md transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(model._id)}
                    className="p-1.5 text-red-600 hover:bg-red-500/10 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 sm:mt-8 pt-4 border-t border-[var(--border)]">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[var(--muted)]
                           rounded-lg hover:bg-gray-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <span className="text-sm text-[var(--muted)]">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[var(--muted)]
                           rounded-lg hover:bg-gray-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <ModelModal
          model={editingModel}
          brands={brands}
          onClose={handleModalClose}
          token={token!}
        />
      )}
    </div>
  );
}

// ... (ModelModal component remains unchanged)
function ModelModal({
  model,
  brands,
  onClose,
  token,
}: {
  model: Model | null;
  brands: Brand[];
  onClose: (updated?: boolean) => void;
  token: string;
}) {
  const [formData, setFormData] = useState({
    name: model?.name || '',
    brandId:
      typeof model?.brandId === 'object'
        ? model.brandId._id
        : model?.brandId || '',
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-3 sm:p-4 animate-fade-in">
      <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto">
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
            <label className="block text-sm font-medium text-[var(--muted)] mb-1 sm:mb-1.5">
              Brand *
            </label>
            <select
              value={formData.brandId}
              onChange={(e) =>
                setFormData({ ...formData, brandId: e.target.value })
              }
              required
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-[var(--border)] rounded-lg
                         focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-colors bg-white"
            >
              <option value="">Select Brand</option>
              {brands.map((brand) => (
                <option key={brand._id} value={brand._id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1 sm:mb-1.5">
              Model Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-[var(--border)] rounded-lg
                         focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-colors bg-white"
              placeholder="e.g., iPhone 15 Pro"
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
            <label className="block text-sm font-medium text-[var(--muted)] mb-1 sm:mb-1.5">
              Release Year
            </label>
            <input
              type="number"
              value={formData.releaseYear}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  releaseYear: parseInt(e.target.value),
                })
              }
              min="2000"
              max={new Date().getFullYear() + 1}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-[var(--border)] rounded-lg
                         focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-colors bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1 sm:mb-1.5">
              Specifications
            </label>
            <textarea
              value={formData.specifications}
              onChange={(e) =>
                setFormData({ ...formData, specifications: e.target.value })
              }
              rows={3}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-[var(--border)] rounded-lg
                         focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-none bg-white"
              placeholder="Brief specifications..."
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
              className="btn-gradient flex-1 py-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : model ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}