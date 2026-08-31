'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { 
  TrendingUp, 
  DollarSign, 
  Egg, 
  Wheat, 
  Users, 
  Receipt, 
  PieChart, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar 
} from 'recharts';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics/financial');
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error('Failed to load financial analytics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex-1 flex flex-col pt-14 lg:pt-0">
        <Navbar title="Financial Analytics & P&L Dashboard" />
        <div className="p-8 text-center text-slate-400 text-xs">Loading real-time P&L analytics...</div>
      </div>
    );
  }

  const { summary, chartData } = data;

  return (
    <div className="flex-1 flex flex-col pt-14 lg:pt-0">
      <Navbar title="Real-Time Financial Analytics & P&L Ledger" />

      <main className="p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>Income & Expense Metrics (Real-Time P&L)</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Live automated calculations based on harvest logs, feed consumption, payroll, and taxes.
            </p>
          </div>

          <button
            onClick={fetchAnalytics}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Refresh Metrics
          </button>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Total Egg Revenue</span>
            <div className="flex justify-between items-center">
              <h3 className="text-xl sm:text-2xl font-black text-emerald-700">₦{(summary?.totalGrossRevenue || 0).toLocaleString()}</h3>
              <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                <ArrowUpRight className="w-5 h-5" />
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Commercial sales ledger total</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Feed Expenses</span>
            <div className="flex justify-between items-center">
              <h3 className="text-xl sm:text-2xl font-black text-rose-600">₦{(summary?.totalFeedCost || 0).toLocaleString()}</h3>
              <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <ArrowDownRight className="w-5 h-5" />
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Posted operating vouchers</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Payroll & Overhead</span>
            <div className="flex justify-between items-center">
              <h3 className="text-xl sm:text-2xl font-black text-amber-700">₦{(summary?.totalMonthlyPayroll || 0).toLocaleString()}</h3>
              <span className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                <Users className="w-5 h-5" />
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Monthly staff salary list</p>
          </div>

          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xs space-y-2 border border-slate-800">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Net Operating Profit</span>
            <div className="flex justify-between items-center">
              <h3 className={`text-xl sm:text-2xl font-black ${(summary?.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₦{(summary?.netProfit || 0).toLocaleString()}
              </h3>
              <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <Receipt className="w-5 h-5" />
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Est. Tax: ₦{(summary?.estTax || 0).toLocaleString()} (7.5%)</p>
          </div>
        </div>

        {/* Real-Time Interactive Revenue vs Expense Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-700" />
                <span>Revenue vs Expense Real-Time Trend</span>
              </h3>
              <p className="text-[11px] text-slate-500">Daily sales income contrasted against operational costs.</p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#15803d" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#15803d" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value) => [`₦${Number(value).toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" name="Egg Sales (₦)" stroke="#15803d" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expenses" name="Expenses (₦)" stroke="#e11d48" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Breakdown Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Income & Expense Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-slate-400 font-semibold uppercase">
                  <th className="pb-3">Financial Category</th>
                  <th className="pb-3">Data Inputs / Volume</th>
                  <th className="pb-3 text-right">Amount (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr>
                  <td className="py-3 font-bold text-emerald-800">Total Actual Sales Invoices</td>
                  <td className="py-3">Posted Commercial Sales</td>
                  <td className="py-3 text-right font-extrabold text-emerald-800">
                    ₦{summary.totalGrossRevenue.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-rose-600">Operating Expenses (Feed, Meds, Fuel)</td>
                  <td className="py-3">Posted Vouchers</td>
                  <td className="py-3 text-right font-extrabold text-rose-600">
                    - ₦{summary.totalFeedCost.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-slate-900">Monthly Staff Payroll Overhead</td>
                  <td className="py-3">Staff Salary Ledger</td>
                  <td className="py-3 text-right font-extrabold text-slate-900">
                    - ₦{summary.totalMonthlyPayroll.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-slate-500">Tax Provision (7.5%)</td>
                  <td className="py-3">Estimated Corporate Tax</td>
                  <td className="py-3 text-right font-bold text-slate-500">
                    - ₦{summary.estTax.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
