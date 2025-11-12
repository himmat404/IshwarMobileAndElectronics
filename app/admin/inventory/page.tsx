'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ArrowDown, ArrowUp, Loader2, Package, Search } from 'lucide-react';
import { formatPrice, getStockStatus } from '@/lib/utils';
import type { Product } from '@/types';

export default function AdminInventoryPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockAction, setStockAction] = useState<'in' | 'out'>('in');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
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

  const openStockModal = (product: Product, action: 'in' | 'out') => {
    setSelectedProduct(product);
    setStockAction(action);
    setShowStockModal(true);
  };

  const handleModalClose = (updated?: boolean) => {
    setShowStockModal(false);
    setSelectedProduct(null);
    if (updated) {
      fetchProducts();
    }
  };

  const filteredProducts = products.filter(product => {
    const searchLower = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.sku.toLowerCase().includes(searchLower) ||
      (typeof product.modelId === 'object' && 
       product.modelId.name.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
        <p className="text-gray-600">Manage stock levels for all products</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, SKU, or model..."
            className="flex-1 outline-none"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stockQuantity);
                
                return (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          {typeof product.modelId === 'object' && 
                           typeof product.modelId.brandId === 'object' &&
                           `${product.modelId.brandId.name} ${product.modelId.name}`}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{product.sku}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {formatPrice(product.price)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-gray-900">
                        {product.stockQuantity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openStockModal(product, 'in')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium"
                        >
                          <ArrowUp className="w-4 h-4" />
                          Stock In
                        </button>
                        <button
                          onClick={() => openStockModal(product, 'out')}
                          disabled={product.stockQuantity === 0}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowDown className="w-4 h-4" />
                          Stock Out
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchQuery ? 'No products found matching your search.' : 'No products yet.'}
            </p>
          </div>
        )}
      </div>

      {showStockModal && selectedProduct && (
        <StockModal
          product={selectedProduct}
          action={stockAction}
          onClose={handleModalClose}
          token={token!}
        />
      )}
    </div>
  );
}

function StockModal({
  product,
  action,
  onClose,
  token,
}: {
  product: Product;
  action: 'in' | 'out';
  onClose: (updated?: boolean) => void;
  token: string;
}) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const endpoint = action === 'in' ? '/api/inventory/stock-in' : '/api/inventory/stock-out';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product._id,
          quantity,
          notes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onClose(true);
      } else {
        setError(data.error || `Failed to ${action === 'in' ? 'add' : 'remove'} stock`);
      }
    } catch (err) {
      setError(`Failed to ${action === 'in' ? 'add' : 'remove'} stock`);
    } finally {
      setSaving(false);
    }
  };

  const maxQuantity = action === 'out' ? product.stockQuantity : 9999;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {action === 'in' ? 'Stock In' : 'Stock Out'}
        </h2>

        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <p className="font-medium text-gray-900 mb-1">{product.name}</p>
          <p className="text-sm text-gray-600 mb-2">SKU: {product.sku}</p>
          <p className="text-sm text-gray-600">
            Current Stock: <span className="font-bold">{product.stockQuantity}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              required
              min="1"
              max={maxQuantity}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {action === 'in' && (
              <p className="text-sm text-gray-500 mt-1">
                New stock will be: {product.stockQuantity + quantity}
              </p>
            )}
            {action === 'out' && (
              <p className="text-sm text-gray-500 mt-1">
                New stock will be: {product.stockQuantity - quantity}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any notes about this transaction..."
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
              disabled={saving || quantity < 1 || quantity > maxQuantity}
              className={`flex-1 px-4 py-2 rounded-lg font-medium disabled:opacity-50 ${
                action === 'in'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {saving ? 'Processing...' : action === 'in' ? 'Add Stock' : 'Remove Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}