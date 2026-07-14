import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AuditLog } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { 
  ShieldCheck, 
  Search, 
  Download, 
  Filter, 
  FileCode,
  AlertTriangle
} from 'lucide-react';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';

const AuditTrail: React.FC = () => {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [username, setUsername] = useState('');
  const [actionType, setActionType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Details Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Alerts
  const [alert, setAlert] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (username) params.username = username;
      if (actionType) params.action_type = actionType;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await api.get('/audit-logs', { params });
      setLogs(res.data);
    } catch (err) {
      setAlert({ type: 'error', text: t('audit.failed_retrieve') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [username, actionType, startDate, endDate]);

  const handleExportCSV = async () => {
    setAlert(null);
    try {
      const params: any = {};
      if (username) params.username = username;
      if (actionType) params.action_type = actionType;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await api.get('/audit-logs/export', {
        params,
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_log_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setAlert({ 
        type: 'error', 
        text: language === 'hi' 
          ? 'ऑडिट लॉग निर्यात करने में विफल। कृपया पुन: प्रयास करें।' 
          : 'Failed to export audit logs. Please try again.' 
      });
    }
  };

  const getActionBadgeStyle = (action: string): React.CSSProperties => {
    const act = action.toUpperCase();
    if (act.includes('LOGIN') || act.includes('APPROVE') || act.includes('REPORT')) {
      return { background: 'var(--badge-success-bg)', color: 'var(--badge-success-txt)', borderColor: 'rgba(26,92,56,0.3)' };
    } else if (act.includes('UPLOAD') || act.includes('MODIFY') || act.includes('UPDATE')) {
      return { background: 'var(--badge-warning-bg)', color: 'var(--badge-warning-txt)', borderColor: 'rgba(201,168,76,0.25)' };
    } else if (act.includes('REJECT') || act.includes('DELETE')) {
      return { background: 'var(--badge-danger-bg)', color: 'var(--badge-danger-txt)', borderColor: 'rgba(185,28,28,0.2)' };
    }
    return { background: 'var(--bg-surface-hover)', color: 'var(--text-muted)', borderColor: 'var(--border-default)' };
  };

  return (
    <div className="space-y-6">
      {/* Header Strip */}
      <div 
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-xl shadow border"
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div className="text-white space-y-0.5">
          <h1 className="text-lg font-bold tracking-tight font-outfit">{t('audit.title')}</h1>
          <p className="text-xs text-white/70">{t('audit.subtitle')}</p>
        </div>
        <Button
          variant="accent"
          onClick={handleExportCSV}
          className="shrink-0 font-bold"
        >
          <Download className="mr-1.5 h-4 w-4" />
          {t('audit.export_csv')}
        </Button>
      </div>

      {alert && (
        <div className="flex items-center justify-between rounded-lg border p-4 text-xs animate-fadeIn" style={{ backgroundColor: 'var(--badge-danger-bg)', color: 'var(--badge-danger-txt)', borderColor: 'var(--badge-danger-txt)' }}>
          <span>{alert.text}</span>
          <button onClick={() => setAlert(null)} className="font-semibold uppercase tracking-wider text-[10px] cursor-pointer">{t('common.dismiss')}</button>
        </div>
      )}

      {/* Filters Toolbar */}
      <div 
        className="flex flex-wrap items-center gap-4 rounded-lg border p-4 shadow-sm"
        style={{
          backgroundColor: 'var(--bg-surface-2)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="flex items-center" style={{ color: 'var(--text-primary)' }}>
          <Filter className="mr-1.5 h-4 w-4" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">{t('audit.filters_label')}</span>
        </div>

        {/* Username search */}
        <div className="relative flex-1 min-w-[150px]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3" style={{ color: 'var(--text-muted)' }}>
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              background: 'var(--input-bg)',
              borderColor: 'var(--input-border)',
              color: 'var(--input-text)'
            }}
            className="block w-full rounded-lg pl-9 pr-3 py-1.5 text-xs placeholder-text-hint focus:outline-none transition duration-150"
            placeholder={t('audit.filter_username')}
          />
        </div>

        {/* Action Type search */}
        <div className="relative flex-1 min-w-[150px]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3" style={{ color: 'var(--text-muted)' }}>
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            style={{
              background: 'var(--input-bg)',
              borderColor: 'var(--input-border)',
              color: 'var(--input-text)'
            }}
            className="block w-full rounded-lg pl-9 pr-3 py-1.5 text-xs placeholder-text-hint focus:outline-none transition duration-150"
            placeholder={t('audit.filter_action_placeholder')}
          />
        </div>

        {/* Start date range */}
        <div className="flex items-center space-x-2">
          <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>{t('audit.from')}</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              background: 'var(--input-bg)',
              borderColor: 'var(--input-border)',
              color: 'var(--input-text)'
            }}
            className="rounded-lg border px-2 py-1 text-xs focus:outline-none transition duration-150 cursor-pointer"
          />
        </div>

        {/* End date range */}
        <div className="flex items-center space-x-2">
          <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>{t('audit.to')}</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              background: 'var(--input-bg)',
              borderColor: 'var(--input-border)',
              color: 'var(--input-text)'
            }}
            className="rounded-lg border px-2 py-1 text-xs focus:outline-none transition duration-150 cursor-pointer"
          />
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={32} label={t('audit.loading')} />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-hint)' }}>
          <ShieldCheck className="h-8 w-8 stroke-1 text-primary-light" />
          <span className="mt-2 text-xs font-medium">{t('audit.no_logs')}</span>
        </div>
      ) : (
        <Table headers={[t('audit.log_id'), t('audit.user'), t('audit.action'), t('audit.module'), t('audit.ip'), t('audit.timestamp'), t('audit.details')]}>
          {logs.map((log, idx) => (
            <TableRow key={log.log_id} index={idx}>
              <TableCell className="font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                #{log.log_id}
              </TableCell>
              <TableCell>
                <div className="font-semibold text-text-body" style={{ color: 'var(--text-heading)' }}>{log.username || 'SYSTEM'}</div>
                <div className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{(language === 'hi' ? 'उपयोगकर्ता आईडी' : 'User ID')}: {log.user_id || 'N/A'}</div>
              </TableCell>
              <TableCell>
                <span 
                  className="inline-flex rounded-full py-[3px] px-[10px] text-[11px] font-semibold border"
                  style={getActionBadgeStyle(log.action_type)}
                >
                  {log.action_type}
                </span>
              </TableCell>
              <TableCell className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {log.module}
              </TableCell>
              <TableCell className="font-mono" style={{ color: 'var(--text-muted)' }}>
                {log.ip_address || 'N/A'}
              </TableCell>
              <TableCell style={{ color: 'var(--text-muted)' }}>
                {new Date(log.timestamp).toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                {log.details ? (
                  <Button
                    variant="icon"
                    onClick={() => setSelectedLog(log)}
                    title="View Metadata JSON"
                  >
                    <FileCode className="h-4.5 w-4.5" />
                  </Button>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--text-hint)' }}>N/A</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      {/* Details JSON Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={t('audit.details_title')}
        footer={
          <Button
            variant="secondary"
            onClick={() => setSelectedLog(null)}
          >
            {t('common.close')}
          </Button>
        }
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-bold uppercase text-[9px]" style={{ color: 'var(--text-hint)' }}>{t('audit.action')}</span>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedLog.action_type}</p>
              </div>
              <div>
                <span className="font-bold uppercase text-[9px]" style={{ color: 'var(--text-hint)' }}>{t('audit.timestamp')}</span>
                <p style={{ color: 'var(--text-body)' }}>{new Date(selectedLog.timestamp).toLocaleString()}</p>
              </div>
            </div>
            
            <div>
              <span className="font-bold uppercase text-[9px]" style={{ color: 'var(--text-hint)' }}>{t('audit.logged_json')}</span>
              <pre 
                className="mt-1 block w-full rounded-lg border p-4 font-mono text-[10px] overflow-x-auto"
                style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border-default)', color: 'var(--text-body)' }}
              >
                {JSON.stringify(JSON.parse(selectedLog.details || '{}'), null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditTrail;
