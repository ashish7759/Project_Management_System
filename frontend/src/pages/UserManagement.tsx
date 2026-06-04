import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { User, Department } from '../types';
import { 
  Trash2, 
  UserCheck, 
  UserX, 
  Key, 
  Filter, 
  Loader2, 
  AlertTriangle,
  UserPlus
} from 'lucide-react';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Password reset modal state
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  // Error/Success alerts
  const [alert, setAlert] = useState<{ type: 'error' | 'success', message: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedDept) params.department = selectedDept;
      if (selectedRole) params.role = selectedRole;
      if (selectedStatus) params.status = selectedStatus;

      const res = await api.get('/users', { params });
      setUsers(res.data);
    } catch (err: any) {
      setAlert({ type: 'error', message: 'Failed to fetch user list.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      // If we don't have a direct list-departments endpoint, we use the predefined ones
      setDepartments([
        { department_id: 1, department_name: 'Engineering' },
        { department_id: 2, department_name: 'Finance' },
        { department_id: 3, department_name: 'Operations' },
        { department_id: 4, department_name: 'HR' },
        { department_id: 5, department_name: 'IT' },
        { department_id: 6, department_name: 'Administration' }
      ]);
    } catch (err) {
      console.warn("Failed to load departments");
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [selectedDept, selectedRole, selectedStatus]);

  const handleRoleChange = async (user_id: number, newRole: string) => {
    try {
      await api.put(`/users/${user_id}/role`, { role: newRole });
      setAlert({ type: 'success', message: 'User role updated successfully.' });
      fetchUsers();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.detail || 'Failed to update user role.' });
    }
  };

  const handleStatusToggle = async (user: User) => {
    const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await api.put(`/users/${user.user_id}/status`, { status: nextStatus });
      setAlert({ type: 'success', message: `User status changed to ${nextStatus}.` });
      fetchUsers();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.detail || 'Failed to update user status.' });
    }
  };

  const handleDeleteUser = async (user_id: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this user employee account?')) return;
    try {
      await api.delete(`/users/${user_id}`);
      setAlert({ type: 'success', message: 'User deleted successfully.' });
      fetchUsers();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.detail || 'Failed to delete user.' });
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || newPassword.length < 6) return;
    setResetSubmitting(true);
    try {
      await api.put(`/users/${resettingUser.user_id}/reset-password`, { new_password: newPassword });
      setAlert({ type: 'success', message: `Password reset successfully for ${resettingUser.full_name}.` });
      setResettingUser(null);
      setNewPassword('');
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.detail || 'Password reset failed.' });
    } finally {
      setResetSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">User Management</h1>
        <p className="text-sm text-slate-500">Approve pending employee registrations and assign operational roles.</p>
      </div>

      {alert && (
        <div className={`flex items-center justify-between rounded-lg border p-4 text-sm ${
          alert.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'
        }`}>
          <span>{alert.message}</span>
          <button onClick={() => setAlert(null)} className="font-semibold uppercase tracking-wider text-xs">Dismiss</button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center text-slate-400">
          <Filter className="mr-2 h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Filters:</span>
        </div>
        
        {/* Department Filter */}
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
        >
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d.department_id} value={d.department_name}>{d.department_name}</option>
          ))}
        </select>

        {/* Role Filter */}
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
        >
          <option value="">All Roles</option>
          <option value="Admin">Admin</option>
          <option value="Manager">Manager</option>
          <option value="Operator">Operator</option>
          <option value="Viewer">Viewer</option>
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending Approval</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-slate-400">
            <AlertTriangle className="h-8 w-8 stroke-1" />
            <span className="mt-2 text-sm font-medium">No registered employees found matching criteria.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Name / ID</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">System Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                {users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-slate-50/75">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{u.full_name}</div>
                      <div className="text-xs text-slate-400">Emp ID: {u.employee_id}</div>
                      <div className="text-[10px] font-mono text-slate-400">@{u.username}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-950">{u.email}</div>
                      <div className="text-xs text-slate-400">{u.mobile}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                        {u.department?.department_name || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="Operator">Operator</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${
                        u.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : u.status === 'Pending' 
                            ? 'bg-amber-100 text-amber-800 animate-pulse' 
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Status Toggle Button */}
                        <button
                          onClick={() => handleStatusToggle(u)}
                          className={`rounded p-1 hover:bg-slate-150 ${u.status === 'Active' ? 'text-amber-600' : 'text-emerald-600'}`}
                          title={u.status === 'Active' ? 'Deactivate Account' : 'Activate/Approve Account'}
                        >
                          {u.status === 'Active' ? <UserX className="h-4.5 w-4.5" /> : <UserCheck className="h-4.5 w-4.5" />}
                        </button>
                        
                        {/* Password Reset Modal Trigger */}
                        <button
                          onClick={() => setResettingUser(u)}
                          className="rounded p-1 text-slate-650 hover:bg-slate-150 hover:text-slate-900"
                          title="Reset Password"
                        >
                          <Key className="h-4.5 w-4.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteUser(u.user_id)}
                          className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700"
                          title="Delete Account"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Password Reset Dialog Modal */}
      {resettingUser && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Reset Employee Password</h3>
            <p className="mt-1.5 text-xs text-slate-500">
              Reset password for <span className="font-semibold text-slate-700">{resettingUser.full_name}</span>.
            </p>
            <form onSubmit={handleResetPasswordSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setResettingUser(null); setNewPassword(''); }}
                  className="rounded-lg border border-slate-250 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newPassword.length < 6 || resetSubmitting}
                  className="inline-flex items-center rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-primary-600 disabled:opacity-50"
                >
                  {resetSubmitting && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
