'use client';

import { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import type { Model } from '@/types';

interface ModelMultiSelectProps {
  selectedModels: string[];
  onChange: (modelIds: string[]) => void;
  label?: string;
  allModels?: Model[]; // ✅ NEW: Accept models from parent to avoid re-fetching
}

export default function ModelMultiSelect({
  selectedModels,
  onChange,
  label = 'Compatible Models',
  allModels, // ✅ NEW: Optional prop
}: ModelMultiSelectProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // ✅ IMPROVED: Use allModels if provided, otherwise fetch with high limit
  useEffect(() => {
    if (allModels && allModels.length > 0) {
      // Use models passed from parent
      setModels(allModels);
      setLoading(false);
    } else {
      // Fallback: fetch with high limit for backward compatibility
      fetchModels();
    }
  }, [allModels]);

  const fetchModels = async () => {
    try {
      // ✅ FIXED: Add ?limit=10000 to get all models
      const response = await fetch('/api/models?limit=10000');
      const data = await response.json();
      if (response.ok) {
        setModels(data.models);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredModels = models.filter((model) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const brandName = typeof model.brandId === 'object' ? model.brandId.name.toLowerCase() : '';
      return model.name.toLowerCase().includes(query) || brandName.includes(query);
    }
    return true;
  });

  const selectedModelObjects = models.filter((m) => selectedModels.includes(m._id));

  const toggleModel = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      onChange(selectedModels.filter((id) => id !== modelId));
    } else {
      onChange([...selectedModels, modelId]);
    }
  };

  const removeModel = (modelId: string) => {
    onChange(selectedModels.filter((id) => id !== modelId));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} *
        {/* ✅ NEW: Show total count if available */}
        {models.length > 0 && (
          <span className="text-xs text-gray-500 font-normal ml-1">
            ({models.length} available)
          </span>
        )}
      </label>

      {/* Selected Models */}
      {selectedModelObjects.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedModelObjects.map((model) => (
            <div
              key={model._id}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              <span>
                {typeof model.brandId === 'object' && `${model.brandId.name} `}
                {model.name}
              </span>
              <button
                type="button"
                onClick={() => removeModel(model._id)}
                className="hover:text-blue-900"
                aria-label={`Remove ${model.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        >
          <span className="text-gray-700">
            {loading
              ? 'Loading models...'
              : selectedModels.length > 0
              ? `${selectedModels.length} model${selectedModels.length > 1 ? 's' : ''} selected`
              : 'Select compatible models...'}
          </span>
          <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            {/* Overlay to close dropdown when clicking outside */}
            <div 
              className="fixed inset-0 z-[5]" 
              onClick={() => setIsOpen(false)}
            />
            
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
              {/* Search */}
              <div className="p-2 border-b">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search models..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Model List */}
              <div className="max-h-48 overflow-y-auto">
                {loading ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    Loading models...
                  </div>
                ) : filteredModels.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    {searchQuery ? `No models found matching "${searchQuery}"` : 'No models found'}
                  </div>
                ) : (
                  filteredModels.map((model) => (
                    <button
                      key={model._id}
                      type="button"
                      onClick={() => toggleModel(model._id)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
                        selectedModels.includes(model._id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedModels.includes(model._id)}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <span>
                        {typeof model.brandId === 'object' && (
                          <span className="text-gray-600">{model.brandId.name} - </span>
                        )}
                        <span className="font-medium">{model.name}</span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-1">
        Select all phone models this product is compatible with (at least one required)
      </p>
    </div>
  );
}