'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { DollarSign, Save, Plus, Trash2, Shield, Wheat, Pill, Users, Tag, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function PricingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
        router.replace('/');
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  const [errorMessage, setErrorMessage] = useState('');

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setSaveSuccess(false);
      setErrorMessage('');

      const token = Cookies.get('genfarm_token');
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      const data = await res.json();

      if (data.success) {
        setSettings(data.data);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setErrorMessage(data.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Failed to save settings', err);
      setErrorMessage('An unexpected network error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper additions
  const addFeedItem = () => {
    setSettings((prev) => ({
      ...prev,
      feeds: [...prev.feeds, { name: 'New Feed 25kg', bagWeightKg: 25, pricePerBag: 12000, inStockBags: 50 }]
    }));
  };

  const removeFeedItem = (index) => {
    setSettings((prev) => ({
      ...prev,
      feeds: prev.feeds.filter((_, i) => i !== index)
    }));
  };

  const addMedicationItem = () => {
    setSettings((prev) => ({
      ...prev,
      medications: [...prev.medications, { name: 'New Vaccine / Meds', unitPrice: 3000, inStockUnits: 20 }]
    }));
  };

  const removeMedicationItem = (index) => {
    setSettings((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const addValuationItem = () => {
    setSettings((prev) => ({
      ...prev,
      birdValuations: [...prev.birdValuations, { type: 'New Bird Category', unitValue: 3000 }]
    }));
  };

  const removeValuationItem = (index) => {
    setSettings((prev) => ({
      ...prev,
      birdValuations: prev.birdValuations.filter((_, i) => i !== index)
    }));
  };

  const addPayrollItem = () => {
    setSettings((prev) => ({
      ...prev,
      staffPayroll: [...prev.staffPayroll, { staffName: 'Staff Member', roleTitle: 'Worker', monthlySalary: 75000 }]
    }));
  };

  const removePayrollItem = (index) => {
    setSettings((prev) => ({
      ...prev,
      staffPayroll: prev.staffPayroll.filter((_, i) => i !== index)
    }));
  };

  if (loading || !settings) {
    return (
      <div className="flex-1 flex flex-col pt-14 lg:pt-0">
        <Navbar title="Pricing & Unit Cost Catalog" />
        <div className="p-8 text-center text-slate-400 text-xs">Loading farm unit pricing configuration...</div>
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <div className="flex-1 flex flex-col pt-14 lg:pt-0">
      <Navbar title="Pricing, Unit Costs & Payroll Catalog" />

      <main className="p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>Farm Unit Cost & Catalog Settings</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Set official egg prices, feed formulas, medication costs, bird rates, and confidential payroll.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:bg-slate-400"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Unit Pricing'}</span>
            </button>
          )}
        </div>

        {saveSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-emerald-800 font-bold text-xs flex items-center gap-2">
            <span>✓ Unit pricing & feed catalog saved successfully! All dropdowns have been updated.</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-rose-800 font-bold text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Section 1: Egg Harvest Pricing */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base border-b pb-2 flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-600" />
              <span>1. Egg Harvest Official Market Selling Prices (₦)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-600 mb-1">1 Single Good Egg (₦)</label>
                <input
                  type="number"
                  value={settings.price_single_egg === '' ? '' : settings.price_single_egg}
                  onChange={(e) => setSettings({ ...settings, price_single_egg: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full h-10 px-3 border border-slate-300 rounded-xl font-extrabold text-amber-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">1 Full Crate (30 Good Eggs) (₦)</label>
                <input
                  type="number"
                  value={settings.price_crate_good === '' ? '' : settings.price_crate_good}
                  onChange={(e) => setSettings({ ...settings, price_crate_good: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full h-10 px-3 border border-slate-300 rounded-xl font-extrabold text-emerald-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">1 Single Cracked Egg (₦)</label>
                <input
                  type="number"
                  value={settings.price_single_cracked === '' ? '' : settings.price_single_cracked}
                  onChange={(e) => setSettings({ ...settings, price_single_cracked: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full h-10 px-3 border border-slate-300 rounded-xl font-bold text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">1 Crate of Cracked Eggs (₦)</label>
                <input
                  type="number"
                  value={settings.price_crate_cracked === '' ? '' : settings.price_crate_cracked}
                  onChange={(e) => setSettings({ ...settings, price_crate_cracked: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full h-10 px-3 border border-slate-300 rounded-xl font-bold text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Default Pen Shed/Structure Value (₦)</label>
                <input
                  type="number"
                  value={settings.defaultPenStructureValue === '' ? '' : settings.defaultPenStructureValue}
                  onChange={(e) => setSettings({ ...settings, defaultPenStructureValue: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full h-10 px-3 border border-emerald-300 bg-emerald-50/50 rounded-xl font-extrabold text-emerald-900"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Feed Catalog & Unit Pricing */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Wheat className="w-4 h-4 text-emerald-700" />
                <span>2. Feed Catalog & Stock Prices (Powers Consumption Form Dropdown)</span>
              </h3>
              {isAdmin && (
                <button
                  type="button"
                  onClick={addFeedItem}
                  className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-200 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Feed Formula</span>
                </button>
              )}
            </div>

            <div className="space-y-3 text-xs">
              {settings.feeds.map((feed, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="sm:col-span-4">
                    <label className="block font-semibold text-slate-600 mb-0.5">Feed Formula Name</label>
                    <input
                      type="text"
                      value={feed.name}
                      onChange={(e) => {
                        const updated = [...settings.feeds];
                        updated[index].name = e.target.value;
                        setSettings({ ...settings, feeds: updated });
                      }}
                      className="w-full h-9 px-3 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-600 mb-0.5">Bag Wt (kg)</label>
                    <input
                      type="number"
                      value={feed.bagWeightKg === '' ? '' : feed.bagWeightKg}
                      onChange={(e) => {
                        const updated = [...settings.feeds];
                        updated[index].bagWeightKg = e.target.value === '' ? '' : Number(e.target.value);
                        setSettings({ ...settings, feeds: updated });
                      }}
                      className="w-full h-9 px-3 border border-slate-300 rounded-lg text-center font-bold"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-semibold text-slate-600 mb-0.5">Price / Bag (₦)</label>
                    <input
                      type="number"
                      value={feed.pricePerBag === '' ? '' : feed.pricePerBag}
                      onChange={(e) => {
                        const updated = [...settings.feeds];
                        updated[index].pricePerBag = e.target.value === '' ? '' : Number(e.target.value);
                        setSettings({ ...settings, feeds: updated });
                      }}
                      className="w-full h-9 px-3 border border-slate-300 rounded-lg font-extrabold text-emerald-800"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-600 mb-0.5">In Stock (Bags)</label>
                    <input
                      type="number"
                      value={feed.inStockBags === '' ? '' : feed.inStockBags}
                      onChange={(e) => {
                        const updated = [...settings.feeds];
                        updated[index].inStockBags = e.target.value === '' ? '' : Number(e.target.value);
                        setSettings({ ...settings, feeds: updated });
                      }}
                      className="w-full h-9 px-3 border border-slate-300 rounded-lg text-center font-bold"
                    />
                  </div>

                  <div className="sm:col-span-1 text-right pt-2 sm:pt-0">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => removeFeedItem(index)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Remove Feed Formula"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Medication & Supplies Catalog */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Pill className="w-4 h-4 text-blue-700" />
                <span>3. Medication & Vaccines Catalog</span>
              </h3>
              {isAdmin && (
                <button
                  type="button"
                  onClick={addMedicationItem}
                  className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-lg border border-blue-200 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Medication</span>
                </button>
              )}
            </div>

            <div className="space-y-3 text-xs">
              {settings.medications.map((med, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="sm:col-span-6">
                    <label className="block font-semibold text-slate-600 mb-0.5">Medicine / Vaccine Name</label>
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => {
                        const updated = [...settings.medications];
                        updated[index].name = e.target.value;
                        setSettings({ ...settings, medications: updated });
                      }}
                      className="w-full h-9 px-3 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-semibold text-slate-600 mb-0.5">Unit Price (₦)</label>
                    <input
                      type="number"
                      value={med.unitPrice === '' ? '' : med.unitPrice}
                      onChange={(e) => {
                        const updated = [...settings.medications];
                        updated[index].unitPrice = e.target.value === '' ? '' : Number(e.target.value);
                        setSettings({ ...settings, medications: updated });
                      }}
                      className="w-full h-9 px-3 border border-slate-300 rounded-lg font-extrabold text-blue-800"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-600 mb-0.5">Stock (Units)</label>
                    <input
                      type="number"
                      value={med.inStockUnits === '' ? '' : med.inStockUnits}
                      onChange={(e) => {
                        const updated = [...settings.medications];
                        updated[index].inStockUnits = e.target.value === '' ? '' : Number(e.target.value);
                        setSettings({ ...settings, medications: updated });
                      }}
                      className="w-full h-9 px-3 border border-slate-300 rounded-lg text-center font-bold"
                    />
                  </div>

                  <div className="sm:col-span-1 text-right pt-2 sm:pt-0">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => removeMedicationItem(index)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Hen Replacement Valuation Rates */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-700" />
                <span>4. Bird Asset Valuation Rates (₦ per Bird)</span>
              </h3>
              {isAdmin && (
                <button
                  type="button"
                  onClick={addValuationItem}
                  className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs rounded-lg border border-purple-200 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Bird Rate</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {settings.birdValuations.map((bv, index) => (
                <div key={index} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-slate-600">Category / Breed</label>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => removeValuationItem(index)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={bv.type}
                    onChange={(e) => {
                      const updated = [...settings.birdValuations];
                      updated[index].type = e.target.value;
                      setSettings({ ...settings, birdValuations: updated });
                    }}
                    className="w-full h-8 px-2.5 border border-slate-300 rounded-lg font-bold"
                  />
                  <label className="block font-semibold text-slate-600 text-[10px]">Value / Bird (₦)</label>
                  <input
                    type="number"
                    value={bv.unitValue === '' ? '' : bv.unitValue}
                    onChange={(e) => {
                      const updated = [...settings.birdValuations];
                      updated[index].unitValue = e.target.value === '' ? '' : Number(e.target.value);
                      setSettings({ ...settings, birdValuations: updated });
                    }}
                    className="w-full h-8 px-2.5 border border-slate-300 rounded-lg font-extrabold text-purple-900"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Confidential Staff Payroll & Salaries */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 border-l-4 border-l-rose-500">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-rose-600" />
                  <span>5. Confidential Staff Payroll & Salaries (Admin Only)</span>
                </h3>
                <p className="text-[10px] text-slate-500">Only Admins can view or adjust payroll amounts.</p>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={addPayrollItem}
                  className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs rounded-lg border border-rose-200 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Staff Member</span>
                </button>
              )}
            </div>

            <div className="space-y-3 text-xs">
              {settings.staffPayroll.map((pay, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="sm:col-span-5">
                    <label className="block font-semibold text-slate-600 mb-0.5">Staff Name</label>
                    <input
                      type="text"
                      value={pay.staffName}
                      onChange={(e) => {
                        const updated = [...settings.staffPayroll];
                        updated[index].staffName = e.target.value;
                        setSettings({ ...settings, staffPayroll: updated });
                      }}
                      className="w-full h-9 px-3 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-semibold text-slate-600 mb-0.5">Role Title</label>
                    <input
                      type="text"
                      value={pay.roleTitle}
                      onChange={(e) => {
                        const updated = [...settings.staffPayroll];
                        updated[index].roleTitle = e.target.value;
                        setSettings({ ...settings, staffPayroll: updated });
                      }}
                      className="w-full h-9 px-3 border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-semibold text-slate-600 mb-0.5">Monthly Salary (₦)</label>
                    <input
                      type="number"
                      value={pay.monthlySalary === '' ? '' : pay.monthlySalary}
                      onChange={(e) => {
                        const updated = [...settings.staffPayroll];
                        updated[index].monthlySalary = e.target.value === '' ? '' : Number(e.target.value);
                        setSettings({ ...settings, staffPayroll: updated });
                      }}
                      className="w-full h-9 px-3 border border-slate-300 rounded-lg font-extrabold text-rose-800"
                    />
                  </div>

                  <div className="sm:col-span-1 text-right pt-2 sm:pt-0">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => removePayrollItem(index)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
