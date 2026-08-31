'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import StatCard from '@/components/StatCard';
import PenGrid from '@/components/PenGrid';
import { Egg, Users, Wheat, AlertTriangle, TrendingUp, ArrowRight, DollarSign, Calendar, Layers, Table, LineChart as LineChartIcon } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productionViewMode, setProductionViewMode] = useState('TABLE');

  const role = user?.role || 'WORKER';

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

  // Prepare chart data for Production Shift Logs
  const productionChartData = (stats?.recentLogs || []).slice().reverse().map((log) => ({
    name: `${log.penId?.name || 'Pen'} (${new Date(log.date).toLocaleDateString([], { month: 'numeric', day: 'numeric' })})`,
    goodEggs: log.goodEggs,
    damagedEggs: log.damagedEggs,
    hdep: log.hdepPercentage
  }));

  return (
    <div className="flex-1 flex flex-col pt-14 lg:pt-0">
      <Navbar title={`General Farm Ltd — ${role === 'SUPER_ADMIN' ? 'Executive Desk' : role === 'ADMIN' ? 'Operations' : 'Daily Shift Desk'}`} />

      <main className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full">
        {/* Role Account Header */}
        <div className="hidden bg-slate-900 text-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className={`px-2.5 py-1 rounded-lg font-black text-[10px] sm:text-xs uppercase tracking-wider ${
              role === 'SUPER_ADMIN' ? 'bg-rose-600 text-white' : role === 'ADMIN' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-200'
            }`}>
              {role.replace('_', ' ')}
            </span>
            <p className="text-xs text-slate-300 font-medium truncate max-w-xs sm:max-w-none">
              Welcome back, <span className="text-white font-bold">{user?.name}</span>
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
            System Status: <span className="text-emerald-400 font-bold">Online</span>
          </p>
        </div>

        {/* Top KPI Scorecards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Total Live Birds"
            value={summary.totalLiveBirds.toLocaleString()}
            subtitle={`${stats?.summary?.totalPens || 0} Housing Pens`}
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
            subtitle="Losses across all shifts"
            icon={AlertTriangle}
            color="rose"
          />
        </div>

        {/* Super Admin Executive Financial Card */}
        {role === 'SUPER_ADMIN' && (
          <div className="bg-slate-900 text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 border border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Financial Ledger</span>
                <h3 className="text-base sm:text-lg font-extrabold text-white">Daily Commercial Sales & P&L Ledger</h3>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-bold text-[10px] sm:text-xs rounded-full border border-emerald-500/30">
                Posted Sales Vouchers
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                <p className="text-[11px] text-slate-400 font-semibold uppercase">Actual Sales Inflow</p>
                <h4 className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
                  ₦{(summary.todaySalesRevenue || 0).toLocaleString()}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Commercial Sales Receipts</p>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                <p className="text-[11px] text-slate-400 font-semibold uppercase">Paid Operating Expenses</p>
                <h4 className="text-xl sm:text-2xl font-black text-rose-400 mt-1">
                  ₦{(summary.todayOperatingExpenses || 0).toLocaleString()}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Feed, Supplies & Payroll</p>
              </div>

              <div className="bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-800/60">
                <p className="text-[11px] text-emerald-300 font-semibold uppercase">Net Operating Cash Flow</p>
                <h4 className={`text-xl sm:text-2xl font-black mt-1 ${
                  (summary.todayNetProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  ₦{(summary.todayNetProfit || 0).toLocaleString()}
                </h4>
                <p className="text-[10px] text-emerald-200/70 mt-0.5">Actual Realized Profit</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Action Navigation Bar */}
        <div className="bg-emerald-800 text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Shift Action Desk</span>
            <h3 className="text-base sm:text-lg font-extrabold">Log Today's Production & Consumption</h3>
          </div>
          <div className="flex gap-2.5 w-full sm:w-auto">
            <Link
              href="/production"
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Egg className="w-4 h-4" />
              <span>Log Harvest</span>
            </Link>
            <Link
              href="/consumption"
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-900/60 hover:bg-emerald-900 text-white font-semibold text-xs rounded-xl border border-emerald-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Wheat className="w-4 h-4" />
              <span>Log Feed</span>
            </Link>
          </div>
        </div>

        {/* Physical Pens Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Housing Pens & Occupancy</h3>
              <p className="text-[11px] text-slate-500">Live bird distribution across enclosures.</p>
            </div>
            <Link href="/pens" className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
              Manage Pens <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <PenGrid pens={stats?.pensSummary || []} />
        </div>

        {/* Responsive Daily Production Log Table / Line Chart Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Recent Production Shift Logs</h3>
              <p className="text-[11px] text-slate-500">Latest egg harvests recorded by attendants.</p>
            </div>

            <div className="flex items-center gap-2">
              {/* Toggle Switch */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setProductionViewMode('TABLE')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    productionViewMode === 'TABLE'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProductionViewMode('CHART')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    productionViewMode === 'CHART'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LineChartIcon className="w-3.5 h-3.5" />
                  <span>Line Chart</span>
                </button>
              </div>

              <Link href="/production" className="text-xs font-bold text-emerald-700 hover:underline ml-2">
                View All
              </Link>
            </div>
          </div>

          {stats?.recentLogs && stats.recentLogs.length > 0 ? (
            productionViewMode === 'TABLE' ? (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Pen</th>
                        <th className="pb-3">Good Eggs</th>
                        <th className="pb-3">Yield Breakdown</th>
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
                          <td className="py-3 font-bold text-slate-800">{log.penId?.name || 'Pen'}</td>
                          <td className="py-3 font-bold text-emerald-700">{log.goodEggs} pcs</td>
                          <td className="py-3">
                            <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
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

                {/* Mobile Card List View */}
                <div className="md:hidden space-y-3">
                  {stats.recentLogs.map((log) => (
                    <div key={log._id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between items-start border-b border-slate-200/60 pb-2">
                        <div>
                          <h4 className="font-bold text-slate-900">{log.penId?.name || 'Pen Enclosure'}</h4>
                          <p className="text-[10px] text-slate-400">{new Date(log.date).toLocaleDateString()} • {log.loggedBy}</p>
                        </div>
                        <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {log.hdepPercentage}% HDEP
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div>
                          <span className="text-slate-500">Good Eggs:</span>
                          <p className="font-bold text-emerald-700">{log.goodEggs} pcs</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Cracked/Bad:</span>
                          <p className="font-bold text-slate-600">{log.damagedEggs} pcs</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                        <span className="px-2 py-1 bg-amber-100 text-amber-900 font-bold rounded-md text-[10px]">
                          {log.crates} crates + {log.looseEggs} loose
                        </span>
                        {log.mortality + log.culls > 0 && (
                          <span className="font-bold text-rose-600 text-[10px]">
                            {log.mortality + log.culls} dead
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* Line Chart Visual View */
              <div className="space-y-2 pt-2">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={productionChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ stroke: '#15803d', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                        wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const crates = Math.floor((data.goodEggs || 0) / 30);
                            const loose = (data.goodEggs || 0) % 30;
                            return (
                              <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl border border-slate-700 text-xs space-y-1 z-50">
                                <p className="font-extrabold text-amber-400 border-b border-slate-700 pb-1">
                                  {data.name}
                                </p>
                                <div className="space-y-0.5 pt-0.5">
                                  <p className="text-emerald-400 font-bold">
                                    Good Eggs: {data.goodEggs} pcs ({crates} crates + {loose} loose)
                                  </p>
                                  <p className="text-amber-400 font-bold">
                                    Damaged Eggs: {data.damagedEggs} pcs
                                  </p>
                                  <p className="text-blue-300 font-extrabold">
                                    HDEP Yield: {data.hdep}%
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="goodEggs"
                        name="Good Eggs (pcs)"
                        stroke="#15803d"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#15803d', cursor: 'pointer' }}
                        activeDot={{ r: 8, fill: '#15803d', stroke: '#ffffff', strokeWidth: 2.5, cursor: 'pointer' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="damagedEggs"
                        name="Damaged/Bad (pcs)"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        strokeDasharray="4 4"
                        dot={{ r: 4, fill: '#f59e0b', cursor: 'pointer' }}
                        activeDot={{ r: 7, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2, cursor: 'pointer' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-center text-[10px] text-slate-400 font-medium">
                  Showing Good Eggs (solid green) vs Damaged Eggs (dashed amber) trend lines.
                </p>
              </div>
            )
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              No production records logged today. Click "Log Harvest" above to submit a new shift record.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
