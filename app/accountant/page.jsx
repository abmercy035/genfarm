'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { 
  Receipt, 
  DollarSign, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  CreditCard,
  Building2,
  FileSpreadsheet,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AccountantPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalExpenses: 0,
    pendingReceivables: 0,
    pendingPayables: 0,
    netCashFlow: 0
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTransaction, setEditingTransaction] = useState(null);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const handleSaveAdminAudit = async () => {
    if (!editingTransaction) return;
    try {
      const res = await fetch(`/api/accounting/transactions/${editingTransaction._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTransaction)
      });
      const data = await res.json();
      if (data.success) {
        setEditingTransaction(null);
        fetchTransactions();
      }
    } catch (err) {
      console.error('Failed to save audit changes', err);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!confirm('Are you sure you want to delete this ledger transaction entry?')) return;
    try {
      const res = await fetch(`/api/accounting/transactions/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setEditingTransaction(null);
        fetchTransactions();
      }
    } catch (err) {
      console.error('Failed to delete transaction', err);
    }
  };

  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const [settingsCatalog, setSettingsCatalog] = useState(null);

  const [form, setForm] = useState({
    type: 'SALE',
    category: 'Egg Sales (Good Crates)',
    amount: '',
    eggQuantityType: 'CRATES',
    eggQuantityValue: '',
    unitPriceSnapshot: 3500,
    paymentMethod: 'BANK_TRANSFER',
    paymentStatus: 'PAID',
    amountPaid: '',
    customerOrVendor: '',
    notes: '',
    date: new Date().toISOString().slice(0, 10)
  });

  useEffect(() => {
    fetchTransactions();
    fetchSettingsCatalog();
  }, []);

  const fetchSettingsCatalog = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.data) {
        setSettingsCatalog(data.data);
        // Set initial rate snapshot based on active settings
        const rate = data.data.price_crate_good || 3500;
        setForm((prev) => ({ ...prev, unitPriceSnapshot: rate }));
      }
    } catch (err) {
      console.error('Failed to load settings catalog', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/accounting/transactions');
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data);
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to load accounting data', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAutoAmount = (qtyType, qtyVal, category) => {
    const qty = Number(qtyVal || 0);
    
    // Resolve dynamic rates from active Admin Settings Catalog
    const priceCrateGood = settingsCatalog?.price_crate_good || 3500;
    const priceSingleGood = settingsCatalog?.price_single_egg || 120;
    const priceCrateCracked = settingsCatalog?.price_crate_cracked || 1800;
    const priceSingleCracked = settingsCatalog?.price_single_cracked || 60;

    let defaultRate = priceCrateGood;
    if (category.includes('Good Crates')) defaultRate = priceCrateGood;
    else if (category.includes('Loose Good')) defaultRate = priceSingleGood;
    else if (category.includes('Cracked Crates')) defaultRate = priceCrateCracked;
    else if (category.includes('Cracked Loose')) defaultRate = priceSingleCracked;

    if (qtyType === 'CRATES') {
      const benchmarkRate = category.includes('Loose') ? priceCrateGood : defaultRate;
      return { total: qty > 0 ? qty * benchmarkRate : '', benchmarkRate };
    } else if (qtyType === 'COUNT') {
      const benchmarkRate = category.includes('Crates') ? Math.round(defaultRate / 30) : defaultRate;
      return { total: qty > 0 ? qty * benchmarkRate : '', benchmarkRate };
    }
    return { total: '', benchmarkRate: defaultRate };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/accounting/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setForm({
          type: 'SALE',
          category: 'Egg Sales (Good Crates)',
          amount: '',
          eggQuantityType: 'CRATES',
          eggQuantityValue: '',
          unitPriceSnapshot: 3500,
          paymentMethod: 'BANK_TRANSFER',
          paymentStatus: 'PAID',
          amountPaid: '',
          customerOrVendor: '',
          notes: '',
          date: new Date().toISOString().slice(0, 10)
        });
        fetchTransactions();
      }
    } catch (err) {
      console.error('Transaction submit error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = {
    SALE: [
      'Egg Sales (Good Crates)',
      'Egg Sales (Loose Good)',
      'Egg Sales (Cracked Crates)',
      'Egg Sales (Cracked Loose)',
      'Cull / Spent Hen Sales',
      'Manure / Waste Sales'
    ],
    EXPENSE: [
      'Feed Purchase',
      'Medication & Vaccines',
      'Equipment & Maintenance',
      'Utilities & Fuel',
      'Other Operating Expense'
    ],
    PAYROLL_PAYMENT: ['Staff Salary & Wages'],
    OTHER_INCOME: ['Other Operating Income']
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesType = filterType === 'ALL' || t.type === filterType;
    const matchesSearch = 
      t.referenceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerOrVendor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex-1 flex flex-col pt-14 lg:pt-0">
        <Navbar title="General Farm Accountant Ledger" />
        <div className="p-8 text-center text-slate-400 text-xs">Loading accounting general ledger...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pt-14 lg:pt-0">
      <Navbar title="Chief Accountant Ledger & Sales Record Keeping" />

      <main className="p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Financial Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Total Cash Inflow</span>
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-emerald-700">₦{summary.totalSales.toLocaleString()}</h3>
              <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                <ArrowUpRight className="w-5 h-5" />
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Collected sales & income</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Total Expenses Paid</span>
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-rose-600">₦{summary.totalExpenses.toLocaleString()}</h3>
              <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <ArrowDownRight className="w-5 h-5" />
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Feed, payroll & supplies</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Pending Receivables</span>
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-amber-700">₦{summary.pendingReceivables.toLocaleString()}</h3>
              <span className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                <Clock className="w-5 h-5" />
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Uncollected client balances</p>
          </div>

          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-xs space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Net Cash Flow</span>
            <div className="flex justify-between items-center">
              <h3 className={`text-2xl font-black ${summary.netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₦{summary.netCashFlow.toLocaleString()}
              </h3>
              <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <Receipt className="w-5 h-5" />
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Real-time ledger net balance</p>
          </div>
        </div>

        {/* Main Grid - Left Form, Right General Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Record Transaction Form */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span>Log Financial Transaction</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Post new sales invoice or expense payment.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                {/* Transaction Type */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Transaction Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      const defaultCat = (categoryOptions[newType] || ['Other Operating Expense'])[0];
                      setForm({ ...form, type: newType, category: defaultCat });
                    }}
                    className="w-full h-10 px-3 border border-slate-300 rounded-xl font-bold bg-slate-50"
                  >
                    <option value="SALE">Sale / Income Entry</option>
                    <option value="EXPENSE">Operating Expense</option>
                    <option value="PAYROLL_PAYMENT">Staff Payroll Disbursement</option>
                    <option value="OTHER_INCOME">Other Income</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Financial Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      const { total, benchmarkRate } = calculateAutoAmount(form.eggQuantityType, form.eggQuantityValue, newCat);
                      setForm({
                        ...form,
                        category: newCat,
                        amount: total !== '' ? total : form.amount,
                        unitPriceSnapshot: benchmarkRate
                      });
                    }}
                    className="w-full h-10 px-3 border border-slate-300 rounded-xl font-semibold bg-white"
                  >
                    {(categoryOptions[form.type] || []).map((cat, i) => (
                      <option key={i} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Egg Sales Dual Quantity Input Mode */}
                {form.type === 'SALE' && form.category.includes('Egg') && (
                  <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-amber-900 text-[11px]">Egg Quantity Mode</span>
                      <div className="flex bg-white rounded-lg p-0.5 border border-amber-200">
                        <button
                          type="button"
                          onClick={() => {
                            const { total, benchmarkRate } = calculateAutoAmount('CRATES', form.eggQuantityValue, form.category);
                            setForm({
                              ...form,
                              eggQuantityType: 'CRATES',
                              amount: total !== '' ? total : form.amount,
                              unitPriceSnapshot: benchmarkRate
                            });
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            form.eggQuantityType === 'CRATES' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          By Crates
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const { total, benchmarkRate } = calculateAutoAmount('COUNT', form.eggQuantityValue, form.category);
                            setForm({
                              ...form,
                              eggQuantityType: 'COUNT',
                              amount: total !== '' ? total : form.amount,
                              unitPriceSnapshot: benchmarkRate
                            });
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            form.eggQuantityType === 'COUNT' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          By Egg Count
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {form.eggQuantityType === 'CRATES' ? 'Crates Count' : 'Loose Egg Count'}
                        </label>
                        <input
                          type="number"
                          placeholder={form.eggQuantityType === 'CRATES' ? 'e.g. 10 crates' : 'e.g. 300 eggs'}
                          value={form.eggQuantityValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            const { total, benchmarkRate } = calculateAutoAmount(form.eggQuantityType, val, form.category);
                            setForm({
                              ...form,
                              eggQuantityValue: val,
                              amount: total !== '' ? total : form.amount,
                              unitPriceSnapshot: benchmarkRate
                            });
                          }}
                          className="w-full h-10 text-center font-bold border border-amber-300 rounded-xl bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Standard Rate Snapshot</label>
                        <div className="w-full h-10 px-2 flex items-center justify-center font-extrabold text-amber-900 bg-amber-100/60 rounded-xl border border-amber-200 text-xs">
                          ₦{form.unitPriceSnapshot.toLocaleString()} / {form.eggQuantityType === 'CRATES' ? 'crate' : 'egg'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Total Amount & Customer/Vendor */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Agreed Total Price (₦)</label>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      value={form.amount === '' ? '' : form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full h-10 text-center font-extrabold text-slate-900 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Client / Vendor Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Alaba Wholesale"
                      value={form.customerOrVendor}
                      onChange={(e) => setForm({ ...form, customerOrVendor: e.target.value })}
                      className="w-full h-10 px-3 font-semibold border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                {/* Payment Status & Method */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Payment Status</label>
                    <select
                      value={form.paymentStatus}
                      onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
                      className="w-full h-10 px-2.5 border border-slate-300 rounded-xl font-bold text-xs"
                    >
                      <option value="PAID">Fully Paid</option>
                      <option value="PENDING">Pending Credit</option>
                      <option value="PARTIAL">Partial Payment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Payment Channel</label>
                    <select
                      value={form.paymentMethod}
                      onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                      className="w-full h-10 px-2.5 border border-slate-300 rounded-xl font-semibold text-xs"
                    >
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CASH">Cash</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="CREDIT">On Credit</option>
                    </select>
                  </div>
                </div>

                {form.paymentStatus === 'PARTIAL' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Amount Paid So Far (₦)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={form.amountPaid === '' ? '' : form.amountPaid}
                      onChange={(e) => setForm({ ...form, amountPaid: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full h-10 px-3 font-bold border border-amber-300 rounded-xl bg-amber-50"
                    />
                  </div>
                )}

                {/* Transaction Date - Disabled for Regular Accountant */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Transaction Date {!(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && '(Auto Locked)'}
                  </label>
                  <input
                    type="date"
                    disabled={!(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')}
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full h-10 px-3 border border-slate-300 rounded-xl font-medium disabled:bg-slate-100 text-slate-600"
                  />
                  {!(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Timestamp is automatically captured from server time to prevent backdating.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Logged By (Accountant)</label>
                  <div className="w-full h-9 px-3 border border-slate-200 rounded-xl bg-slate-100 flex items-center font-bold text-slate-800 text-xs">
                    {user?.name || 'Farm Accountant'}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Notes / Invoice Ref</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Delivered 40 crates of good eggs."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer disabled:bg-slate-400"
                >
                  {isSubmitting ? 'Posting Transaction...' : 'Post to General Ledger'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - General Accounting Ledger Table */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  General Accounting Ledger ({filteredTransactions.length})
                </h3>

                {/* Filter and Search */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-48">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search ref or client..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-9 pl-8 pr-3 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="h-9 px-2.5 border border-slate-300 rounded-xl text-xs font-semibold bg-slate-50"
                  >
                    <option value="ALL">All Types</option>
                    <option value="SALE">Sales Only</option>
                    <option value="EXPENSE">Expenses Only</option>
                    <option value="PAYROLL_PAYMENT">Payroll</option>
                  </select>
                </div>
              </div>

              {/* Table View */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b text-slate-400 font-semibold uppercase">
                      <th className="pb-3">Ref / Date</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Client / Vendor</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Amount (₦)</th>
                      {isAdmin && <th className="pb-3 text-right">Audit Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredTransactions.map((t) => (
                      <tr key={t._id} className={`hover:bg-slate-50 ${t.isFlagged ? 'bg-rose-50/60' : ''}`}>
                        <td className="py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900">{t.referenceNo}</span>
                            {t.isFlagged && (
                              <span className="px-1.5 py-0.5 bg-rose-600 text-white font-black text-[9px] rounded">
                                FLAGGED
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {new Date(t.date).toLocaleDateString()} {new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                        <td className="py-3">
                          <span className="font-bold text-slate-800">{t.category}</span>
                          <p className="text-[10px] text-slate-400">{t.paymentMethod} • Logged by: {t.loggedBy}</p>
                          {t.adminComment && (
                            <p className="text-[10px] text-purple-700 font-bold mt-0.5">
                              Admin Note: "{t.adminComment}"
                            </p>
                          )}
                        </td>
                        <td className="py-3 font-semibold text-slate-700">{t.customerOrVendor}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            t.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.paymentStatus === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {t.paymentStatus}
                          </span>
                        </td>
                        <td className={`py-3 text-right font-black text-sm ${
                          t.type === 'SALE' || t.type === 'OTHER_INCOME' ? 'text-emerald-700' : 'text-rose-600'
                        }`}>
                          {t.type === 'SALE' || t.type === 'OTHER_INCOME' ? '+' : '-'}₦{t.amount.toLocaleString()}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedReceipt(t)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-lg border border-emerald-200 transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Receipt</span>
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => setEditingTransaction(t)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-lg border border-slate-300 transition-all cursor-pointer"
                              >
                                Audit
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Management & Audit Modal */}
        {editingTransaction && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    Audit & Manage Invoice #{editingTransaction.referenceNo}
                  </h3>
                  <p className="text-[11px] text-slate-500">Admin audit controls, flag status, and date adjustments.</p>
                </div>
                <button
                  onClick={() => setEditingTransaction(null)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Adjust Transaction Date (Admin Override)</label>
                  <input
                    type="date"
                    value={editingTransaction.date ? new Date(editingTransaction.date).toISOString().slice(0, 10) : ''}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                    className="w-full h-10 px-3 border border-slate-300 rounded-xl font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Flagging / Anti-Tampering Audit Status</label>
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-700">
                      <input
                        type="checkbox"
                        checked={editingTransaction.isFlagged || false}
                        onChange={(e) => setEditingTransaction({ ...editingTransaction, isFlagged: e.target.checked })}
                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span>Flag as Suspicious / Under Investigation</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Admin Audit Comment / Note</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Price verified against physical receipt."
                    value={editingTransaction.adminComment || ''}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, adminComment: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => handleDeleteTransaction(editingTransaction._id)}
                    className="px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Delete Entry
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingTransaction(null)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAdminAudit}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Save Audit Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Official Printable Transaction Voucher / Receipt Modal */}
        {selectedReceipt && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl printable-receipt">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">GENERAL FARM LTD</h2>
                  <p className="text-[11px] text-slate-500 font-medium">Commercial Sales & Accounting Ledger Voucher</p>
                  <p className="text-[10px] text-emerald-800 font-mono mt-0.5 font-bold">Official Document ID: {selectedReceipt.referenceNo}</p>
                </div>

                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded-md font-black text-[10px] uppercase border ${
                    selectedReceipt.type === 'SALE' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-rose-100 text-rose-900 border-rose-300'
                  }`}>
                    {selectedReceipt.type} VOUCHER
                  </span>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    {new Date(selectedReceipt.date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Receipt Line Item Table */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Client / Vendor</span>
                  <span className="font-extrabold text-slate-900">{selectedReceipt.customerOrVendor}</span>
                </div>

                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Category</span>
                  <span className="font-bold text-slate-800">{selectedReceipt.category}</span>
                </div>

                {selectedReceipt.eggQuantityValue > 0 && (
                  <div className="flex justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Quantity Purchased</span>
                    <span className="font-bold text-amber-900">
                      {selectedReceipt.eggQuantityValue} {selectedReceipt.eggQuantityType === 'CRATES' ? 'Crates' : 'Single Eggs'}
                    </span>
                  </div>
                )}

                {selectedReceipt.unitPriceSnapshot > 0 && (
                  <div className="flex justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Benchmark Unit Rate</span>
                    <span className="font-semibold text-slate-700">
                      ₦{selectedReceipt.unitPriceSnapshot.toLocaleString()} / {selectedReceipt.eggQuantityType === 'CRATES' ? 'crate' : 'egg'}
                    </span>
                  </div>
                )}

                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Payment Channel</span>
                  <span className="font-semibold text-slate-800">{selectedReceipt.paymentMethod}</span>
                </div>

                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Payment Status</span>
                  <span className="font-black text-emerald-800 uppercase">{selectedReceipt.paymentStatus}</span>
                </div>

                <div className="flex justify-between pt-1 text-sm">
                  <span className="font-black text-slate-900">Total Voucher Amount:</span>
                  <span className="font-black text-emerald-700 text-base">₦{selectedReceipt.amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 space-y-1">
                <p>Recorded By: <span className="font-bold text-slate-700">{selectedReceipt.loggedBy}</span></p>
                {selectedReceipt.notes && <p>Invoice Remarks: "{selectedReceipt.notes}"</p>}
                <p className="font-mono text-[9px] text-slate-400 pt-1">
                  Read-Only Immutable General Ledger Record • Anti-Tampering Standard
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t print:hidden">
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
