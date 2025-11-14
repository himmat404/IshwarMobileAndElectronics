'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Package,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { formatPrice, getStockStatus } from '@/lib/utils';
import type { Product } from '@/types';

const ITEMS_PER_PAGE = 20;

export default function AdminInventoryPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockAction, setStockAction] = useState<'in' | 'out'>('in');

  // Main data fetching function
  const fetchProducts = useCallback(async () => {
    setSearching(true);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());
      params.append('sortBy', sortBy);

      if (debouncedSearchQuery) {
        params.append('search', debouncedSearchQuery);
      }

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setProducts(data.products);
        setTotalCount(data.total || data.products.length);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [currentPage, debouncedSearchQuery, sortBy]);

  // Fetch products when filters, search, or page changes
  useEffect(() => {
    setLoading(true);
    fetchProducts();
  }, [fetchProducts]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms debounce

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset to page 1 when filters or search changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchQuery, sortBy]);

  const openStockModal = (product: Product, action: 'in' | 'out') => {
    setSelectedProduct(product);
    setStockAction(action);
    setShowStockModal(true);
  };

  const handleModalClose = (updated?: boolean) => {
    setShowStockModal(false);
    setSelectedProduct(null);
    if (updated) {
      fetchProducts(); // Refetch current page
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="card animate-fade-in">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-1 sm:mb-2">
          Inventory Management
        </h1>
        <p className="text-sm sm:text-base text-[var(--muted)]">
          Manage stock levels for {totalCount} product{totalCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search & Sort */}
      <div className="card p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[var(--muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, SKU, or model..."
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
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>

          {/* Sort By */}
          <div className="relative">
            <ArrowUpDown className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[var(--muted)] pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto pl-10 sm:pl-12 pr-8 py-2 sm:py-3 text-sm sm:text-base border border-[var(--border)] rounded-xl
                         focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-colors bg-white appearance-none"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="date-newest">Newest</option>
              <option value="date-oldest">Oldest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-500/5">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {products.map((product) => {
                const stockStatus = getStockStatus(product.stockQuantity);
                
                // **UPDATED LOGIC HERE**
                // Get all model names
                const modelNames = product.models && Array.isArray(product.models)
                  ? product.models
                      .map(m => {
                        if (typeof m === 'object' && m.name) {
                          const brand = (m.brandId && typeof m.brandId === 'object') ? m.brandId.name : '';
                          return brand ? `${brand} ${m.name}` : m.name;
                        }
                        return null;
                      })
                      .filter(Boolean) as string[]
                  : [];
                
                const modelString = modelNames.join(', ');

                return (
                  <tr key={product._id} className="hover:bg-gray-500/5 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <div>
                        <p className="font-medium text-[var(--foreground)] line-clamp-2">
                          {product.name}
                        </p>
                        {/* List all models, with a tooltip and line clamp */}
                        <p 
                          className="text-sm text-[var(--muted)] line-clamp-2" 
                          title={modelString}
                        >
                          {modelString || 'No models assigned'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className="text-sm text-[var(--muted)]">{product.sku}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        {formatPrice(product.price)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className="text-lg font-bold text-[var(--foreground)]">
                        {product.stockQuantity}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span
                        className={`text-sm font-medium ${
                          stockStatus.status === 'in-stock'
                            ? 'text-green-600'
                            : stockStatus.status === 'low-stock'
                            ? 'text-orange-600'
                            : 'text-red-600'
                        }`}
                      >
                        {stockStatus.label}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openStockModal(product, 'in')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-700 rounded-lg
                                     hover:bg-green-500/20 text-sm font-medium transition-colors"
                        >
                          <ArrowUp className="w-4 h-4" />
                          In
                        </button>
                        <button
                          onClick={() => openStockModal(product, 'out')}
                          disabled={product.stockQuantity === 0}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-700 rounded-lg
                                     hover:bg-red-500/20 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ArrowDown className="w-4 h-4" />
                          Out
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalCount === 0 && !loading && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-[var(--muted)]">
              {searchQuery
                ? 'No products found matching your search.'
                : 'No products yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--border)]">
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const endpoint =
        action === 'in'
          ? '/api/inventory/stock-in'
          : '/api/inventory/stock-out';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product._id,
          quantity,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onClose(true);
      } else {
        setError(
          data.error || `Failed to ${action === 'in' ? 'add' : 'remove'} stock`
        );
      }
    } catch (err) {
      setError(`Failed to ${action === 'in' ? 'add' : 'remove'} stock`);
    } finally {
      setSaving(false);
    }
  };

  const maxQuantity = action === 'out' ? product.stockQuantity : 9999;
  const isError = quantity < 1 || quantity > maxQuantity;
  
  const newStock = action === 'in' 
    ? product.stockQuantity + quantity 
    : product.stockQuantity - quantity;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="card max-w-md w-full">
        <h2 className="text-2xl font-bold gradient-text mb-4">
          {action === 'in' ? 'Stock In' : 'Stock Out'}
        </h2>

        <div className="bg-gray-500/5 p-4 rounded-lg mb-4 border border-[var(--border)]">
          <p className="font-medium text-[var(--foreground)] mb-1">
            {product.name}
          </p>
          <p className="text-sm text-[var(--muted)] mb-2">SKU: {product.sku}</p>
          <p className="text-sm text-[var(--muted)]">
            Current Stock: <span className="font-bold text-lg text-[var(--foreground)]">{product.stockQuantity}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1.5">
              Quantity *
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              required
              min="1"
              max={maxQuantity}
              className={`w-full px-4 py-2 border rounded-lg bg-white
                         focus:ring-2 focus:border-transparent transition-colors ${
                           isError
                             ? 'border-red-500 ring-red-500/50'
                             : 'border-[var(--border)] focus:ring-[var(--accent)]'
                         }`}
            />
            {!isError ? (
              <p className="text-sm text-[var(--muted)] mt-1.5">
                New stock will be: <span className="font-bold text-[var(--foreground)]">{newStock}</span>
              </p>
            ) : (
               <p className="text-sm text-red-600 mt-1.5">
                {action === 'out' ? `Cannot remove more than ${maxQuantity}` : 'Quantity must be at least 1'}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => onClose()}
              className="flex-1 px-4 py-2 border border-[var(--border)] text-[var(--muted)] rounded-xl
                         hover:bg-gray-500/10 hover:text-[var(--foreground)] font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || isError}
              className={`flex-1 px-4 py-2 rounded-xl font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 transition-colors ${
                           action === 'in'
                             ? 'bg-green-600 hover:bg-green-700'
                             : 'bg-red-600 hover:bg-red-700'
                         }`}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Processing...' : action === 'in' ? 'Add Stock' : 'Remove Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}