import Link from 'next/link';
import { Search, Package, TrendingUp } from 'lucide-react';
import BrandGrid from '@/components/public/BrandGrid';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      {/* Hero Section */}
      <div className="text-center mb-12 sm:mb-16">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
          Find the Perfect Accessories
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
          Browse through our comprehensive collection of mobile covers and screen guards
          organized by brand and model.
        </p>
        
        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 px-4">
          <Link 
            href="/search"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors w-full sm:w-auto"
          >
            <Search className="w-5 h-5" />
            <span>Search All Products</span>
          </Link>
          <Link 
            href="#brands"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 font-medium transition-colors w-full sm:w-auto"
          >
            <Package className="w-5 h-5" />
            <span>Browse by Brand</span>
          </Link>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Wide Selection</h3>
          </div>
          <p className="text-sm sm:text-base text-gray-600">
            Thousands of covers and screen guards for all popular phone models
          </p>
        </div>
        
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-green-600 flex-shrink-0" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Latest Models</h3>
          </div>
          <p className="text-sm sm:text-base text-gray-600">
            Accessories for the newest phone releases added regularly
          </p>
        </div>
        
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-2">
            <Search className="w-6 h-6 text-purple-600 flex-shrink-0" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Easy Search</h3>
          </div>
          <p className="text-sm sm:text-base text-gray-600">
            Powerful search to quickly find exactly what you need
          </p>
        </div>
      </div>
      
      {/* Brands Grid */}
      <div id="brands">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Browse by Brand</h2>
        <BrandGrid />
      </div>
    </div>
  );
}