'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Package, Smartphone, Tag, TrendingUp, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    totalBrands: 0,
    totalModels: 0,
    totalProducts: 0,
    inStock: 0,
    outOfStock: 0,
    lowStock: 0,
    totalValue: 0,
  });
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch inventory summary
      const inventoryRes = await fetch('/api/inventory/summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (inventoryRes.ok) {
        const inventoryData = await inventoryRes.json();
        setStats(prev => ({
          ...prev,
          totalProducts: inventoryData.summary.totalProducts,
          inStock: inventoryData.summary.inStockProducts,
          outOfStock: inventoryData.summary.outOfStockProducts,
          lowStock: inventoryData.summary.lowStockProducts,
          totalValue: inventoryData.summary.totalStockValue,
        }));
        setLowStockItems(inventoryData.lowStockItems);
      }

      // Fetch brands count
      const brandsRes = await fetch('/api/brands');
      if (brandsRes.ok) {
        const brandsData = await brandsRes.json();
        setStats(prev => ({ ...prev, totalBrands: brandsData.brands.length }));
      }

      // Fetch models count
      const modelsRes = await fetch('/api/models');
      if (modelsRes.ok) {
        const modelsData = await modelsRes.json();
        setStats(prev => ({ ...prev, totalModels: modelsData.models.length }));
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of your store</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Brands"
          value={stats.totalBrands}
          icon={Tag}
          color="blue"
          href="/admin/brands"
        />
        <StatCard
          title="Total Models"
          value={stats.totalModels}
          icon={Smartphone}
          color="purple"
          href="/admin/models"
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          color="green"
          href="/admin/products"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStock}
          icon={AlertTriangle}
          color="orange"
          href="/admin/inventory"
        />
      </div>

      {/* Inventory Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Stock Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">In Stock</span>
              <span className="text-2xl font-bold text-green-600">{stats.inStock}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Low Stock</span>
              <span className="text-2xl font-bold text-orange-600">{stats.lowStock}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Out of Stock</span>
              <span className="text-2xl font-bold text-red-600">{stats.outOfStock}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Inventory Value</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">
                ₹{stats.totalValue.toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-gray-600">Total stock value</p>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-white rounded-xl border border-orange-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-bold text-gray-900">Low Stock Alert</h2>
          </div>
          <div className="space-y-3">
            {lowStockItems.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    {typeof item.modelId === 'object' && item.modelId.brandId && 
                      `${item.modelId.brandId.name} ${item.modelId.name}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-orange-600">
                    {item.stockQuantity} left
                  </p>
                  <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/admin/inventory"
            className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
          >
            View Inventory Management →
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color,
  href 
}: { 
  title: string; 
  value: number; 
  icon: any; 
  color: string;
  href: string;
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <Link
      href={href}
      className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-500 hover:shadow-lg transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors[color as keyof typeof colors]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-gray-600">{title}</p>
    </Link>
  );
}