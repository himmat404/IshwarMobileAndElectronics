'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Plus, Edit2, Trash2, Loader2, Search, X } from 'lucide-react';
import Image from 'next/image';
import type { Brand } from '@/types';
import ImageUpload from '@/components/admin/ImageUpload';

export default function AdminBrandsPage() {
  const { token } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    // Filter brands based on search query
    if (searchQuery.trim() === '') {
      setFilteredBrands(brands);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = brands.filter((brand) => {
        return (
          brand.name.toLowerCase().includes(query) ||
          brand.description?.toLowerCase().includes(query)
        );
      });
      setFilteredBrands(filtered);
    }
  }, [searchQuery, brands]);

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands');
      const data = await response.json();
      if (response.ok) {
        setBrands(data.brands);
        setFilteredBrands(data.brands);
      }
    } catch (error) {
      console.error('Failed to fetch brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand?')) return;

    try {
      const response = await fetch(`/api/brands/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setBrands(brands.filter(b => b._id !== id));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete brand');
      }
    } catch (error) {
      alert('Failed to delete brand');
    }
  };

  const openCreateModal = () => {
    setEditingBrand(null);
    setShowModal(true);
  };

  const openEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setShowModal(true);
  };

  const handleModalClose = (updated?: boolean) => {
    setShowModal(false);
    setEditingBrand(null);
    if (updated) {
      fetchBrands();
    }
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Brands</h1>
          <p className="text-sm sm:text-base text-gray-600">
            {brands.length} {brands.length === 1 ? 'brand' : 'brands'} in total
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Add Brand</span>
        </button>
      </div>

      {/* Search Bar */}
      {brands.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search brands by name or description..."
              className="w-full pl-10 sm:pl-12 pr-10 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              Found {filteredBrands.length} {filteredBrands.length === 1 ? 'brand' : 'brands'}
            </p>
          )}
        </div>
      )}

      {/* Empty State */}
      {brands.length === 0 ? (
        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-8 sm:p-12 text-center">
          <p className="text-sm sm:text-base text-gray-600 mb-4">No brands yet. Create your first brand!</p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Add Brand</span>
          </button>
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-8 sm:p-12 text-center">
          <p className="text-sm sm:text-base text-gray-600 mb-2">No brands found matching "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredBrands.map((brand) => (
            <div
              key={brand._id}
              className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                {brand.logo ? (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 relative flex-shrink-0">
                    <Image
                      src={brand.logo}
                      alt={brand.name}
                      fill
                      sizes="(max-width: 640px) 48px, 64px"
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg flex-shrink-0" />
                )}
                <div className="flex gap-1.5 sm:gap-2">
                  <button
                    onClick={() => openEditModal(brand)}
                    className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    aria-label="Edit brand"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(brand._id)}
                    className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Delete brand"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2 line-clamp-1">
                {brand.name}
              </h3>
              {brand.description && (
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{brand.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <BrandModal
          brand={editingBrand}
          onClose={handleModalClose}
          token={token!}
        />
      )}
    </div>
  );
}

function BrandModal({ 
  brand, 
  onClose, 
  token 
}: { 
  brand: Brand | null; 
  onClose: (updated?: boolean) => void;
  token: string;
}) {
  const [formData, setFormData] = useState({
    name: brand?.name || '',
    logo: brand?.logo || '',
    description: brand?.description || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const url = brand ? `/api/brands/${brand._id}` : '/api/brands';
      const method = brand ? 'PUT' : 'POST';

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
        setError(data.error || 'Failed to save brand');
      }
    } catch (err) {
      setError('Failed to save brand');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-3 sm:p-4">
      <div className="bg-white rounded-lg sm:rounded-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
          {brand ? 'Edit Brand' : 'Add Brand'}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-3 sm:mb-4 text-sm sm:text-base">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
              Brand Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Apple"
            />
          </div>

          <ImageUpload
            value={formData.logo}
            onChange={(url) => setFormData({ ...formData, logo: url })}
            folder="brands"
            label="Brand Logo"
            token={token}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Brief description..."
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
              {saving ? 'Saving...' : brand ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}