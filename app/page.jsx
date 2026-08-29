'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import StatCard from '@/components/StatCard';
import PenGrid from '@/components/PenGrid';
import { Egg, Users, Wheat, AlertTriangle, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  const summary = stats?.summary || {
    totalLiveBirds: 0,
    todayCrates: 0,
    todayLoose: 0,
    todayGoodEggs: 0,
    todayDamagedEggs: 0,
    todayMortality: 0,
    todayFeedBags: 0,
    todayFeedKg: 0,
    avgHdep: 0
  };

  return (
    <div className="flex-1 flex flex-col">
      <Navbar title="General Farm Ltd — Executive Dashboard" />

      <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Top KPI Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Live Birds"
            value={summary.totalLiveBirds.toLocaleString()}
            subtitle={`${stats?.summary?.totalPens || 0} Housing Pen Enclosures`}
            icon={Users}
            color="emerald"
          />
          <StatCard
            title="Today's Harvest"
            value={`${summary.todayCrates} Crates + ${summary.todayLoose}`}
            subtitle={`${summary.todayGoodEggs} Good • ${summary.todayDamagedEggs} Damaged`}
            icon={Egg}
            color="amber"
          />
          <StatCard
            title="Hen-Day Yield (HDEP)"
            value={`${summary.avgHdep}%`}
            subtitle="Target Benchmark: 85.0%"
            icon={TrendingUp}
            color="blue"
          />
          <StatCard
            title="Today's Mortality"
            value={`${summary.todayMortality} Birds`}
            subtitle="Recorded across all shifts"
            icon={AlertTriangle}
            color="rose"
          />
        </div>

        {/* Quick Action & Shift Status Banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Shift Operations</span>
            <h3 className="text-xl font-extrabold">Ready to log today's farm shift?</h3>
            <p className="text-xs text-emerald-100 max-w-xl">
              Farm hands can easily punch in egg collection, bird losses, and feed bags dispensed. Crates are automatically calculated.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/production"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <Egg className="w-4 h-4" />
              <span>Log Production</span>
            </Link>
            <Link
              href="/consumption"
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-2"
            >
              <Wheat className="w-4 h-4" />
              <span>Log Feed Usage</span>
            </Link>
          </div>
        </div>

        {/* Physical Pens Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Housing Pens & Live Occupancy</h3>
              <p className="text-xs text-slate-500">Real-time bird allocation and status across coops.</p>
            </div>
            <Link href="/pens" className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
              Manage Pens <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <PenGrid pens={stats?.pensSummary || []} />
        </div>

        {/* Recent Daily Logs Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Recent Daily Production Logs</h3>
              <p className="text-xs text-slate-500">Latest egg collection records submitted by shift workers.</p>
            </div>
            <Link href="/production" className="text-xs font-bold text-emerald-700 hover:underline">
              View All Logs
            </Link>
          </div>

          {stats?.recentLogs && stats.recentLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Pen Enclosure</th>
                    <th className="pb-3">Good Eggs</th>
                    <th className="pb-3">Crates + Loose</th>
                    <th className="pb-3">Damaged</th>
                    <th className="pb-3">Mortality</th>
                    <th className="pb-3">HDEP %</th>
                    <th className="pb-3">Logged By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {stats.recentLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50">
                      <td className="py-3 font-semibold text-slate-900">
                        {new Date(log.date).toLocaleDateString()}
                      </td>
                      <td className="py-3">{log.penId?.name || 'Pen'}</td>
                      <td className="py-3 font-bold text-emerald-700">{log.goodEggs} pcs</td>
                      <td className="py-3">
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {log.crates} crates + {log.looseEggs} loose
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">{log.damagedEggs} bad</td>
                      <td className="py-3 font-bold text-rose-600">{log.mortality + log.culls} dead</td>
                      <td className="py-3 font-extrabold text-blue-700">{log.hdepPercentage}%</td>
                      <td className="py-3 text-slate-500">{log.loggedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              No production records found today. Click "Seed Demo Data" above or submit a new shift record.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
