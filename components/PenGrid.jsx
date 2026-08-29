import React from 'react';
import { Home, Users, Activity } from 'lucide-react';
import Link from 'next/link';

export default function PenGrid({ pens = [] }) {
  if (!pens || pens.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <Home className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h4 className="font-bold text-slate-700">No Pen Enclosures Found</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
          Add your physical pens and coop structures to start logging live bird counts and daily egg collection.
        </p>
        <Link
          href="/pens"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white font-semibold text-xs rounded-xl"
        >
          Create First Pen
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 rounded-full">Active</span>;
      case 'quarantine':
        return <span className="px-2.5 py-1 text-[11px] font-bold bg-rose-100 text-rose-800 rounded-full">Quarantine</span>;
      default:
        return <span className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-700 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {pens.map((pen) => {
        const occupancyPct = Math.round((pen.current_bird_count / pen.capacity) * 100) || 0;

        return (
          <div key={pen._id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-emerald-300 transition-all">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{pen.name}</h4>
                <p className="text-xs text-slate-500">{pen.location} • {pen.type}</p>
              </div>
              {getStatusBadge(pen.status)}
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  Live Birds
                </span>
                <span className="text-slate-900">{pen.current_bird_count} / {pen.capacity}</span>
              </div>

              {/* Occupancy bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${occupancyPct > 90 ? 'bg-amber-500' : 'bg-emerald-600'}`}
                  style={{ width: `${Math.min(100, occupancyPct)}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                <span>Occupancy: {occupancyPct}%</span>
                <span>{pen.flockId?.name || 'Unassigned Flock'}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
