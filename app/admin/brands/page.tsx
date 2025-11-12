'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import type { Brand } from '@/types';
import ImageUpload from '@/components/admin/ImageUpload'; // ✅ Added import

export default function AdminBrandsPage() {
  const { token } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  useEffect(() => {
    fetchBrands();
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Brands</h1>
          <p className="text-gray-600">{brands.length} brands in total</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Brand
        </button>
      </div>

      {brands.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-600 mb-4">No brands yet. Create your first brand!</p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Brand
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => (
            <div
              key={brand._id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                {brand.logo ? (
                  <div className="w-16 h-16 relative">
                    <Image
                      src={brand.logo}
                      alt={brand.name}
                      fill
                      sizes="64px"
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg" />
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(brand)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(brand._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{brand.name}</h3>
              {brand.description && (
                <p className="text-gray-600 text-sm line-clamp-2">{brand.description}</p>
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

// ✅ Updated BrandModal with ImageUpload
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {brand ? 'Edit Brand' : 'Add Brand'}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description..."
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
              {saving ? 'Saving...' : brand ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
