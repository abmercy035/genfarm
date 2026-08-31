import React from 'react';
import { Home, Users, Layers, AlertCircle, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default function PenGrid({ pens = [] }) {
  if (!pens || pens.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
        <Home className="w-10 h-10 text-emerald-700/40 mx-auto mb-3" />
        <h4 className="font-extrabold text-slate-800 text-sm">No Pen Enclosures Configured</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
          Set up housing pens and coops to manage live bird counts, capacity utilization, and flock assignments.
        </p>
        <Link
          href="/pens"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
        >
          <span>Create Housing Pen</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status, birdCount) => {
    if (birdCount === 0) {
      return (
        <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 rounded-md">
          Empty
        </span>
      );
    }

    switch (status) {
      case 'active':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-md">
            Active Housed
          </span>
        );
      case 'quarantine':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200/80 rounded-md">
            Quarantine
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 rounded-md">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {pens.map((pen) => {
        const birdCount = pen.current_bird_count || 0;
        const capacity = pen.capacity || 1;
        const occupancyPct = Math.min(100, Math.round((birdCount / capacity) * 100));

        const isFull = birdCount >= capacity;
        const isEmpty = birdCount === 0;

        return (
          <div
            key={pen._id}
            className={`group bg-white rounded-2xl border transition-all duration-200 p-4 space-y-3 shadow-xs hover:shadow-md ${
              isFull
                ? 'border-amber-300 hover:border-amber-400 bg-amber-50/20'
                : isEmpty
                ? 'border-slate-200 hover:border-slate-300'
                : 'border-slate-200 hover:border-emerald-500/80'
            }`}
          >
            {/* Header: Name, Location & Status Pill */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {pen.type || 'Layer House'}
                </span>
                <h4 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-emerald-800 transition-colors">
                  {pen.name}
                </h4>
                <p className="text-[11px] text-slate-500 font-semibold">{pen.location || 'Main Complex'}</p>
              </div>
              {getStatusBadge(pen.status, birdCount)}
            </div>

            {/* Middle Metric Stats */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Live Birds</span>
                <span className="font-black text-slate-900 text-sm">{birdCount.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400"> / {capacity.toLocaleString()}</span>
              </div>
              <div className="text-right border-l border-slate-200 pl-2">
                <span className="text-[10px] text-slate-400 font-bold block">Occupancy Rate</span>
                <span
                  className={`font-black text-sm ${
                    isFull ? 'text-amber-700' : isEmpty ? 'text-slate-400' : 'text-emerald-700'
                  }`}
                >
                  {occupancyPct}%
                </span>
              </div>
            </div>

            {/* Occupancy Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isFull
                      ? 'bg-amber-500'
                      : occupancyPct > 75
                      ? 'bg-emerald-600'
                      : occupancyPct > 0
                      ? 'bg-emerald-500'
                      : 'bg-slate-300'
                  }`}
                  style={{ width: `${occupancyPct}%` }}
                />
              </div>
            </div>

            {/* Footer: Assigned Flock Info */}
            <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {pen.registeredFlocksCount !== undefined
                    ? `${pen.registeredFlocksCount} Flock Batches`
                    : pen.flockId?.name || (isEmpty ? 'Unassigned' : 'Assigned Flock')}
                </span>
              </span>

              <Link
                href="/pens"
                className="text-emerald-700 font-bold text-[10px] uppercase tracking-wide hover:underline"
              >
                Details →
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
