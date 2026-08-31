'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import ConfirmModal from '@/components/ConfirmModal';
import { Home, Users, Plus, Trash2, Edit3, X } from 'lucide-react';

export default function PensPage() {
  const [pens, setPens] = useState([]);
  const [flocks, setFlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showPenModal, setShowPenModal] = useState(false);
  const [showFlockModal, setShowFlockModal] = useState(false);
  const [editingFlock, setEditingFlock] = useState(null);

  // Confirm Modal state
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    targetId: null,
    targetType: null // 'pen' or 'flock'
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Pen Form state
  const [penForm, setPenForm] = useState({
    name: '',
    type: 'Layers',
    location: 'North Shed',
    capacity: 500,
    current_bird_count: 500,
    notes: ''
  });

  // Flock Form state
  const [flockForm, setFlockForm] = useState({
    name: '',
    breed: 'Hy-Line Brown',
    penId: '',
    initial_bird_count: 500,
    current_bird_count: 500,
    ageWeeks: 20,
    status: 'active'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pensRes, flocksRes] = await Promise.all([
        fetch('/api/pens'),
        fetch('/api/flocks')
      ]);
      const pensData = await pensRes.json();
      const flocksData = await flocksRes.json();

      if (pensData.success) setPens(pensData.data);
      if (flocksData.success) setFlocks(flocksData.data);
    } catch (err) {
      console.error('Error fetching pens data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePen = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/pens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(penForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowPenModal(false);
        setPenForm({ name: '', type: 'Layers', location: 'North Shed', capacity: 500, current_bird_count: 500, notes: '' });
        fetchData();
      }
    } catch (err) {
      console.error('Create pen error', err);
    }
  };

  const [voucherNotification, setVoucherNotification] = useState(null);

  const handleSaveFlock = async (e) => {
    e.preventDefault();
    try {
      const url = editingFlock ? `/api/flocks/${editingFlock._id}` : '/api/flocks';
      const method = editingFlock ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flockForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowFlockModal(false);
        setEditingFlock(null);
        if (data.expenseVoucherRef) {
          setVoucherNotification(`Flock created & automatic accounting expense voucher #${data.expenseVoucherRef} was posted to Chief Accountant Ledger!`);
          setTimeout(() => setVoucherNotification(null), 6000);
        }
        setFlockForm({ name: '', breed: 'Hy-Line Brown', penId: '', initial_bird_count: 500, current_bird_count: 500, ageWeeks: 20, status: 'active' });
        fetchData();
      }
    } catch (err) {
      console.error('Save flock error', err);
    }
  };

  const handleOpenEditFlock = (flock) => {
    setEditingFlock(flock);
    setFlockForm({
      name: flock.name,
      breed: flock.breed || 'Hy-Line Brown',
      penId: flock.penId?._id || '',
      initial_bird_count: flock.initial_bird_count,
      current_bird_count: flock.current_bird_count,
      ageWeeks: flock.ageWeeks,
      status: flock.status || 'active'
    });
    setShowFlockModal(true);
  };

  // Triggers modern confirm modal for Flock
  const promptDeleteFlock = (id, name) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Flock Batch',
      message: `Are you sure you want to permanently delete "${name}"?`,
      targetId: id,
      targetType: 'flock'
    });
  };

  // Triggers modern confirm modal for Pen
  const promptDeletePen = (id, name) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Pen Enclosure',
      message: `Are you sure you want to delete "${name}"? Linked flocks will be unassigned.`,
      targetId: id,
      targetType: 'pen'
    });
  };

  // Execution handler for confirmed deletion
  const executeDelete = async () => {
    const { targetId, targetType } = confirmState;
    if (!targetId || !targetType) return;

    try {
      setIsDeleting(true);
      const endpoint = targetType === 'flock' ? `/api/flocks/${targetId}` : `/api/pens/${targetId}`;
      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        if (targetType === 'flock') {
          setFlocks((prev) => prev.filter((f) => f._id !== targetId));
        } else {
          setPens((prev) => prev.filter((p) => p._id !== targetId));
        }
        fetchData();
      }
    } catch (err) {
      console.error('Delete error', err);
    } finally {
      setIsDeleting(false);
      setConfirmState({ isOpen: false, title: '', message: '', targetId: null, targetType: null });
    }
  };

  return (
    <div className="flex-1 flex flex-col pt-14 lg:pt-0">
      <Navbar title="Pens & Flock Management" />

      <main className="p-3 sm:p-6 space-y-5 sm:space-y-6 max-w-7xl mx-auto w-full">
        {/* Top Header Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Coop & Bird Allocation</h2>
            <p className="text-[11px] sm:text-xs text-slate-500">Manage housing pens, live bird counts, and flock assignments.</p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setEditingFlock(null);
                setFlockForm({ name: '', breed: 'Hy-Line Brown', penId: '', initial_bird_count: 500, current_bird_count: 500, ageWeeks: 20, status: 'active' });
                setShowFlockModal(true);
              }}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>Add Flock</span>
            </button>
            <button
              onClick={() => setShowPenModal(true)}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Pen</span>
            </button>
          </div>
        </div>

        {voucherNotification && (
          <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl text-emerald-900 font-extrabold text-xs shadow-xs">
            ✓ {voucherNotification}
          </div>
        )}

        {/* Pens Grid */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Active Pen Enclosures ({pens.length})</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {pens.map((pen) => (
              <div key={pen._id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{pen.name}</h4>
                    <p className="text-xs text-slate-500">{pen.location} • {pen.type}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => promptDeletePen(pen._id, pen.name)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                    title="Delete Pen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">Live Birds Occupancy:</span>
                    <span className={`font-bold ${pen.current_bird_count >= pen.capacity ? 'text-rose-600' : 'text-slate-900'}`}>
                      {pen.current_bird_count} / {pen.capacity} ({pen.capacity > 0 ? Math.round((pen.current_bird_count / pen.capacity) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500">Assigned Flocks:</span>
                    <div className="text-right">
                      {pen.assignedFlocks && pen.assignedFlocks.length > 0 ? (
                        <div className="space-y-0.5">
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] inline-block">
                            {pen.assignedFlockCount} {pen.assignedFlockCount === 1 ? 'Flock Batch' : 'Flock Batches'}
                          </span>
                          <div className="text-[10px] text-slate-500">
                            {pen.assignedFlocks.map(f => f.name).join(', ')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-amber-600 font-normal italic">0 Batches (Empty)</span>
                      )}
                    </div>
                  </div>
                  {pen.notes && (
                    <p className="text-[11px] text-slate-400 pt-1 border-t italic">{pen.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flocks Section */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Registered Flocks ({flocks.length})</h3>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase">
                  <th className="pb-3">Flock Name</th>
                  <th className="pb-3">Breed</th>
                  <th className="pb-3">Pen Location</th>
                  <th className="pb-3">Initial Count</th>
                  <th className="pb-3">Live Count</th>
                  <th className="pb-3">Age (Weeks)</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions / Reassign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {flocks.map((flock) => (
                  <tr key={flock._id} className="hover:bg-slate-50">
                    <td className="py-3 font-bold text-slate-900">{flock.name}</td>
                    <td className="py-3">{flock.breed}</td>
                    <td className="py-3 font-semibold text-emerald-700">
                      {flock.penId?.name ? (
                        flock.penId.name
                      ) : (
                        <span className="text-amber-600 font-normal italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3">{flock.initial_bird_count}</td>
                    <td className="py-3 font-bold text-slate-900">{flock.current_bird_count}</td>
                    <td className="py-3">{flock.ageWeeks} wks</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        flock.status === 'active' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {flock.status}
                      </span>
                    </td>
                    <td className="py-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditFlock(flock)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                        title="Edit details or reassign pen"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit / Reassign</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => promptDeleteFlock(flock._id, flock.name)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                        title="Delete Flock"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {flocks.map((flock) => (
              <div key={flock._id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-start border-b border-slate-200/60 pb-2">
                  <div>
                    <h4 className="font-bold text-slate-900">{flock.name}</h4>
                    <p className="text-[10px] text-slate-500">{flock.breed} • {flock.ageWeeks} wks old</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    flock.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {flock.status}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Pen Location:</span>
                  <span className="font-bold text-emerald-800">{flock.penId?.name || 'Unassigned'}</span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Live Birds / Initial:</span>
                  <span className="font-bold text-slate-900">{flock.current_bird_count} / {flock.initial_bird_count}</span>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/60">
                  <button
                    onClick={() => handleOpenEditFlock(flock)}
                    className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg text-[11px] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Reassign</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => promptDeleteFlock(flock._id, flock.name)}
                    className="px-2 py-1 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-lg text-[11px] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmState.isOpen}
          title={confirmState.title}
          message={confirmState.message}
          isDeleting={isDeleting}
          onConfirm={executeDelete}
          onCancel={() => setConfirmState({ isOpen: false, title: '', message: '', targetId: null, targetType: null })}
        />

        {/* Modal - Create Pen */}
        {showPenModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-slate-900 text-base">Add New Pen Enclosure</h3>
                <button onClick={() => setShowPenModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePen} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Pen Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pen 1 - North Shed"
                    value={penForm.name}
                    onChange={(e) => setPenForm({ ...penForm, name: e.target.value })}
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Pen Type</label>
                    <select
                      value={penForm.type}
                      onChange={(e) => setPenForm({ ...penForm, type: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg"
                    >
                      <option value="Layers">Layers</option>
                      <option value="Broilers">Broilers</option>
                      <option value="Breeders">Breeders</option>
                      <option value="Quarantine">Quarantine</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Location</label>
                    <input
                      type="text"
                      value={penForm.location}
                      onChange={(e) => setPenForm({ ...penForm, location: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Capacity (Max Birds)</label>
                    <input
                      type="number"
                      required
                      value={penForm.capacity}
                      onChange={(e) => setPenForm({ ...penForm, capacity: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Current Birds</label>
                    <input
                      type="number"
                      required
                      value={penForm.current_bird_count}
                      onChange={(e) => setPenForm({ ...penForm, current_bird_count: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={penForm.notes}
                    onChange={(e) => setPenForm({ ...penForm, notes: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-all cursor-pointer"
                >
                  Save Pen Enclosure
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal - Create / Edit / Reassign Flock */}
        {showFlockModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-slate-900 text-base">
                  {editingFlock ? 'Edit / Reassign Flock Batch' : 'Add New Flock Batch'}
                </h3>
                <button onClick={() => setShowFlockModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveFlock} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Flock Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Batch 2024-L1"
                    value={flockForm.name}
                    onChange={(e) => setFlockForm({ ...flockForm, name: e.target.value })}
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Breed</label>
                    <input
                      type="text"
                      value={flockForm.breed}
                      onChange={(e) => setFlockForm({ ...flockForm, breed: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Assign Pen Location</label>
                    <select
                      value={flockForm.penId}
                      onChange={(e) => setFlockForm({ ...flockForm, penId: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg font-bold text-emerald-800"
                    >
                      <option value="">-- None (Unassigned) --</option>
                      {pens
                        .filter((p) => {
                          // Hide pens that are at or over capacity, unless it's already the currently assigned pen for editing
                          const isCurrentPen = editingFlock && editingFlock.penId?._id === p._id;
                          const isAvailable = p.current_bird_count < p.capacity;
                          return isAvailable || isCurrentPen;
                        })
                        .map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} ({p.current_bird_count}/{p.capacity} birds • {p.capacity - p.current_bird_count} spaces left)
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Initial Birds</label>
                    <input
                      type="number"
                      required
                      value={flockForm.initial_bird_count}
                      onChange={(e) => setFlockForm({ ...flockForm, initial_bird_count: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Live Bird Count</label>
                    <input
                      type="number"
                      required
                      value={flockForm.current_bird_count}
                      onChange={(e) => setFlockForm({ ...flockForm, current_bird_count: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Age (Weeks)</label>
                    <input
                      type="number"
                      value={flockForm.ageWeeks}
                      onChange={(e) => setFlockForm({ ...flockForm, ageWeeks: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Flock Status</label>
                    <select
                      value={flockForm.status}
                      onChange={(e) => setFlockForm({ ...flockForm, status: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg"
                    >
                      <option value="active">Active</option>
                      <option value="unassigned">Unassigned</option>
                      <option value="sold">Sold</option>
                      <option value="culled">Culled</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-all cursor-pointer"
                >
                  {editingFlock ? 'Update & Reassign Flock' : 'Save Flock Batch'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
