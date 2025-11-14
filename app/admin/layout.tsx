'use client';

import { useEffect, useState } from 'react';
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
  ExternalLink,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, token, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !token && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [token, isLoading, router, pathname]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!token && pathname !== '/admin/login') return null;

  if (pathname === '/admin/login') return <>{children}</>;

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Brands', href: '/admin/brands', icon: Tag },
    { name: 'Models', href: '/admin/models', icon: Smartphone },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Inventory', href: '/admin/inventory', icon: Warehouse },
  ];

  return (
    <div className="min-h-screen bg-gray-100">

      {/* MOBILE OVERLAY */}
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity duration-300 lg:hidden ${
          sidebarOpen ? 'opacity-100 z-40' : 'opacity-0 pointer-events-none -z-10'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 sm:w-72 bg-white border-r border-gray-200 
          shadow-lg lg:shadow-none
          transition-transform duration-300 ease-in-out 
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0 z-50' : '-translate-x-full z-50'}
        `}
      >
        <div className="flex flex-col h-full">

          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2 font-bold text-lg"
            >
              <Smartphone className="w-7 h-7 text-blue-600" />
              <span>Admin Panel</span>
            </Link>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-600 hover:text-gray-800"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg mb-1 
                    transition-colors
                    ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="mb-3">
              <p className="font-medium text-gray-800">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>

            <button
              onClick={() => {
                logout();
                setSidebarOpen(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>

        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="lg:pl-72">

        {/* MOBILE HEADER */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>

          <h1 className="text-base font-semibold text-gray-800">
            {navigation.find((item) => item.href === pathname)?.name || 'Admin'}
          </h1>

          <div className="w-6 h-6"></div>
        </header>

        {/* PAGE CONTENT */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
