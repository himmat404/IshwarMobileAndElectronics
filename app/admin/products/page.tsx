'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Plus, Edit2, Trash2, Loader2, Package, Search, X, Filter as FilterIcon } from 'lucide-react';
import Image from 'next/image';
import { formatPrice, getStockStatus } from '@/lib/utils';
import type { Product, Model, Brand } from '@/types';
import MultiImageUpload from '@/components/admin/MultiImageUpload';

export default function AdminProductsPage() {
  const { token } = useAuth();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    brandId: '',
    modelId: '',
    type: '',
    inStock: '',
  });

  useEffect(() => {
    fetchBrands();
    fetchModels();
    fetchProducts();
  }, []);

  useEffect(() => {
    // Apply filters and search
    let filtered = [...allProducts];

    // Brand filter
    if (filters.brandId) {
      filtered = filtered.filter((product) => {
        const model = typeof product.modelId === 'object' ? product.modelId : null;
        if (!model) return false;
        const brandId = typeof model.brandId === 'object' ? model.brandId._id : model.brandId;
        return brandId === filters.brandId;
      });
    }

    // Model filter
    if (filters.modelId) {
      filtered = filtered.filter((product) => {
        const modelId = typeof product.modelId === 'object' ? product.modelId._id : product.modelId;
        return modelId === filters.modelId;
      });
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter((product) => product.type === filters.type);
    }

    // Stock filter
    if (filters.inStock === 'true') {
      filtered = filtered.filter((product) => product.stockQuantity > 0);
    }

    // Search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((product) => {
        const model = typeof product.modelId === 'object' ? product.modelId : null;
        const brandName = model && typeof model.brandId === 'object' ? model.brandId.name : '';
        const modelName = model ? model.name : '';
        
        return (
          product.name.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query) ||
          product.material?.toLowerCase().includes(query) ||
          product.color?.toLowerCase().includes(query) ||
          brandName.toLowerCase().includes(query) ||
          modelName.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query)
        );
      });
    }

    setFilteredProducts(filtered);
  }, [searchQuery, filters, allProducts]);

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

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      if (response.ok) {
        setAllProducts(data.products);
        setFilteredProducts(data.products);
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
        setAllProducts(allProducts.filter(p => p._id !== id));
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
      fetchProducts();
    }
  };

  const clearFilters = () => {
    setFilters({
      brandId: '',
      modelId: '',
      type: '',
      inStock: '',
    });
    setSearchQuery('');
  };

  // Get filtered models based on selected brand
  const getFilteredModels = () => {
    if (!filters.brandId) return models;
    return models.filter((model) => {
      const brandId = typeof model.brandId === 'object' ? model.brandId._id : model.brandId;
      return brandId === filters.brandId;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const selectedBrand = brands.find(b => b._id === filters.brandId);
  const selectedModel = models.find(m => m._id === filters.modelId);
  const filteredModelsForDropdown = getFilteredModels();

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Products</h1>
          <p className="text-sm sm:text-base text-gray-600">
            {allProducts.length} {allProducts.length === 1 ? 'product' : 'products'} in total
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Search Bar */}
      {allProducts.length > 0 && (
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, SKU, brand, model, material, or color..."
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
        </div>
      )}

      {/* Filters */}
      {allProducts.length > 0 && (
        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Brand Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                <FilterIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                Brand
              </label>
              <select
                value={filters.brandId}
                onChange={(e) => setFilters({ ...filters, brandId: e.target.value, modelId: '' })}
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

            {/* Model Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Model
              </label>
              <select
                value={filters.modelId}
                onChange={(e) => setFilters({ ...filters, modelId: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!!(filters.brandId && filteredModelsForDropdown.length === 0)}
              >
                <option value="">
                  {filters.brandId ? `All ${selectedBrand?.name} Models` : 'All Models'}
                </option>
                {filteredModelsForDropdown.map((model) => (
                  <option key={model._id} value={model._id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="cover">Covers</option>
                <option value="screen-guard">Screen Guards</option>
              </select>
            </div>

            {/* Stock Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Stock Status
              </label>
              <select
                value={filters.inStock}
                onChange={(e) => setFilters({ ...filters, inStock: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Products</option>
                <option value="true">In Stock</option>
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {(filters.brandId || filters.modelId || filters.type || filters.inStock || searchQuery) && (
            <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
              <span className="text-xs sm:text-sm font-medium text-gray-700">Active filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm">
                  Search: "{searchQuery.length > 20 ? searchQuery.substring(0, 20) + '...' : searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-blue-900 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.brandId && (
                <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm">
                  Brand: {selectedBrand?.name}
                  <button onClick={() => setFilters({ ...filters, brandId: '', modelId: '' })} className="hover:text-blue-900 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.modelId && (
                <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm">
                  Model: {selectedModel?.name}
                  <button onClick={() => setFilters({ ...filters, modelId: '' })} className="hover:text-blue-900 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.type && (
                <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm">
                  {filters.type === 'cover' ? 'Covers' : 'Screen Guards'}
                  <button onClick={() => setFilters({ ...filters, type: '' })} className="hover:text-blue-900 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.inStock && (
                <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm">
                  In Stock
                  <button onClick={() => setFilters({ ...filters, inStock: '' })} className="hover:text-blue-900 ml-1">
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
          {(filters.brandId || filters.modelId || filters.type || filters.inStock || searchQuery) && (
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              Showing {filteredProducts.length} of {allProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            </p>
          )}
        </div>
      )}

      {/* Products Grid */}
      {allProducts.length === 0 ? (
        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-8 sm:p-12 text-center">
          <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-gray-600 mb-4">No products found. Create your first product!</p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Add Product</span>
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-8 sm:p-12 text-center">
          <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-gray-600 mb-2">No products found matching your filters</p>
          <button
            onClick={clearFilters}
            className="text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product.stockQuantity);
            const mainImage = product.images?.[0];
            const model = typeof product.modelId === 'object' ? product.modelId : null;
            const brandName = model && typeof model.brandId === 'object' ? model.brandId.name : '';
            const modelName = model ? model.name : '';

            return (
              <div
                key={product._id}
                className="bg-white rounded-lg sm:rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {mainImage ? (
                  <div className="w-full h-40 sm:h-48 relative bg-gray-50">
                    <Image
                      src={mainImage}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-40 sm:h-48 bg-gray-100 flex items-center justify-center">
                    <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300" />
                  </div>
                )}

                <div className="p-3 sm:p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1 truncate">
                        {brandName} {modelName}
                      </p>
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-2 mb-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                    </div>
                    <div className="flex gap-1 ml-2 flex-shrink-0">
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        aria-label="Edit product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      product.type === 'cover' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {product.type === 'cover' ? 'Cover' : 'Screen Guard'}
                    </span>
                    {product.material && (
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 truncate max-w-[80px]">
                        {product.material}
                      </span>
                    )}
                    {product.color && (
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 truncate max-w-[60px]">
                        {product.color}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg sm:text-xl font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </span>
                    <span className={`text-xs sm:text-sm font-medium ${stockStatus.color}`}>
                      {stockStatus.label}
                    </span>
                  </div>
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
          brands={brands}
          onClose={handleModalClose}
          token={token!}
        />
      )}
    </div>
  );
}

function ProductModal({ 
  product, 
  models,
  brands,
  onClose, 
  token 
}: { 
  product: Product | null; 
  models: Model[];
  brands: Brand[];
  onClose: (updated?: boolean) => void;
  token: string;
}) {
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [formData, setFormData] = useState({
    name: product?.name || '',
    modelId: typeof product?.modelId === 'object' ? product.modelId._id : (product?.modelId || ''),
    type: product?.type || 'cover',
    material: product?.material || '',
    color: product?.color || '',
    price: product?.price || 0,
    stockQuantity: product?.stockQuantity || 0,
    sku: product?.sku || '',
    images: product?.images || [],
    description: product?.description || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Initialize selected brand when editing
  useEffect(() => {
    if (product && typeof product.modelId === 'object') {
      const brandId = typeof product.modelId.brandId === 'object' 
        ? product.modelId.brandId._id 
        : product.modelId.brandId;
      setSelectedBrandId(brandId || '');
    }
  }, [product]);

  // Get filtered models based on selected brand
  const filteredModels = selectedBrandId
    ? models.filter((model) => {
        const brandId = typeof model.brandId === 'object' ? model.brandId._id : model.brandId;
        return brandId === selectedBrandId;
      })
    : models;

  const handleBrandChange = (brandId: string) => {
    setSelectedBrandId(brandId);
    setFormData({ ...formData, modelId: '' }); // Reset model when brand changes
  };

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

  const selectedBrand = brands.find(b => b._id === selectedBrandId);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg sm:rounded-xl max-w-2xl w-full p-4 sm:p-6 my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
          {product ? 'Edit Product' : 'Add Product'}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-3 sm:mb-4 text-sm sm:text-base">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Brand Selection */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Brand *
              </label>
              <select
                value={selectedBrandId}
                onChange={(e) => handleBrandChange(e.target.value)}
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

            {/* Model Selection - Cascading */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Model *
              </label>
              <select
                value={formData.modelId}
                onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                required
                disabled={!selectedBrandId || filteredModels.length === 0}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!selectedBrandId 
                    ? 'Select a brand first' 
                    : filteredModels.length === 0 
                    ? `No models for ${selectedBrand?.name}` 
                    : 'Select Model'}
                </option>
                {filteredModels.map((model) => (
                  <option key={model._id} value={model._id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Name */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Silicone Case - Black"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                required
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="cover">Cover</option>
                <option value="screen-guard">Screen Guard</option>
              </select>
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                SKU *
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., IP15-CVR-001"
              />
            </div>

            {/* Material */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Material
              </label>
              <input
                type="text"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Silicone"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Color
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Black"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Price (₹) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                required
                min="0"
                step="0.01"
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Stock Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Stock Quantity *
              </label>
              <input
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) })}
                required
                min="0"
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Product Images */}
            <div className="sm:col-span-2">
              <MultiImageUpload
                values={formData.images}
                onChange={(urls) => setFormData({ ...formData, images: urls })}
                folder="products"
                label="Product Images"
                maxImages={5}
                token={token}
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter a short product description..."
              />
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
            <button
              type="button"
              onClick={() => onClose(false)}
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm sm:text-base text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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