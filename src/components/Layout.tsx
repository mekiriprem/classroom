import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, LogOut } from 'lucide-react';

const Layout: React.FC = () => {
  const handleLogout = () => {
    // Assuming backend handles logout via a route or cookie clearance
    document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
      <nav className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <Home className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </NavLink>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;