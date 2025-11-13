'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Package, 
  Smartphone, 
  Tag, 
  Warehouse,
  LogOut,
  Menu,
  X,
  ExternalLink
} from 'lucide-react';
import { useState } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !token && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [token, isLoading, router, pathname]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!token && pathname !== '/admin/login') {
    return null;
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Brands', href: '/admin/brands', icon: Tag },
    { name: 'Models', href: '/admin/models', icon: Smartphone },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Inventory', href: '/admin/inventory', icon: Warehouse },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay - MUST be before sidebar in DOM but with LOWER z-index */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          sidebarOpen ? 'opacity-100 z-40' : 'opacity-0 pointer-events-none -z-10'
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar - HIGHER z-index than overlay */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 sm:w-72 bg-white border-r border-gray-200 shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 z-50' : '-translate-x-full z-50'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <Link 
              href="/admin/dashboard" 
              className="flex items-center gap-2"
              onClick={() => setSidebarOpen(false)}
            >
              <Smartphone className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
              <span className="text-lg sm:text-xl font-bold text-gray-900">Admin Panel</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700 p-1 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm sm:text-base">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-3 sm:p-4 border-t border-gray-200">
            <div className="mb-3 px-1">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => {
                logout();
                setSidebarOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 sm:px-4 py-2 text-sm sm:text-base text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64 lg:ml-8">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              
              {/* Page Title - hidden on very small screens */}
              <h1 className="hidden sm:block text-base sm:text-lg font-semibold text-gray-900 truncate">
                {navigation.find(item => item.href === pathname)?.name || 'Admin'}
              </h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-gray-50 rounded-lg"
              >
                <span className="hidden sm:inline">View Store</span>
                <span className="sm:hidden">Store</span>
                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-3 sm:p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}