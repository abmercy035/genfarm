'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Wheat, Droplet, Plus } from 'lucide-react';

export default function DailyConsumptionPage() {
  const [pens, setPens] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    penId: '',
    feedType: 'Layer Mash 25kg',
    bagsConsumed: '',
    bagWeightKg: 25,
    waterLiters: '',
    medicationAdministered: '',
    loggedBy: 'Farm Attendant',
    notes: ''
  });

  const [feedCatalog, setFeedCatalog] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [pensRes, logsRes, settingsRes] = await Promise.all([
        fetch('/api/pens'),
        fetch('/api/logs/consumption'),
        fetch('/api/settings')
      ]);
      const pensData = await pensRes.json();
      const logsData = await logsRes.json();
      const settingsData = await settingsRes.json();

      if (pensData.success) {
        setPens(pensData.data);
        if (pensData.data.length > 0 && !form.penId) {
          setForm((prev) => ({ ...prev, penId: pensData.data[0]._id }));
        }
      }
      if (logsData.success) setLogs(logsData.data);
      if (settingsData.success && settingsData.data.feeds) {
        setFeedCatalog(settingsData.data.feeds);
        if (settingsData.data.feeds.length > 0) {
          setForm((prev) => ({ 
            ...prev, 
            feedType: settingsData.data.feeds[0].name,
            bagWeightKg: settingsData.data.feeds[0].bagWeightKg || 25 
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load consumption data', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.penId || form.bagsConsumed === '') return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/logs/consumption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setForm((prev) => ({
          ...prev,
          bagsConsumed: '',
          waterLiters: '',
          medicationAdministered: '',
          notes: ''
        }));
        fetchInitialData();
      }
    } catch (err) {
      console.error('Consumption submit error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col pt-14 lg:pt-0">
      <Navbar title="Daily Feed & Water Consumption Log" />

      <main className="p-3 sm:p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <Wheat className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>Log Feed & Supplies</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Record bags dispensed per pen flock daily.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Housing Pen</label>
                <select
                  value={form.penId}
                  onChange={(e) => setForm({ ...form, penId: e.target.value })}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-xs sm:text-sm text-slate-800"
                >
                  {pens.filter(p => p.current_bird_count > 0).length > 0 ? (
                    pens.filter(p => p.current_bird_count > 0).map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.current_bird_count} birds)
                      </option>
                    ))
                  ) : (
                    <option value="">-- No Occupied Pens Available --</option>
                  )}
                </select>
                {pens.filter(p => p.current_bird_count > 0).length === 0 && (
                  <p className="text-[11px] text-amber-700 font-semibold mt-1">
                    All pens are empty. You must add and assign a flock to a pen before logging feed.
                  </p>
                )}
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl space-y-3">
                <span className="font-bold text-emerald-900 uppercase tracking-wider text-[10px]">
                  Feed Details
                </span>

                <div>
                  <label className="block font-medium text-slate-600 mb-1">Feed Formula / Type</label>
                  <select
                    value={form.feedType}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      const selectedFeed = feedCatalog.find(f => f.name === selectedName);
                      setForm({
                        ...form,
                        feedType: selectedName,
                        bagWeightKg: selectedFeed ? selectedFeed.bagWeightKg : form.bagWeightKg
                      });
                    }}
                    className="w-full h-10 px-3 border border-emerald-300 rounded-xl bg-white text-xs font-semibold"
                  >
                    {feedCatalog.length > 0 ? (
                      feedCatalog.map((f, i) => (
                        <option key={i} value={f.name}>
                          {f.name} ({f.bagWeightKg}kg • ₦{f.pricePerBag?.toLocaleString()}/bag)
                        </option>
                      ))
                    ) : (
                      <option value="Layer Mash 25kg">Layer Mash (25kg bags)</option>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Bags Opened</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      required
                      placeholder="0"
                      value={form.bagsConsumed}
                      onChange={(e) => setForm({ ...form, bagsConsumed: e.target.value })}
                      className="w-full h-11 text-center text-base font-bold border border-emerald-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Bag Weight (kg)</label>
                    <input
                      type="number"
                      value={form.bagWeightKg}
                      onChange={(e) => setForm({ ...form, bagWeightKg: e.target.value })}
                      className="w-full h-11 text-center text-base font-bold border border-emerald-300 rounded-xl bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Water & Medication */}
              <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-xl space-y-3">
                <span className="font-bold text-blue-900 uppercase tracking-wider text-[10px]">
                  Water & Medication
                </span>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Water (Liters)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={form.waterLiters}
                      onChange={(e) => setForm({ ...form, waterLiters: e.target.value })}
                      className="w-full h-10 text-center font-bold border border-blue-300 rounded-xl bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Medication / Vaccine</label>
                    <input
                      type="text"
                      placeholder="e.g. Vitamins"
                      value={form.medicationAdministered}
                      onChange={(e) => setForm({ ...form, medicationAdministered: e.target.value })}
                      className="w-full h-10 px-2.5 border border-blue-300 rounded-xl bg-white text-xs"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm rounded-xl transition-all shadow-xs cursor-pointer"
              >
                {isSubmitting ? 'Saving Log...' : 'Record Consumption'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Table / Mobile Card List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Feed Usage History ({logs.length})</h3>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Pen</th>
                    <th className="pb-3">Feed Type</th>
                    <th className="pb-3">Bags Consumed</th>
                    <th className="pb-3">Total Weight</th>
                    <th className="pb-3">Water</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50">
                      <td className="py-3 font-semibold text-slate-900">
                        {new Date(log.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 font-bold text-slate-800">{log.penId?.name || 'Pen'}</td>
                      <td className="py-3">{log.feedType}</td>
                      <td className="py-3 font-bold text-emerald-800">{log.bagsConsumed} bags</td>
                      <td className="py-3 font-bold text-slate-900">{log.totalWeightKg} kg</td>
                      <td className="py-3 text-blue-700 font-medium">{log.waterLiters || 0} L</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {logs.map((log) => (
                <div key={log._id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-start border-b border-slate-200/60 pb-2">
                    <div>
                      <h4 className="font-bold text-slate-900">{log.penId?.name || 'Pen Enclosure'}</h4>
                      <p className="text-[10px] text-slate-400">{new Date(log.date).toLocaleDateString()}</p>
                    </div>
                    <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                      {log.bagsConsumed} bags ({log.totalWeightKg} kg)
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px] pt-1">
                    <span className="text-slate-600 font-medium">{log.feedType}</span>
                    {log.waterLiters > 0 && (
                      <span className="text-blue-700 font-bold text-[10px]">
                        {log.waterLiters} L Water
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
