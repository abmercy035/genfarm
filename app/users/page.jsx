'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import ConfirmModal from '@/components/ConfirmModal';
import { Users, UserPlus, Shield, CheckCircle, X, Edit3, Trash2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && currentUser) {
      if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
        router.replace('/');
      }
    }
  }, [currentUser, authLoading, router]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Confirm Modal state for Deletion
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    targetId: null
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: 'WORKER',
    isActive: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setForm({ name: '', phone: '', email: '', password: '', role: 'WORKER', isActive: true });
    setShowModal(true);
  };

  const handleOpenEdit = (userToEdit) => {
    setEditingUser(userToEdit);
    setForm({
      name: userToEdit.name,
      phone: userToEdit.phone,
      email: userToEdit.email || '',
      password: '', // Blank unless updating password
      role: userToEdit.role,
      isActive: userToEdit.isActive !== false
    });
    setShowModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      const url = editingUser ? `/api/users/${editingUser._id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setEditingUser(null);
        setForm({ name: '', phone: '', email: '', password: '', role: 'WORKER', isActive: true });
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to save user', err);
    }
  };

  const promptDeleteUser = (id, name) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Staff Account',
      message: `Are you sure you want to permanently delete the account for "${name}"?`,
      targetId: id
    });
  };

  const executeDeleteUser = async () => {
    if (!confirmState.targetId) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/users/${confirmState.targetId}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        setUsers((prev) => prev.filter((u) => u._id !== confirmState.targetId));
        fetchUsers();
      }
    } catch (err) {
      console.error('Delete user error', err);
    } finally {
      setIsDeleting(false);
      setConfirmState({ isOpen: false, title: '', message: '', targetId: null });
    }
  };

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  return (
    <div className="flex-1 flex flex-col pt-14 lg:pt-0">
      <Navbar title="Staff Credentials & Access Control (RBAC)" />

      <main className="p-3 sm:p-6 space-y-5 sm:space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>User & Staff Directory</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Manage farm staff accounts, update roles (Worker, Moderator, Admin), and set active access.
            </p>
          </div>

          {isSuperAdmin && (
            <button
              onClick={handleOpenCreate}
              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Staff Account</span>
            </button>
          )}
        </div>

        {/* User Directory Table / Mobile List */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Registered Accounts ({users.length})</h3>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase">
                  <th className="pb-3">Staff Name</th>
                  <th className="pb-3">Phone</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50">
                    <td className="py-3.5 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3.5 text-slate-600">{u.phone}</td>
                    <td className="py-3.5 text-slate-500">{u.email || '—'}</td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${
                        u.role === 'SUPER_ADMIN' 
                          ? 'bg-rose-100 text-rose-800' 
                          : u.role === 'ADMIN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role === 'SUPER_ADMIN' ? 'Admin' : u.role === 'ADMIN' ? 'Moderator' : 'Worker'}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {u.isActive !== false ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                        title="Edit user details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      {currentUser?._id !== u._id && (
                        <button
                          onClick={() => promptDeleteUser(u._id, u.name)}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                          title="Delete user account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {users.map((u) => (
              <div key={u._id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-start border-b border-slate-200/60 pb-2">
                  <div>
                    <h4 className="font-bold text-slate-900">{u.name}</h4>
                    <p className="text-[10px] text-slate-500">{u.phone} • {u.email || 'No email'}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                    u.role === 'SUPER_ADMIN' ? 'bg-rose-100 text-rose-800' : u.role === 'ADMIN' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {u.role === 'SUPER_ADMIN' ? 'Admin' : u.role === 'ADMIN' ? 'Moderator' : 'Worker'}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1 text-[11px]">
                  <span className="text-slate-500">Status:</span>
                  <span className={`font-bold ${u.isActive !== false ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {u.isActive !== false ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/60">
                  <button
                    onClick={() => handleOpenEdit(u)}
                    className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg text-[11px] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  {currentUser?._id !== u._id && (
                    <button
                      onClick={() => promptDeleteUser(u._id, u.name)}
                      className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-lg text-[11px] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Deletion Confirm Modal */}
        <ConfirmModal
          isOpen={confirmState.isOpen}
          title={confirmState.title}
          message={confirmState.message}
          isDeleting={isDeleting}
          onConfirm={executeDeleteUser}
          onCancel={() => setConfirmState({ isOpen: false, title: '', message: '', targetId: null })}
        />

        {/* Modal - Create / Edit User */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-slate-900 text-base">
                  {editingUser ? 'Edit Staff Account' : 'Create New Staff Account'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Phone Number</label>
                    <input
                      type="text"
                      required
                      placeholder="08000000000"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="user@genfarm.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Role Permission</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg font-bold text-slate-800"
                    >
                      <option value="WORKER">Worker</option>
                      <option value="ADMIN">Moderator</option>
                      <option value="SUPER_ADMIN">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">
                      {editingUser ? 'New Password (Optional)' : 'Password'}
                    </label>
                    <input
                      type="password"
                      required={!editingUser}
                      placeholder={editingUser ? 'Leave blank to keep' : '••••••••'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                {editingUser && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <label htmlFor="isActive" className="font-semibold text-slate-700 cursor-pointer">
                      Account Active & Enabled
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  {editingUser ? 'Update Staff Account' : 'Create Staff Account'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
