"use client";

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export function Sidebar() {
  const { logout, hasRole } = useAuth();

  const allMenuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊', roles: 'Admin,Doctor,Receptionist' },
    { name: 'Patients', path: '/patients', icon: '👥', roles: 'Admin,Doctor,Receptionist' },
    { name: 'Appointments', path: '/appointments', icon: '📅', roles: 'Admin,Doctor,Receptionist' },
    { name: 'Medical Records', path: '/medical-records', icon: '📋', roles: 'Admin,Doctor' },
    { name: 'Prescriptions', path: '/prescriptions', icon: '💊', roles: 'Admin,Doctor' },
  ];

  const visibleMenuItems = allMenuItems.filter((item) => hasRole(item.roles));

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col shadow-sm z-20">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
          <span>🏥</span> EMR System
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {visibleMenuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
        >
          <span className="text-xl">🚪</span>
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
