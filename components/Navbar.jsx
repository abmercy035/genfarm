'use client';

import React from 'react';
import { Egg, Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function Navbar({ title = "General Farm Ltd Overview" }) {
  const handleSeed = async () => {
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      alert(data.message || 'Seed action completed');
      window.location.reload();
    } catch (err) {
      alert('Seed failed: ' + err.message);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSeed}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          title="Seed initial demo data if database is empty"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Seed Demo Data</span>
        </button>

        <Link
          href="/production"
          className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Quick Shift Entry</span>
        </Link>
      </div>
    </header>
  );
}
