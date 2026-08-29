'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Home, Users, Plus, Trash2, Edit3, X, RefreshCw } from 'lucide-react';

export default function PensPage() {
  const [pens, setPens] = useState([]);
  const [flocks, setFlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPenModal, setShowPenModal] = useState(false);
  const [showFlockModal, setShowFlockModal] = useState(false);
  const [editingFlock, setEditingFlock] = useState(null);

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
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert(err.message);
    }
  };

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
        setFlockForm({ name: '', breed: 'Hy-Line Brown', penId: '', initial_bird_count: 500, current_bird_count: 500, ageWeeks: 20, status: 'active' });
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert(err.message);
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

  const handleDeleteFlock = async (id) => {
    if (!window.confirm('Are you sure you want to delete this flock record?')) return;
    try {
      const res = await fetch(`/api/flocks/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setFlocks((prev) => prev.filter((f) => f._id !== id));
        fetchData();
      } else {
        alert('Delete failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Delete error: ' + err.message);
    }
  };

  const handleDeletePen = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pen?')) return;
    try {
      const res = await fetch(`/api/pens/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setPens((prev) => prev.filter((p) => p._id !== id));
        fetchData();
      } else {
        alert('Delete failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Delete error: ' + err.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Navbar title="Pen Enclosures & Flock Management" />

      <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Top Header Buttons */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Farm Housing & Flock Inventory</h2>
            <p className="text-xs text-slate-500">Configure coops, pens, bird capacities, and active batch assignments.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setEditingFlock(null);
                setFlockForm({ name: '', breed: 'Hy-Line Brown', penId: '', initial_bird_count: 500, current_bird_count: 500, ageWeeks: 20, status: 'active' });
                setShowFlockModal(true);
              }}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl shadow-xs flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>Add Flock Batch</span>
            </button>
            <button
              onClick={() => setShowPenModal(true)}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Pen Enclosure</span>
            </button>
          </div>
        </div>

        {/* Pens Table / Grid */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Active Pen Enclosures ({pens.length})</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pens.map((pen) => (
              <div key={pen._id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{pen.name}</h4>
                    <p className="text-xs text-slate-500">{pen.location} • {pen.type}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeletePen(pen._id)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                    title="Delete Pen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">Live Birds:</span>
                    <span className="text-slate-900">{pen.current_bird_count} / {pen.capacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned Flock:</span>
                    <span className="font-bold text-emerald-800">{pen.flockId?.name || 'Unassigned'}</span>
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
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Registered Flocks ({flocks.length})</h3>

          <div className="overflow-x-auto">
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
                        <span className="text-amber-600 font-normal italic">Unassigned (No Pen)</span>
                      )}
                    </td>
                    <td className="py-3">{flock.initial_bird_count}</td>
                    <td className="py-3 font-bold text-slate-900">{flock.current_bird_count}</td>
                    <td className="py-3">{flock.ageWeeks} weeks</td>
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
                        onClick={() => handleDeleteFlock(flock._id)}
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
        </div>

        {/* Modal - Create Pen */}
        {showPenModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-slate-900 text-base">Add New Pen Enclosure</h3>
                <button onClick={() => setShowPenModal(false)} className="text-slate-400 hover:text-slate-600">
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
                  className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-all"
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
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-slate-900 text-base">
                  {editingFlock ? 'Edit / Reassign Flock Batch' : 'Add New Flock Batch'}
                </h3>
                <button onClick={() => setShowFlockModal(false)} className="text-slate-400 hover:text-slate-600">
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
                      {pens.map((p) => (
                        <option key={p._id} value={p._id}>{p.name}</option>
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
                  className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-all"
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
