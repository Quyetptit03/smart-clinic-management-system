"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { userService, User, CreateUserPayload, UpdateUserPayload, ChangeRolePayload } from '@/services/userService';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

const ROLES = ['Admin', 'Doctor', 'Receptionist'] as const;

const ROLE_COLORS: Record<string, string> = {
  Admin: 'bg-purple-100 text-purple-700 border-purple-200',
  Doctor: 'bg-blue-100 text-blue-700 border-blue-200',
  Receptionist: 'bg-amber-100 text-amber-700 border-amber-200',
};

export default function UsersPage() {
  const { role: currentUserRole } = useAuth();
  const isAdmin = currentUserRole === 'Admin';

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('Receptionist');

  // Role-change inline modal
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleChangeTarget, setRoleChangeTarget] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (isModalOpen && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isModalOpen]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getAll();
      setUsers(data ?? []);
    } catch {
      toast.error('Failed to load users.');
      setUsers([]);
    } finally {
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = debouncedSearch
    ? users.filter((u) => u.username.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : users;

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedUserId(null);
    setUsername('');
    setPassword('');
    setRole('Receptionist');
    setIsModalOpen(true);
  };

  const openEditModal = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalMode('edit');
    setSelectedUserId(user.id);
    setUsername(user.username);
    setPassword('');
    setRole(user.role);
    setIsModalOpen(true);
  };

  const openRoleModal = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setRoleChangeTarget(user);
    setNewRole(user.role);
    setIsRoleModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || password.length < 6) {
      toast.error('Username and a password (min 6 chars) are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        const payload: CreateUserPayload = {
          username: username.trim(),
          password,
          role,
        };
        await userService.create(payload);
        toast.success('User created successfully.');
      } else {
        if (!selectedUserId) return;
        const payload: UpdateUserPayload = {
          id: selectedUserId,
          password,
        };
        await userService.update(payload);
        toast.success('User updated successfully.');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data || err.message || 'Operation failed.';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;

    try {
      await userService.delete(user.id);
      toast.success('User deleted.');
      fetchUsers();
    } catch {
      toast.error('Failed to delete user.');
    }
  };

  const handleLock = async (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Lock "${user.username}"? They will not be able to log in.`)) return;

    try {
      await userService.lock(user.id);
      toast.success(`"${user.username}" has been locked.`);
      fetchUsers();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data || err.message;
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const handleUnlock = async (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await userService.unlock(user.id);
      toast.success(`"${user.username}" has been unlocked.`);
      fetchUsers();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data || err.message;
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const handleRoleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleChangeTarget || !newRole) return;
    if (newRole === roleChangeTarget.role) {
      setIsRoleModalOpen(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ChangeRolePayload = {
        userId: roleChangeTarget.id,
        newRole,
      };
      await userService.changeRole(payload);
      toast.success(`Role updated for "${roleChangeTarget.username}".`);
      setIsRoleModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data || err.message;
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  const SkeletonRows = () => (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <tr key={i} className="animate-pulse border-b border-gray-50">
          <td className="p-4"><div className="h-4 bg-gray-200 rounded-md w-3/4"></div></td>
          <td className="p-4"><div className="h-6 w-20 bg-gray-200 rounded-full"></div></td>
          <td className="p-4"><div className="h-4 bg-gray-200 rounded-md w-28"></div></td>
          <td className="p-4"><div className="h-4 bg-gray-200 rounded-md w-20"></div></td>
          <td className="p-4 flex gap-2 justify-end">
            <div className="h-8 w-16 bg-gray-200 rounded-lg"></div>
            <div className="h-8 w-16 bg-gray-200 rounded-lg"></div>
          </td>
        </tr>
      ))}
    </>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">User Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
            {debouncedSearch ? ` matching "${debouncedSearch}"` : ''}
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={openCreateModal}
            className="shadow-md hover:shadow-lg transform transition-all hover:-translate-y-0.5"
          >
            + Add User
          </Button>
        )}
      </div>

      <Card className="p-6 border-none shadow-sm rounded-2xl bg-white">
        {/* Search */}
        <div className="mb-6">
          <div className="relative w-full md:w-[400px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search by username..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead className="bg-gray-50/80 border-b border-gray-200">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <SkeletonRows />
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-16 text-center text-gray-500">
                      <div className="text-4xl mb-3">👤</div>
                      <p className="font-medium">
                        {debouncedSearch ? 'No users match your search.' : 'No users yet.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <tr
                      key={user.id}
                      style={{ animationDelay: `${index * 40}ms` }}
                      className="bg-white hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{user.username}</div>
                            <div className="text-xs text-gray-400">ID: {user.id.toString().slice(0, 8)}…</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        {user.isLocked ? (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 border border-red-100 rounded-full text-xs font-bold w-max">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            Locked
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full text-xs font-bold w-max">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Active
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2 flex-wrap">
                          {isAdmin && (
                            <>
                              {/* Change Role */}
                              <button
                                onClick={(e) => openRoleModal(user, e)}
                                className="bg-white border border-gray-200 text-gray-600 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold shadow-sm"
                                title="Change Role"
                              >
                                🔄 Role
                              </button>

                              {/* Edit (password only) */}
                              <button
                                onClick={(e) => openEditModal(user, e)}
                                className="bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold shadow-sm"
                                title="Reset Password"
                              >
                                ✏️ Password
                              </button>

                              {/* Lock / Unlock */}
                              {user.isLocked ? (
                                <button
                                  onClick={(e) => handleUnlock(user, e)}
                                  className="bg-white border border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold shadow-sm"
                                  title="Unlock User"
                                >
                                  🔓 Unlock
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => handleLock(user, e)}
                                  className="bg-white border border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold shadow-sm"
                                  title="Lock User"
                                >
                                  🔒 Lock
                                </button>
                              )}

                              {/* Delete */}
                              <button
                                onClick={(e) => handleDelete(user, e)}
                                className="bg-white border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold shadow-sm"
                                title="Delete User"
                              >
                                🗑️ Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Add New User' : 'Reset User Password'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              ref={firstInputRef}
              type="text"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-gray-800 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="e.g. johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={modalMode === 'edit'}
              required
              minLength={3}
            />
            {modalMode === 'edit' && (
              <p className="text-xs text-gray-400 mt-1">Username cannot be changed.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Password <span className="text-red-500">*</span>
              {modalMode === 'edit' && <span className="font-normal text-gray-400 ml-1">(leave blank to keep current)</span>}
            </label>
            <input
              type="password"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-gray-800 shadow-sm"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={modalMode === 'create'}
              minLength={6}
            />
          </div>

          {modalMode === 'create' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Role</label>
              <select
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer font-medium text-gray-800 shadow-sm"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {modalMode === 'create' ? 'Creating...' : 'Saving...'}
                </>
              ) : (
                modalMode === 'create' ? 'Create User' : 'Save Password'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* CHANGE ROLE MODAL */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="Change User Role"
      >
        {roleChangeTarget && (
          <form onSubmit={handleRoleChange} className="space-y-4 mt-2">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-sm text-gray-600">
                Changing role for <span className="font-bold text-gray-800">@{roleChangeTarget.username}</span>
              </p>
              <p className="text-sm mt-1">
                Current role:{' '}
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ROLE_COLORS[roleChangeTarget.role] || ''}`}>
                  {roleChangeTarget.role}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">New Role</label>
              <select
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer font-medium text-gray-800 shadow-sm"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || newRole === roleChangeTarget.role}
                className="px-6 py-2.5 rounded-xl font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  'Update Role'
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
