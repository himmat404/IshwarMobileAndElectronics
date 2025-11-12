import { Smartphone } from 'lucide-react';
import Link from 'next/link';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Smartphone className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">
                Ishwar Mobile & Electronics
              </span>
            </Link>
            
            <nav className="flex items-center gap-6">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Browse
              </Link>
              <Link 
                href="/search" 
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Search
              </Link>
              <Link 
                href="/admin" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Admin
              </Link>
            </nav>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main>{children}</main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 Ishwar Mobile & Electronics. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}