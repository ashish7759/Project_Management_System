import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { User, Department } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Trash2, 
  UserCheck, 
  UserX, 
  Key, 
  Filter, 
  AlertTriangle,
  Loader2,
  List,
  LayoutGrid
} from 'lucide-react';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';

const UserManagement: React.FC = () => {
  const { t, language, getTranslatedDept } = useLanguage();
  const { isDark } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'list' or 'grid' (Persisted in localStorage)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    return (localStorage.getItem('users_view_mode') as 'list' | 'grid') || 'list';
  });

  const handleViewModeChange = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('users_view_mode', mode);
  };
  
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
      setAlert({ type: 'error', message: t('users.failed_fetch') });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/projects/departments');
      setDepartments(res.data);
    } catch (err) {
      console.warn("Failed to load departments");
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    const handleDatabaseUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const changes = customEvent.detail?.changes || [];
      const hasDeptChanges = changes.some((c: any) => c.table === 'department');
      if (hasDeptChanges) {
        console.log('[Realtime] Re-fetching department list due to DB updates.');
        fetchDepartments();
      }
      const hasUserChanges = changes.some((c: any) => c.table === 'user_account');
      if (hasUserChanges) {
        console.log('[Realtime] Re-fetching user list due to DB updates.');
        fetchUsers();
      }
    };
    window.addEventListener('database-update', handleDatabaseUpdate);
    return () => window.removeEventListener('database-update', handleDatabaseUpdate);
  }, [selectedDept, selectedRole, selectedStatus]);

  useEffect(() => {
    fetchUsers();
  }, [selectedDept, selectedRole, selectedStatus]);

  const handleRoleChange = async (user_id: number, newRole: string) => {
    try {
      await api.put(`/users/${user_id}/role`, { role: newRole });
      setAlert({ type: 'success', message: 'User role updated successfully.' });
      fetchUsers();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.detail || (language === 'hi' ? 'उपयोगकर्ता भूमिका अपडेट करने में विफल।' : 'Failed to update user role.') });
    }
  };

  const handleStatusToggle = async (user: User) => {
    const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await api.put(`/users/${user.user_id}/status`, { status: nextStatus });
      setAlert({ type: 'success', message: language === 'hi' ? `उपयोगकर्ता की स्थिति बदलकर ${nextStatus === 'Active' ? 'सक्रिय' : 'निष्क्रिय'} कर दी गई है।` : `User status changed to ${nextStatus}.` });
      fetchUsers();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.detail || (language === 'hi' ? 'उपयोगकर्ता की स्थिति अपडेट करने में विफल।' : 'Failed to update user status.') });
    }
  };

  const handleDeleteUser = async (user_id: number) => {
    if (!window.confirm(language === 'hi' ? 'क्या आप वाकई इस उपयोगकर्ता कर्मचारी खाते को स्थायी रूप से हटाना चाहते हैं?' : 'Are you sure you want to permanently delete this user employee account?')) return;
    try {
      await api.delete(`/users/${user_id}`);
      setAlert({ type: 'success', message: t('users.deleted') });
      fetchUsers();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.detail || (language === 'hi' ? 'उपयोगकर्ता को हटाने में विफल।' : 'Failed to delete user.') });
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || newPassword.length < 6) return;
    setResetSubmitting(true);
    try {
      await api.put(`/users/${resettingUser.user_id}/reset-password`, { new_password: newPassword });
      setAlert({ type: 'success', message: language === 'hi' ? `${resettingUser.full_name} के लिए पासवर्ड सफलतापूर्वक रीसेट किया गया।` : `Password reset successfully for ${resettingUser.full_name}.` });
      setResettingUser(null);
      setNewPassword('');
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.detail || (language === 'hi' ? 'पासवर्ड रीसेट विफल रहा।' : 'Password reset failed.') });
    } finally {
      setResetSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'completed';
      case 'Pending': return 'pending';
      default: return 'delayed';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ borderBottomColor: 'var(--border-subtle)' }}>
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl font-outfit" style={{ color: 'var(--text-heading)' }}>{t('users.title')}</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('users.subtitle')}</p>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center space-x-2 self-start sm:self-center">
          <div className="bg-primary-bg-2 p-1 rounded-lg border border-primary/10 flex items-center space-x-1">
            <button
              onClick={() => handleViewModeChange('list')}
              className={`p-1.5 rounded-md transition-all duration-200 cursor-pointer ${
                viewMode === 'list' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-primary-light hover:bg-white/50'
              }`}
              title={language === 'hi' ? 'सूची दृश्य' : 'List View'}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`p-1.5 rounded-md transition-all duration-200 cursor-pointer ${
                viewMode === 'grid' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-primary-light hover:bg-white/50'
              }`}
              title={language === 'hi' ? 'ग्रिड दृश्य' : 'Grid View'}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {alert && (
        <div className="flex items-center justify-between rounded-lg border p-4 text-xs animate-fadeIn" style={{ backgroundColor: alert.type === 'error' ? 'var(--badge-danger-bg)' : 'var(--badge-success-bg)', color: alert.type === 'error' ? 'var(--badge-danger-txt)' : 'var(--badge-success-txt)', borderColor: alert.type === 'error' ? 'var(--badge-danger-txt)' : 'var(--badge-success-txt)' }}>
          <span>{alert.message}</span>
          <button onClick={() => setAlert(null)} className="font-semibold uppercase tracking-wider text-[10px] cursor-pointer">{t('common.dismiss')}</button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div 
        className="flex flex-wrap items-center gap-4 rounded-lg border p-4 shadow-sm"
        style={{
          backgroundColor: 'var(--bg-surface-2)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="flex items-center" style={{ color: 'var(--color-primary)' }}>
          <Filter className="mr-2 h-4 w-4" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">{t('users.filters_label')}</span>
        </div>
        
        {/* Department Filter */}
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          style={{
            background: 'var(--input-bg)',
            borderColor: 'var(--input-border)',
            color: 'var(--input-text)'
          }}
          className="rounded-lg border px-3 py-1.5 text-xs focus:outline-none transition duration-150 cursor-pointer font-medium"
        >
          <option value="">{t('projects.all_depts')}</option>
          {departments.map(d => (
            <option key={d.department_id} value={d.department_name}>{getTranslatedDept(d.department_name)}</option>
          ))}
        </select>

        {/* Role Filter */}
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          style={{
            background: 'var(--input-bg)',
            borderColor: 'var(--input-border)',
            color: 'var(--input-text)'
          }}
          className="rounded-lg border px-3 py-1.5 text-xs focus:outline-none transition duration-150 cursor-pointer font-medium"
        >
          <option value="">{t('users.all_roles')}</option>
          <option value="Admin">{t('users.role.admin')}</option>
          <option value="Manager">{t('users.role.manager')}</option>
          <option value="Operator">{t('users.role.operator')}</option>
          <option value="Viewer">{t('users.role.viewer')}</option>
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{
            background: 'var(--input-bg)',
            borderColor: 'var(--input-border)',
            color: 'var(--input-text)'
          }}
          className="rounded-lg border px-3 py-1.5 text-xs focus:outline-none transition duration-150 cursor-pointer font-medium"
        >
          <option value="">{t('users.all_statuses')}</option>
          <option value="Pending">{t('users.status.pending')}</option>
          <option value="Active">{t('users.status.active')}</option>
          <option value="Inactive">{t('users.status.inactive')}</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={32} label={t('users.loading')} />
        </div>
      ) : users.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-hint)' }}>
          <AlertTriangle className="h-8 w-8 stroke-1" style={{ color: 'var(--text-primary)' }} />
          <span className="mt-2 text-xs font-medium">{t('users.no_users')}</span>
        </div>
      ) : viewMode === 'list' ? (
        <Table headers={[t('users.name_id'), t('users.contact_info'), t('common.department'), t('users.system_role'), t('common.status'), t('common.actions')]}>
          {users.map((u, idx) => (
            <TableRow key={u.user_id} index={idx}>
              <TableCell>
                <div className="font-semibold text-text-body" style={{ color: 'var(--text-heading)' }}>{u.full_name}</div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{(language === 'hi' ? 'कर्मचारी आईडी' : 'Emp ID')}: {u.employee_id}</div>
                <div className="text-[10px] font-mono" style={{ color: 'var(--text-hint)' }}>@{u.username}</div>
              </TableCell>
              <TableCell>
                <div className="text-text-body">{u.email}</div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{u.mobile}</div>
              </TableCell>
              <TableCell>
                <span 
                  className="inline-flex rounded px-2 py-0.5 text-xs font-medium border"
                  style={{ backgroundColor: 'var(--badge-success-bg)', color: 'var(--badge-success-txt)', borderColor: 'rgba(26,92,56,0.2)' }}
                >
                  {getTranslatedDept(u.department?.department_name)}
                </span>
              </TableCell>
              <TableCell>
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                  style={{
                    background: 'var(--input-bg)',
                    borderColor: 'var(--input-border)',
                    color: 'var(--input-text)'
                  }}
                  className="rounded-lg border px-2 py-1 text-xs font-medium focus:outline-none cursor-pointer"
                >
                  <option value="Admin">{t('users.role.admin')}</option>
                  <option value="Manager">{t('users.role.manager')}</option>
                  <option value="Operator">{t('users.role.operator')}</option>
                  <option value="Viewer">{t('users.role.viewer')}</option>
                </select>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(u.status)}>
                  {t('users.status.' + u.status.toLowerCase())}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-1.5">
                  {/* Status Toggle Button */}
                  <Button
                    variant="icon"
                    onClick={() => handleStatusToggle(u)}
                    className={u.status === 'Active' ? 'text-accent-dark' : 'text-primary'}
                    title={u.status === 'Active' ? t('users.deactivate_tooltip') : t('users.activate_tooltip')}
                  >
                    {u.status === 'Active' ? <UserX className="h-4.5 w-4.5" /> : <UserCheck className="h-4.5 w-4.5" />}
                  </Button>
                  
                  {/* Password Reset Modal Trigger */}
                  <Button
                    variant="icon"
                    onClick={() => setResettingUser(u)}
                    className="hover:text-primary"
                    style={{ color: 'var(--text-muted)' }}
                    title={t('users.reset_tooltip')}
                  >
                    <Key className="h-4.5 w-4.5" />
                  </Button>
 
                  {/* Delete Button */}
                  <Button
                    variant="icon"
                    onClick={() => handleDeleteUser(u.user_id)}
                    className="text-danger hover:bg-danger-bg hover:text-danger"
                    title="Delete Account"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      ) : (
        /* Grid (Card) View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((u) => (
            <div
              key={u.user_id}
              className="bg-surface border border-primary/10 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-default)'
              }}
            >
              {/* Card Header */}
              <div className="p-4 border-b border-primary/5 bg-primary-bg-2/30 flex items-center justify-between" style={{ borderBottomColor: 'var(--border-subtle)' }}>
                <span className="text-xs font-mono font-bold text-text-hint">
                  Emp ID: {u.employee_id}
                </span>
                <Badge variant={getStatusBadgeVariant(u.status)}>
                  {t('users.status.' + u.status.toLowerCase())}
                </Badge>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 space-y-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm text-primary"
                    style={{ backgroundColor: 'var(--badge-success-bg)', color: 'var(--badge-success-txt)' }}
                  >
                    {u.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold leading-snug group-hover:text-primary transition-colors duration-200 animate-slideDown" style={{ color: 'var(--text-heading)' }}>
                      {u.full_name}
                    </h3>
                    <p className="text-[11px] font-mono" style={{ color: 'var(--text-hint)' }}>@{u.username}</p>
                  </div>
                </div>

                {/* Contact Info & Department */}
                <div className="space-y-2 text-[12px] p-3 rounded-xl border animate-fadeIn" style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border-default)' }}>
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>{language === 'hi' ? 'ईमेल' : 'Email'}:</span>
                    <span className="font-medium text-text-body truncate max-w-[150px]">{u.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>{language === 'hi' ? 'मोबाइल' : 'Mobile'}:</span>
                    <span className="font-medium text-text-body">{u.mobile}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t" style={{ borderTopColor: 'var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{t('common.department')}:</span>
                    <span 
                      className="inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium border"
                      style={{ backgroundColor: 'var(--badge-success-bg)', color: 'var(--badge-success-txt)', borderColor: 'rgba(26,92,56,0.2)' }}
                    >
                      {getTranslatedDept(u.department?.department_name)}
                    </span>
                  </div>
                </div>

                {/* System Role Selector */}
                <div className="animate-fadeIn">
                  <label className="block text-[10px] uppercase font-bold tracking-wider mb-1" style={{ color: 'var(--text-hint)' }}>
                    {t('users.system_role')}
                  </label>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--input-text)'
                    }}
                    className="w-full rounded-lg border px-3 py-1.5 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="Admin">{t('users.role.admin')}</option>
                    <option value="Manager">{t('users.role.manager')}</option>
                    <option value="Operator">{t('users.role.operator')}</option>
                    <option value="Viewer">{t('users.role.viewer')}</option>
                  </select>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3 border-t flex items-center justify-end space-x-2 bg-primary-bg-2/30" style={{ borderTopColor: 'var(--border-subtle)' }}>
                {/* Status Toggle Button */}
                <Button
                  variant="secondary"
                  onClick={() => handleStatusToggle(u)}
                  className={`!py-1.5 !px-3 text-xs flex items-center space-x-1 ${u.status === 'Active' ? 'text-accent-dark' : 'text-primary'}`}
                  title={u.status === 'Active' ? t('users.deactivate_tooltip') : t('users.activate_tooltip')}
                >
                  {u.status === 'Active' ? <UserX className="h-4 w-4 mr-1" /> : <UserCheck className="h-4 w-4 mr-1" />}
                  <span>{u.status === 'Active' ? (language === 'hi' ? 'निष्क्रिय' : 'Deactivate') : (language === 'hi' ? 'सक्रिय' : 'Activate')}</span>
                </Button>

                {/* Password Reset Modal Trigger */}
                <Button
                  variant="secondary"
                  onClick={() => setResettingUser(u)}
                  style={{ color: 'var(--text-muted)' }}
                  title={t('users.reset_tooltip')}
                  className="!py-1.5 !px-3 text-xs flex items-center space-x-1"
                >
                  <Key className="h-4 w-4" />
                  <span>{language === 'hi' ? 'रीसेट' : 'Reset'}</span>
                </Button>

                {/* Delete Button */}
                <Button
                  variant="icon"
                  onClick={() => handleDeleteUser(u.user_id)}
                  className="text-danger hover:bg-danger-bg hover:text-danger border border-transparent hover:border-danger/10 !p-1.5 rounded-lg"
                  title="Delete Account"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Password Reset Modal */}
      <Modal
        isOpen={!!resettingUser}
        onClose={() => { setResettingUser(null); setNewPassword(''); }}
        title={t('users.reset_title')}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => { setResettingUser(null); setNewPassword(''); }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleResetPasswordSubmit}
              disabled={newPassword.length < 6 || resetSubmitting}
            >
              {resetSubmitting && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
              {t('users.confirm_reset')}
            </Button>
          </>
        }
      >
        {resettingUser && (
          <div className="space-y-4">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {t('users.reset_for')} <span className="font-semibold text-primary">{resettingUser.full_name}</span>.
            </p>
            <Input
              type="password"
              label={t('users.new_password')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('users.password_min_chars')}
              required
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
