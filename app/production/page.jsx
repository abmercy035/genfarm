'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { Egg, CheckCircle2, AlertTriangle, User } from 'lucide-react';

export default function DailyProductionPage() {
  const [pens, setPens] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    penId: '',
    goodEggs: '',
    damagedEggs: '',
    mortality: '',
    culls: '',
    loggedBy: 'Farm Attendant',
    notes: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [pensRes, logsRes] = await Promise.all([
        fetch('/api/pens'),
        fetch('/api/logs/production')
      ]);
      const pensData = await pensRes.json();
      const logsData = await logsRes.json();

      if (pensData.success) {
        setPens(pensData.data);
        if (pensData.data.length > 0 && !form.penId) {
          setForm((prev) => ({ ...prev, penId: pensData.data[0]._id }));
        }
      }
      if (logsData.success) setLogs(logsData.data);
    } catch (err) {
      console.error('Failed to load production data', err);
    }
  };

  // Real-time calculated metric for previewing crates
  const autoCrates = useMemo(() => {
    const good = Number(form.goodEggs) || 0;
    const bad = Number(form.damagedEggs) || 0;
    const total = good + bad;
    const crates = Math.floor(total / 30);
    const loose = total % 30;
    return { total, crates, loose };
  }, [form.goodEggs, form.damagedEggs]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.penId) return alert('Please select a pen.');
    if (form.goodEggs === '') return alert('Please enter good egg count.');

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/logs/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setForm((prev) => ({
          ...prev,
          goodEggs: '',
          damagedEggs: '',
          mortality: '',
          culls: '',
          notes: ''
        }));
        fetchInitialData();
        alert('Shift production log saved successfully!');
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Navbar title="Daily Production & Egg Harvest Logging" />

      <main className="p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Shift Input Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <Egg className="w-5 h-5 text-amber-600" />
                <span>Daily Shift Entry Form</span>
              </h3>
              <p className="text-xs text-slate-500">
                Optimized high-contrast form for quick data entry in coops.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Pen Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Housing Pen</label>
                <select
                  value={form.penId}
                  onChange={(e) => setForm({ ...form, penId: e.target.value })}
                  className="w-full h-12 px-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-sm text-slate-800"
                >
                  {pens.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.current_bird_count} live birds)
                    </option>
                  ))}
                </select>
              </div>

              {/* Egg Pick Section */}
              <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl space-y-3">
                <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px]">
                  Egg Harvest Entry
                </span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Good Eggs (pcs)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      required
                      placeholder="0"
                      value={form.goodEggs}
                      onChange={(e) => setForm({ ...form, goodEggs: e.target.value })}
                      className="w-full h-12 text-center text-lg font-bold border border-amber-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Cracked / Bad (pcs)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      value={form.damagedEggs}
                      onChange={(e) => setForm({ ...form, damagedEggs: e.target.value })}
                      className="w-full h-12 text-center text-lg font-bold border border-amber-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Auto Calculated Crates Box */}
                <div className="bg-white p-3 rounded-lg border border-amber-200 flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-semibold">Auto-Converted Yield:</span>
                  <span className="font-extrabold text-amber-900">
                    {autoCrates.crates} crates + {autoCrates.loose} loose
                    <span className="text-[10px] text-slate-400 font-normal ml-1">({autoCrates.total} pcs)</span>
                  </span>
                </div>
              </div>

              {/* Mortality Section */}
              <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-xl space-y-3">
                <span className="font-bold text-rose-900 uppercase tracking-wider text-[10px]">
                  Bird Mortality & Culls
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Dead Birds</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      value={form.mortality}
                      onChange={(e) => setForm({ ...form, mortality: e.target.value })}
                      className="w-full h-12 text-center text-lg font-bold border border-rose-300 rounded-xl bg-white focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Culled / Sick</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      value={form.culls}
                      onChange={(e) => setForm({ ...form, culls: e.target.value })}
                      className="w-full h-12 text-center text-lg font-bold border border-rose-300 rounded-xl bg-white focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Attendant & Notes */}
              <div>
                <label className="block font-semibold mb-1">Logged By</label>
                <input
                  type="text"
                  value={form.loggedBy}
                  onChange={(e) => setForm({ ...form, loggedBy: e.target.value })}
                  className="w-full h-10 px-3 border border-slate-300 rounded-xl bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Shift Notes / Observations</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Temperature elevated, feed replenished."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-extrabold text-base rounded-xl transition-all shadow-md disabled:bg-slate-400"
              >
                {isSubmitting ? 'Saving Record...' : 'Submit Shift Record'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Historical Log Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Shift Production Log History ({logs.length})</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Pen</th>
                    <th className="pb-3">Harvest Yield</th>
                    <th className="pb-3">Crate Breakdown</th>
                    <th className="pb-3">Mortality</th>
                    <th className="pb-3">HDEP %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50">
                      <td className="py-3 font-semibold text-slate-900">
                        {new Date(log.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 font-bold text-slate-800">{log.penId?.name || 'Pen'}</td>
                      <td className="py-3 font-bold text-emerald-700">{log.goodEggs} pcs</td>
                      <td className="py-3">
                        <span className="px-2 py-1 bg-amber-50 text-amber-800 font-bold border border-amber-200 rounded-lg">
                          {log.crates} crates + {log.looseEggs} loose
                        </span>
                      </td>
                      <td className="py-3 font-bold text-rose-600">{log.mortality + log.culls} dead</td>
                      <td className="py-3 font-extrabold text-blue-700">{log.hdepPercentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
