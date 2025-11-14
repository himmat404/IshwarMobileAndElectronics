'use client';

import { Search, X, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
  showHint?: boolean;
}

export default function SearchInput({ 
  value, 
  onChange, 
  placeholder = 'Search...',
  onSearch,
  isLoading = false,
  showHint = true
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Escape to clear
      if (e.key === 'Escape' && value) {
        onChange('');
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [value, onChange]);

  const handleChange = (newValue: string) => {
    onChange(newValue);
    if (onSearch && newValue.trim().length > 0) {
      onSearch(newValue);
    }
  };

  return (
    <div className="w-full">
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none z-10">
          {isLoading ? (
            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 animate-spin" />
          ) : (
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          className="w-full pl-9 sm:pl-11 pr-9 sm:pr-10 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          aria-label="Search products, brands, or models"
        />

        {value && (
          <button
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center hover:text-gray-700 transition-colors"
            aria-label="Clear search"
            type="button"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </button>
        )}

        {/* ✅ IMPROVEMENT: Keyboard hint */}
        {!value && !isFocused && showHint && (
          <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center pointer-events-none text-xs text-gray-400">
            <span className="hidden sm:block">Cmd+K</span>
          </div>
        )}
      </div>

      {/* ✅ NEW: Search hints */}
      {!value && isFocused && showHint && (
        <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
          <p className="font-medium mb-2">💡 Search tips:</p>
          <ul className="space-y-1">
            <li>✓ Single letter: <code className="bg-white px-1.5 py-0.5 rounded text-blue-600">a</code>, <code className="bg-white px-1.5 py-0.5 rounded text-blue-600">s</code>, <code className="bg-white px-1.5 py-0.5 rounded text-blue-600">i</code></li>
            <li>✓ Brand name: <code className="bg-white px-1.5 py-0.5 rounded text-blue-600">apple</code>, <code className="bg-white px-1.5 py-0.5 rounded text-blue-600">samsung</code></li>
            <li>✓ Product: <code className="bg-white px-1.5 py-0.5 rounded text-blue-600">case</code>, <code className="bg-white px-1.5 py-0.5 rounded text-blue-600">screen</code></li>
          </ul>
        </div>
      )}
    </div>
  );
}