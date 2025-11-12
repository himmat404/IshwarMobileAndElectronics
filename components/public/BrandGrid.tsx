'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Smartphone } from 'lucide-react';
import type { Brand } from '@/types';

export default function BrandGrid() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands');
      const data = await response.json();
      
      if (response.ok) {
        setBrands(data.brands);
      } else {
        setError(data.error || 'Failed to fetch brands');
      }
    } catch (err) {
      setError('Failed to fetch brands');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div 
            key={i} 
            className="bg-white p-6 rounded-xl border border-gray-200 animate-pulse"
          >
            <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4" />
            <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (brands.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No brands available yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {brands.map((brand, index) => (
        <Link
          key={brand._id}
          href={`/brands/${brand._id}`}
          className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all group"
        >
          <div className="flex flex-col items-center">
            {brand.logo ? (
              <div className="w-20 h-20 relative mb-4">
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  fill
                  sizes="80px"
                  priority={index < 4}
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="w-10 h-10 text-gray-400" />
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-center">
              {brand.name}
            </h3>
          </div>
        </Link>
      ))}
    </div>
  );
}