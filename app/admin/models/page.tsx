'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Plus, Edit2, Trash2, Loader2, Search, X, Filter } from 'lucide-react';
import Image from 'next/image';
import type { Model, Brand } from '@/types';
import ImageUpload from '@/components/admin/ImageUpload';

export default function AdminModelsPage() {
  const { token } = useAuth();
  const [allModels, setAllModels] = useState<Model[]>([]);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [filterBrandId, setFilterBrandId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBrands();
    fetchModels();
  }, []);

  useEffect(() => {
    // Apply both brand filter and search query
    let filtered = [...allModels];

    // First, filter by brand if selected
    if (filterBrandId) {
      filtered = filtered.filter((model) => {
        const brandId = typeof model.brandId === 'object' ? model.brandId._id : model.brandId;
        return brandId === filterBrandId;
      });
    }

    // Then, apply search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((model) => {
        const brandName = typeof model.brandId === 'object' ? model.brandId.name : '';
        return (
          model.name.toLowerCase().includes(query) ||
          brandName.toLowerCase().includes(query) ||
          model.specifications?.toLowerCase().includes(query) ||
          model.releaseYear?.toString().includes(query)
        );
      });
    }

    setFilteredModels(filtered);
  }, [searchQuery, filterBrandId, allModels]);

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

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/models');
      const data = await response.json();
      if (response.ok) {
        setAllModels(data.models);
        setFilteredModels(data.models);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this model?')) return;

    try {
      const response = await fetch(`/api/models/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setAllModels(allModels.filter(m => m._id !== id));
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
      fetchModels();
    }
  };

  const clearFilters = () => {
    setFilterBrandId('');
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const selectedBrandName = brands.find(b => b._id === filterBrandId)?.name;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Models</h1>
          <p className="text-sm sm:text-base text-gray-600">
            {allModels.length} {allModels.length === 1 ? 'model' : 'models'} in total
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Add Model</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Brand Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              <Filter className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
              Filter by Brand
            </label>
            <select
              value={filterBrandId}
              onChange={(e) => setFilterBrandId(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Brands</option>
              {brands.map((brand) => (
                <option key={brand._id} value={brand._id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Bar */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              <Search className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
              Search {selectedBrandName ? `in ${selectedBrandName}` : 'All Models'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, specs, or year..."
                className="w-full pl-3 sm:pl-4 pr-10 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(filterBrandId || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
            <span className="text-xs sm:text-sm font-medium text-gray-700">Active filters:</span>
            {filterBrandId && (
              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm">
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
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm">
                Search: "{searchQuery.length > 20 ? searchQuery.substring(0, 20) + '...' : searchQuery}"
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="hover:text-blue-900 ml-1"
                  aria-label="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium ml-2"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Results Count */}
        {(filterBrandId || searchQuery) && (
          <p className="text-xs sm:text-sm text-gray-600 mt-2">
            Showing {filteredModels.length} of {allModels.length} {filteredModels.length === 1 ? 'model' : 'models'}
          </p>
        )}
      </div>

      {/* Empty State */}
      {allModels.length === 0 ? (
        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-8 sm:p-12 text-center">
          <p className="text-sm sm:text-base text-gray-600 mb-4">No models yet. Create your first model!</p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Add Model</span>
          </button>
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-8 sm:p-12 text-center">
          <p className="text-sm sm:text-base text-gray-600 mb-2">
            No models found matching your filters
          </p>
          <button
            onClick={clearFilters}
            className="text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredModels.map((model) => (
            <div
              key={model._id}
              className="bg-white rounded-lg sm:rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {model.image ? (
                <div className="w-full h-40 sm:h-48 relative bg-gray-50">
                  <Image
                    src={model.image}
                    alt={model.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-40 sm:h-48 bg-gray-100" />
              )}
              
              <div className="p-3 sm:p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">
                      {typeof model.brandId === 'object' ? model.brandId.name : 'Unknown Brand'}
                    </p>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-2 mb-1">
                      {model.name}
                    </h3>
                    {model.releaseYear && (
                      <p className="text-xs sm:text-sm text-gray-500">Released: {model.releaseYear}</p>
                    )}
                  </div>
                  <div className="flex gap-1 sm:gap-2 ml-2 flex-shrink-0">
                    <button
                      onClick={() => openEditModal(model)}
                      className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      aria-label="Edit model"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(model._id)}
                      className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Delete model"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
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

function ModelModal({ 
  model, 
  brands,
  onClose, 
  token 
}: { 
  model: Model | null; 
  brands: Brand[];
  onClose: (updated?: boolean) => void;
  token: string;
}) {
  const [formData, setFormData] = useState({
    name: model?.name || '',
    brandId: typeof model?.brandId === 'object' ? model.brandId._id : (model?.brandId || ''),
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
          'Authorization': `Bearer ${token}`,
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-3 sm:p-4">
      <div className="bg-white rounded-lg sm:rounded-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
          {model ? 'Edit Model' : 'Add Model'}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-3 sm:mb-4 text-sm sm:text-base">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
              Brand *
            </label>
            <select
              value={formData.brandId}
              onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
              required
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
              Model Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
              Release Year
            </label>
            <input
              type="number"
              value={formData.releaseYear}
              onChange={(e) => setFormData({ ...formData, releaseYear: parseInt(e.target.value) })}
              min="2000"
              max={new Date().getFullYear() + 1}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
              Specifications
            </label>
            <textarea
              value={formData.specifications}
              onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
              rows={3}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Brief specifications..."
            />
          </div>

          <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
            <button
              type="button"
              onClick={() => onClose()}
              className="flex-1 px-4 py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : model ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}