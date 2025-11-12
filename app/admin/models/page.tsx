'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import type { Model, Brand } from '@/types';
import ImageUpload from '@/components/admin/ImageUpload'; // ✅ Added import

export default function AdminModelsPage() {
  const { token } = useAuth();
  const [models, setModels] = useState<Model[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [filterBrandId, setFilterBrandId] = useState('');

  useEffect(() => {
    fetchBrands();
    fetchModels();
  }, []);

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

  const fetchModels = async (brandId?: string) => {
    try {
      const url = brandId ? `/api/models?brandId=${brandId}` : '/api/models';
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setModels(data.models);
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
        setModels(models.filter(m => m._id !== id));
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
      fetchModels(filterBrandId);
    }
  };

  const handleFilterChange = (brandId: string) => {
    setFilterBrandId(brandId);
    setLoading(true);
    fetchModels(brandId || undefined);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Models</h1>
          <p className="text-gray-600">{models.length} models in total</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Model
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Brand:</label>
          <select
            value={filterBrandId}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Brands</option>
            {brands.map((brand) => (
              <option key={brand._id} value={brand._id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {models.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-600 mb-4">
            {filterBrandId ? 'No models for this brand yet.' : 'No models yet. Create your first model!'}
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Model
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model) => (
            <div
              key={model._id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {model.image ? (
                <div className="w-full h-48 relative bg-gray-50">
                  <Image
                    src={model.image}
                    alt={model.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-gray-100" />
              )}
              
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">
                      {typeof model.brandId === 'object' ? model.brandId.name : 'Unknown Brand'}
                    </p>
                    <h3 className="text-lg font-bold text-gray-900">{model.name}</h3>
                    {model.releaseYear && (
                      <p className="text-sm text-gray-500">Released: {model.releaseYear}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(model)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(model._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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

// ✅ Replaced ModelModal function
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {model ? 'Edit Model' : 'Add Model'}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand *
            </label>
            <select
              value={formData.brandId}
              onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Release Year
            </label>
            <input
              type="number"
              value={formData.releaseYear}
              onChange={(e) => setFormData({ ...formData, releaseYear: parseInt(e.target.value) })}
              min="2000"
              max={new Date().getFullYear() + 1}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specifications
            </label>
            <textarea
              value={formData.specifications}
              onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief specifications..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => onClose()}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : model ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
