import { useEffect, useMemo, useState } from 'react';
import Modal from '../components/Modal';
import { useAuth } from '../hooks/useAuth';
import {
  createUserAccount,
  fetchAllProfiles,
  sendPasswordReset,
  updateUserProfile,
  updateUserStatus,
} from '../utils/userAdmin';

const roles = ['Admin', 'User'];

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

export default function AdminPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formState, setFormState] = useState({ full_name: '', email: '', role: 'User', station: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState('');
  const [resettingId, setResettingId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchAllProfiles();
      setUsers(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      [user.full_name, user.email, user.station, user.role]
        .filter(Boolean)
        .some((val) => val.toLowerCase().includes(term)),
    );
  }, [search, users]);

  const openAddModal = () => {
    setEditingUser(null);
    setFormState({ full_name: '', email: '', role: 'User', station: '' });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormState({
      full_name: user.full_name || '',
      email: user.email || '',
      role: user.role || 'User',
      station: user.station || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      if (editingUser) {
        await updateUserProfile(editingUser.id, {
          full_name: formState.full_name,
          role: formState.role,
          station: formState.station,
        });
        setSuccessMessage('User updated successfully.');
      } else {
        await createUserAccount({
          full_name: formState.full_name,
          email: formState.email,
          role: formState.role,
          station: formState.station,
        });
        await sendPasswordReset(formState.email);
        setSuccessMessage('User created and reset email sent.');
      }
      await loadUsers();
      closeModal();
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Unable to save user.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user) => {
    setStatusUpdatingId(user.id);
    try {
      await updateUserStatus(user.id, !user.is_active);
      setSuccessMessage(`User ${user.is_active ? 'disabled' : 'enabled'} successfully.`);
      await loadUsers();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to update status.');
    } finally {
      setStatusUpdatingId('');
    }
  };

  const handlePasswordReset = async (user) => {
    setResettingId(user.id);
    try {
      await sendPasswordReset(user.email);
      setSuccessMessage(`Password reset link sent to ${user.email}.`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to send reset email.');
    } finally {
      setResettingId('');
    }
  };

  return (
    <div className="py-6 space-y-6">
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 shadow space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase text-brand">Admin</p>
            <h2 className="text-xl font-bold">User Management</h2>
            <p className="text-sm text-slate-400">
              Only admins can access this page. RLS policies should restrict these actions server-side.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadUsers}
              className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm"
              disabled={loading}
            >
              Refresh
            </button>
            <button
              onClick={openAddModal}
              className="px-3 py-2 rounded-lg bg-brand text-slate-900 font-semibold text-sm"
            >
              Add User
            </button>
          </div>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {successMessage && <p className="text-emerald-300 text-sm">{successMessage}</p>}
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="search"
            placeholder="Search name, email, role, or station"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 focus:outline-none focus:border-brand text-sm w-full md:w-80"
          />
          <div className="text-sm text-slate-400">
            Signed in as <span className="text-slate-200 font-semibold">{profile?.email}</span> ({profile?.role})
          </div>
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-800 text-left text-slate-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Station</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Last Login</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-4 text-slate-300">
                  Loading users…
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-4 text-slate-300">
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-900/60">
                  <td className="px-4 py-3 font-semibold text-slate-100">{user.full_name || '—'}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.role || '—'}</td>
                  <td className="px-4 py-3">{user.station || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.is_active
                          ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-700'
                          : 'bg-red-900/60 text-red-200 border border-red-700'
                      }`}
                    >
                      {user.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{formatDateTime(user.created_at)}</td>
                  <td className="px-4 py-3 text-slate-300">{formatDateTime(user.last_sign_in_at)}</td>
                  <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => openEditModal(user)}
                      className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user)}
                      disabled={statusUpdatingId === user.id}
                      className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs disabled:opacity-60"
                    >
                      {statusUpdatingId === user.id ? 'Saving…' : user.is_active ? 'Disable' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handlePasswordReset(user)}
                      disabled={resettingId === user.id}
                      className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs disabled:opacity-60"
                    >
                      {resettingId === user.id ? 'Sending…' : 'Reset Password'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editingUser ? 'Edit User' : 'Add User'}>
        {formError && <p className="text-red-400 text-sm mb-3">{formError}</p>}
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300" htmlFor="full_name">
                Name
              </label>
              <input
                id="full_name"
                className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 focus:outline-none focus:border-brand"
                value={formState.full_name}
                onChange={(e) => setFormState((s) => ({ ...s, full_name: e.target.value }))}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 focus:outline-none focus:border-brand disabled:opacity-60"
                value={formState.email}
                onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))}
                required
                disabled={Boolean(editingUser)}
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300" htmlFor="role">
                Role
              </label>
              <select
                id="role"
                className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 focus:outline-none focus:border-brand"
                value={formState.role}
                onChange={(e) => setFormState((s) => ({ ...s, role: e.target.value }))}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300" htmlFor="station">
                Station
              </label>
              <input
                id="station"
                className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 focus:outline-none focus:border-brand"
                value={formState.station}
                onChange={(e) => setFormState((s) => ({ ...s, station: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-brand text-slate-900 font-semibold disabled:opacity-60"
              disabled={saving}
            >
              {saving ? 'Saving…' : editingUser ? 'Save Changes' : 'Create User'}
            </button>
          </div>
          {!editingUser && (
            <p className="text-xs text-slate-400">
              New users are created as active. A password reset link will be sent so they can set their password.
            </p>
          )}
        </form>
      </Modal>
    </div>
  );
}
