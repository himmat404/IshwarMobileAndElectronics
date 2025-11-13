'use client';

import { Smartphone, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <Smartphone className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <span className="text-base sm:text-xl font-bold text-gray-900 truncate">
                Ishwar Mobile & Electronics
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Browse
              </Link>
              <Link 
                href="/search" 
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Search
              </Link>
              <Link 
                href="/admin" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Admin
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
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
            <nav className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col gap-4">
                <Link 
                  href="/" 
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Browse
                </Link>
                <Link 
                  href="/search" 
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Search
                </Link>
                <Link 
                  href="/admin" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-center transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              </div>
            </nav>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <main>{children}</main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 sm:mt-16">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="text-center text-gray-600">
            <p className="text-sm sm:text-base">&copy; 2025 Ishwar Mobile & Electronics. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}