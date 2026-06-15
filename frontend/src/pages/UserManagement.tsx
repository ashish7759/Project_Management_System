import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { User, Department } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { 
  Trash2, 
  UserCheck, 
  UserX, 
  Key, 
  Filter, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';

const UserManagement: React.FC = () => {
  const { t, language, getTranslatedDept } = useLanguage();
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
      <div className="pb-4 border-b border-primary/10">
        <h1 className="text-xl font-bold tracking-tight text-primary sm:text-2xl font-outfit">{t('users.title')}</h1>
        <p className="text-xs text-text-muted">{t('users.subtitle')}</p>
      </div>

      {alert && (
        <div className={`flex items-center justify-between rounded-lg border p-4 text-xs ${
          alert.type === 'error' ? 'bg-danger-bg border-danger/25 text-danger' : 'bg-primary-bg2 border-primary/25 text-primary'
        }`}>
          <span>{alert.message}</span>
          <button onClick={() => setAlert(null)} className="font-semibold uppercase tracking-wider text-[10px] cursor-pointer">{t('common.dismiss')}</button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div 
        className="flex flex-wrap items-center gap-4 rounded-lg border p-4 shadow-sm"
        style={{
          backgroundColor: '#f7faf8',
          borderColor: 'rgba(26, 92, 56, 0.12)'
        }}
      >
        <div className="flex items-center text-primary-light">
          <Filter className="mr-2 h-4 w-4" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">{t('users.filters_label')}</span>
        </div>
        
        {/* Department Filter */}
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="rounded-lg border border-primary/20 bg-white px-3 py-1.5 text-xs text-text-body focus:outline-none focus:border-primary transition duration-150 cursor-pointer"
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
          className="rounded-lg border border-primary/20 bg-white px-3 py-1.5 text-xs text-text-body focus:outline-none focus:border-primary transition duration-150 cursor-pointer"
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
          className="rounded-lg border border-primary/20 bg-white px-3 py-1.5 text-xs text-text-body focus:outline-none focus:border-primary transition duration-150 cursor-pointer"
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
        <div className="flex h-64 flex-col items-center justify-center text-text-hint bg-white rounded-xl border border-primary/10">
          <AlertTriangle className="h-8 w-8 stroke-1 text-primary-light" />
          <span className="mt-2 text-xs font-medium">{t('users.no_users')}</span>
        </div>
      ) : (
        <Table headers={[t('users.name_id'), t('users.contact_info'), t('common.department'), t('users.system_role'), t('common.status'), t('common.actions')]}>
          {users.map((u, idx) => (
            <TableRow key={u.user_id} index={idx}>
              <TableCell>
                <div className="font-semibold text-text-body">{u.full_name}</div>
                <div className="text-[11px] text-text-muted">{(language === 'hi' ? 'कर्मचारी आईडी' : 'Emp ID')}: {u.employee_id}</div>
                <div className="text-[10px] font-mono text-text-hint">@{u.username}</div>
              </TableCell>
              <TableCell>
                <div className="text-text-body">{u.email}</div>
                <div className="text-[11px] text-text-muted">{u.mobile}</div>
              </TableCell>
              <TableCell>
                <span 
                  className="inline-flex rounded px-2 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: 'rgba(26, 92, 56, 0.08)', color: '#1a5c38' }}
                >
                  {getTranslatedDept(u.department?.department_name)}
                </span>
              </TableCell>
              <TableCell>
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                  className="rounded-lg border border-primary/20 bg-white px-2 py-1 text-xs font-medium text-text-body focus:outline-none focus:border-primary cursor-pointer"
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
                    className="text-text-muted hover:text-primary"
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
            <p className="text-xs text-text-muted">
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
