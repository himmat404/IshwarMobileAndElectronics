'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Plus, Edit2, Trash2, Loader2, Package } from 'lucide-react';
import Image from 'next/image';
import { formatPrice, getStockStatus } from '@/lib/utils';
import type { Product, Model, Brand } from '@/types';

// ✅ Added import
import MultiImageUpload from '@/components/admin/MultiImageUpload';

export default function AdminProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filters, setFilters] = useState({
    modelId: '',
    type: '',
    inStock: '',
  });

  useEffect(() => {
    fetchBrands();
    fetchModels();
    fetchProducts();
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

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/models');
      const data = await response.json();
      if (response.ok) {
        setModels(data.models);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
  };

  const fetchProducts = async (filterParams?: any) => {
    try {
      const params = new URLSearchParams();
      if (filterParams?.modelId) params.append('modelId', filterParams.modelId);
      if (filterParams?.type) params.append('type', filterParams.type);
      if (filterParams?.inStock) params.append('inStock', filterParams.inStock);

      const url = `/api/products${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setProducts(products.filter(p => p._id !== id));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete product');
      }
    } catch (error) {
      alert('Failed to delete product');
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleModalClose = (updated?: boolean) => {
    setShowModal(false);
    setEditingProduct(null);
    if (updated) {
      fetchProducts(filters);
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setLoading(true);
    fetchProducts(newFilters);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Products</h1>
          <p className="text-gray-600">{products.length} products in total</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <select
              value={filters.modelId}
              onChange={(e) => handleFilterChange({ ...filters, modelId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Models</option>
              {models.map((model) => (
                <option key={model._id} value={model._id}>
                  {typeof model.brandId === 'object' && `${model.brandId.name} `}
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange({ ...filters, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="cover">Covers</option>
              <option value="screen-guard">Screen Guards</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
            <select
              value={filters.inStock}
              onChange={(e) => handleFilterChange({ ...filters, inStock: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Products</option>
              <option value="true">In Stock</option>
            </select>
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No products found. Create your first product!</p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
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
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-300" />
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">
                        {typeof product.modelId === 'object' && 
                         typeof product.modelId.brandId === 'object' &&
                         `${product.modelId.brandId.name} ${product.modelId.name}`}
                      </p>
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {product.type === 'cover' ? 'Cover' : 'Screen Guard'}
                        </span>
                        {product.material && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {product.material}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xl font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </span>
                    <span className={`text-sm font-medium ${stockStatus.color}`}>
                      {stockStatus.label}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">SKU: {product.sku}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <ProductModal
          product={editingProduct}
          models={models}
          onClose={handleModalClose}
          token={token!}
        />
      )}
    </div>
  );
}

/* ✅ Replaced ProductModal function with updated version */
function ProductModal({ 
  product, 
  models,
  onClose, 
  token 
}: { 
  product: Product | null; 
  models: Model[];
  onClose: (updated?: boolean) => void;
  token: string;
}) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    modelId: typeof product?.modelId === 'object' ? product.modelId._id : (product?.modelId || ''),
    type: product?.type || 'cover' as 'cover' | 'screen-guard',
    material: product?.material || '',
    color: product?.color || '',
    price: product?.price || 0,
    images: product?.images || [],
    description: product?.description || '',
    stockQuantity: product?.stockQuantity || 0,
    sku: product?.sku || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const url = product ? `/api/products/${product._id}` : '/api/products';
      const method = product ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price.toString()),
          stockQuantity: parseInt(formData.stockQuantity.toString()),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onClose(true);
      } else {
        setError(data.error || 'Failed to save product');
      }
    } catch (err) {
      setError('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {product ? 'Edit Product' : 'Add Product'}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model *
              </label>
              <select
                value={formData.modelId}
                onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Model</option>
                {models.map((model) => (
                  <option key={model._id} value={model._id}>
                    {typeof model.brandId === 'object' && `${model.brandId.name} `}
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Silicone Case - Black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="cover">Cover</option>
                <option value="screen-guard">Screen Guard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU *
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., IP15-CVR-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material
              </label>
              <input
                type="text"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Silicone"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) })}
                required
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* ✅ Replaced textarea with MultiImageUpload */}
            <div className="col-span-2">
              <MultiImageUpload
                values={formData.images}
                onChange={(urls) => setFormData({ ...formData, images: urls })}
                folder="products"
                label="Product Images"
                maxImages={5}
                token={token}
              />
            </div>
                        <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter a short product description..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => onClose(false)}
              disabled={saving}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
