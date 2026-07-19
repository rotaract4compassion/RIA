import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../store/adminAuth';

const navItems = [
  { to: '/admin', label: 'Overview', icon: '📊', end: true },
  { to: '/admin/projects', label: 'Projects', icon: '📋' },
  { to: '/admin/users', label: 'Users', icon: '👥' },
  { to: '/admin/admins', label: 'Admins', icon: '🔑' },
  { to: '/admin/suggestions', label: 'Suggestions', icon: '💬' },
  { to: '/admin/broadcasts', label: 'Broadcasts', icon: '📣' },
];

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/admin/login');
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-100 flex flex-col
        transform transition-transform duration-200
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <img src="/icons/ria-app-icon-whitebg-192.png" alt="Ria" className="w-8 h-8 rounded-lg" />
          <div>
            <p className="font-bold text-gray-900 text-sm">Ria Admin</p>
            <p className="text-xs text-gray-400 truncate max-w-[120px]">{admin?.name}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
          {navItems.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Admin info + logout */}
        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
              {admin?.name?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">{admin?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{admin?.scope} admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-xs font-medium text-red-500 py-1 px-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-500"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <p className="font-bold text-gray-900 text-sm">Ria Admin</p>
          <div className="w-9" />
        </div>

        {/* Page */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
