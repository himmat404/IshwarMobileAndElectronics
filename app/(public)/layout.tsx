'use client';

import { Smartphone, Menu, X, Search, Home, Shield } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      {/* Header with glassmorphism */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo with gradient */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base lg:text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Ishwar Mobile
                </span>
                <span className="text-[10px] sm:text-xs text-gray-500 -mt-1 hidden sm:block">
                  & Electronics
                </span>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              <Link 
                href="/" 
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 font-medium rounded-lg hover:bg-blue-50/50 transition-all duration-300 group"
              >
                <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Home</span>
              </Link>
              <Link 
                href="/#brands" 
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium rounded-lg hover:bg-indigo-50/50 transition-all duration-300 group"
              >
                <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Brands</span>
              </Link>
              <Link 
                href="/admin" 
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg font-medium transition-all duration-300 hover:scale-105 ml-2"
              >
                <Shield className="w-4 h-4" />
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-300"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t border-gray-200/50 bg-white/80 backdrop-blur-lg -mx-4 px-4">
              <div className="flex flex-col gap-2">
                <Link 
                  href="/" 
                  className="flex items-center gap-3 text-gray-700 hover:text-blue-600 font-medium py-3 px-4 rounded-lg hover:bg-blue-50/50 transition-all duration-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Home className="w-5 h-5" />
                  <span>Home</span>
                </Link>
                <Link 
                  href="/#brands" 
                  className="flex items-center gap-3 text-gray-700 hover:text-indigo-600 font-medium py-3 px-4 rounded-lg hover:bg-indigo-50/50 transition-all duration-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Search className="w-5 h-5" />
                  <span>Browse</span>
                </Link>
                <Link 
                  href="/admin" 
                  className="flex items-center gap-3 justify-center py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg font-medium text-center transition-all duration-300 mt-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Shield className="w-5 h-5" />
                  <span>Admin Panel</span>
                </Link>
              </div>
            </nav>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <main>{children}</main>
      
      {/* Footer with gradient */}
      <footer className="bg-white/80 backdrop-blur-lg border-t border-gray-200/50 mt-16 sm:mt-20">
        <div className="container mx-auto px-4 py-4 sm:py-4">
          <div className="text-center">       
            {/* Copyright */}
            <p className="text-sm text-gray-500">
              &copy; 2025 Ishwar Mobile & Electronics. All rights reserved.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Premium mobile accessories for every device
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}