'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Home, 
  Egg, 
  Wheat, 
  Calculator, 
  ShieldCheck,
  LogOut,
  Users,
  Menu,
  X,
  Tag,
  TrendingUp,
  Landmark,
  Receipt
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Hide sidebar on login page
  if (pathname === '/login') {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, minRole: 'WORKER' },
    { name: 'Pens & Flocks', href: '/pens', icon: Home, minRole: 'WORKER' },
    { name: 'Daily Production', href: '/production', icon: Egg, minRole: 'WORKER' },
    { name: 'Daily Consumption', href: '/consumption', icon: Wheat, minRole: 'WORKER' },
    { name: 'Accountant Ledger', href: '/accountant', icon: Receipt, minRole: 'ADMIN' },
    { name: 'Predictive Calculator', href: '/forecasting', icon: Calculator, minRole: 'ADMIN' },
    { name: 'Pricing & Catalog', href: '/pricing', icon: Tag, minRole: 'ADMIN' },
    { name: 'Financial Analytics', href: '/analytics', icon: TrendingUp, minRole: 'ADMIN' },
    { name: 'Farm Valuation', href: '/valuation', icon: Landmark, minRole: 'ADMIN' },
    { name: 'User & Staff Control', href: '/users', icon: Users, minRole: 'SUPER_ADMIN' },
  ];

  const currentRole = user?.role || 'WORKER';

  const roleLevels = {
    WORKER: 1,
    ADMIN: 2,
    SUPER_ADMIN: 3
  };

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-emerald-800 text-white flex items-center justify-between px-4 z-40 shadow-md">
        <div className="flex items-center gap-2.5">
          <span className="font-extrabold text-sm tracking-wide">General Farm Ltd</span>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-white hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40"
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 
        flex flex-col justify-between shadow-sm z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div>
          {/* Brand Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100 bg-emerald-800 text-white justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="font-extrabold text-base leading-tight tracking-wide">General Farm Ltd</h1>
              </div>
            </div>
            
            <button onClick={() => setIsOpen(false)} className="lg:hidden text-white hover:text-emerald-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Account Info */}
          <div className="p-3.5 mx-3 mt-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 truncate">{user?.name || 'Logged User'}</span>
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
              currentRole === 'SUPER_ADMIN' 
                ? 'bg-rose-100 text-rose-800' 
                : currentRole === 'ADMIN'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-200 text-slate-700'
            }`}>
              {currentRole === 'SUPER_ADMIN' ? 'Admin' : currentRole === 'ADMIN' ? 'Moderator' : 'Worker'}
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5">
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Navigation
            </div>

            {navigation.map((item) => {
              const hasAccess = (roleLevels[currentRole] || 1) >= (roleLevels[item.minRole] || 1);
              if (!hasAccess) return null;

              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-sm border border-emerald-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Info & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              RBAC Active
            </span>
            <button 
              onClick={logout} 
              className="text-slate-400 hover:text-rose-600 cursor-pointer p-1 transition-colors flex items-center gap-1 font-semibold text-[11px]" 
              title="Sign Out"
            >
              <span>Logout</span>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
