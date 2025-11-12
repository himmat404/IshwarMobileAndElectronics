import Link from 'next/link';
import { Search, Package, TrendingUp } from 'lucide-react';
import BrandGrid from '@/components/public/BrandGrid';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Find the Perfect Accessories
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Browse through our comprehensive collection of mobile covers and screen guards
          organized by brand and model.
        </p>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap justify-center gap-4">
          <Link 
            href="/search"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            <Search className="w-5 h-5" />
            Search All Products
          </Link>
          <Link 
            href="#brands"
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 font-medium transition-colors"
          >
            <Package className="w-5 h-5" />
            Browse by Brand
          </Link>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Wide Selection</h3>
          </div>
          <p className="text-gray-600">
            Thousands of covers and screen guards for all popular phone models
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Latest Models</h3>
          </div>
          <p className="text-gray-600">
            Accessories for the newest phone releases added regularly
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <Search className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Easy Search</h3>
          </div>
          <p className="text-gray-600">
            Powerful search to quickly find exactly what you need
          </p>
        </div>
      </div>
      
      {/* Brands Grid */}
      <div id="brands">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Browse by Brand</h2>
        <BrandGrid />
      </div>
    </div>
  );
}