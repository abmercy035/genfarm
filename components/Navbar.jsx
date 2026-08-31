'use client';

import React, { useState } from 'react';
import { Egg, Plus, Download, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar({ title = "General Farm Ltd Overview" }) {
  const pathname = usePathname();
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Hide header on login page
  if (pathname === '/login') {
    return null;
  }

  const handleDownloadCsv = (type) => {
    setShowExportMenu(false);
    window.open(`/api/export/csv?type=${type}`, '_blank');
  };

  return (
    <header className="h-14 lg:h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-14 lg:top-0 z-20 shadow-xs">
      <div className="flex items-center gap-3">
        <h2 className="text-sm sm:text-lg font-bold text-slate-800 tracking-tight truncate max-w-[200px] sm:max-w-none">{title}</h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative">
        {/* Spreadsheet Export Button */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] sm:text-xs rounded-xl transition-all cursor-pointer border border-slate-200"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" />
            <span className="hidden sm:inline">Export Spreadsheet</span>
            <span className="sm:hidden">Excel</span>
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-1.5 text-xs font-semibold space-y-1">
              <button
                onClick={() => handleDownloadCsv('production')}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 rounded-lg flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>Production Logs (.csv)</span>
              </button>
              <button
                onClick={() => handleDownloadCsv('consumption')}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 rounded-lg flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-600" />
                <span>Feed Logs (.csv)</span>
              </button>
              <button
                onClick={() => handleDownloadCsv('inventory')}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 rounded-lg flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Pens & Flocks (.csv)</span>
              </button>
            </div>
          )}
        </div>

        <Link
          href="/production"
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[11px] sm:text-xs rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Quick Shift Entry</span>
          <span className="sm:hidden">Entry</span>
        </Link>
      </div>
    </header>
  );
}
