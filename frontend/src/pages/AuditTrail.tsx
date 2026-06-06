import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AuditLog } from '../types';
import { useLanguage } from '../context/LanguageContext';
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

  const handleExportCSV = () => {
    const queryParts = [];
    if (username) queryParts.push(`username=${username}`);
    if (actionType) queryParts.push(`action_type=${actionType}`);
    if (startDate) queryParts.push(`start_date=${startDate}`);
    if (endDate) queryParts.push(`end_date=${endDate}`);

    const token = localStorage.getItem('token');
    if (token) queryParts.push(`token=${token}`);

    const exportUrl = `http://localhost:8000/api/v1/audit-logs/export?${queryParts.join('&')}`;
    window.open(exportUrl, '_blank');
  };

  const getActionBadgeClass = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('LOGIN')) {
      return 'bg-primary-bg2 text-primary border-primary/30';
    } else if (act.includes('UPLOAD')) {
      return 'bg-warning-bg text-accent-dark border-accent/40';
    } else if (act.includes('APPROVE')) {
      return 'bg-primary-bg2 text-primary border-primary/30';
    } else if (act.includes('REJECT') || act.includes('DELETE')) {
      return 'bg-danger-bg text-danger border-danger/20';
    } else if (act.includes('MODIFY') || act.includes('UPDATE')) {
      return 'bg-warning-bg text-accent-dark border-accent/40';
    } else if (act.includes('REPORT')) {
      return 'bg-primary-bg2 text-primary border-primary/30';
    }
    return 'bg-primary-bg text-primary-light border-primary/20';
  };

  return (
    <div className="space-y-6">
      {/* Header Strip */}
      <div 
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-xl shadow border border-primary/10"
        style={{
          backgroundColor: '#1a5c38'
        }}
      >
        <div className="text-white space-y-0.5">
          <h1 className="text-lg font-bold tracking-tight font-outfit">{t('audit.title')}</h1>
          <p className="text-xs text-white/70">{t('audit.subtitle')}</p>
        </div>
        <Button
          variant="accent"
          onClick={handleExportCSV}
          className="shrink-0"
        >
          <Download className="mr-1.5 h-4 w-4" />
          {t('audit.export_csv')}
        </Button>
      </div>

      {alert && (
        <div className="flex items-center justify-between rounded-lg border border-danger/25 bg-danger-bg p-4 text-xs text-danger">
          <span>{alert.text}</span>
          <button onClick={() => setAlert(null)} className="font-semibold uppercase tracking-wider text-[10px] cursor-pointer">{t('common.dismiss')}</button>
        </div>
      )}

      {/* Filters Toolbar */}
      <div 
        className="flex flex-wrap items-center gap-4 rounded-lg border p-4 shadow-sm"
        style={{
          backgroundColor: '#f7faf8',
          borderColor: 'rgba(26, 92, 56, 0.12)'
        }}
      >
        <div className="flex items-center text-primary-light">
          <Filter className="mr-1.5 h-4 w-4" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">{t('audit.filters_label')}</span>
        </div>

        {/* Username search */}
        <div className="relative flex-1 min-w-[150px]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-primary-light">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="block w-full rounded-lg border border-primary/20 bg-white pl-9 pr-3 py-1.5 text-xs text-text-body placeholder-text-hint focus:outline-none focus:border-primary transition duration-150"
            placeholder={t('audit.filter_username')}
          />
        </div>

        {/* Action Type search */}
        <div className="relative flex-1 min-w-[150px]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-primary-light">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="block w-full rounded-lg border border-primary/20 bg-white pl-9 pr-3 py-1.5 text-xs text-text-body placeholder-text-hint focus:outline-none focus:border-primary transition duration-150"
            placeholder={t('audit.filter_action_placeholder')}
          />
        </div>

        {/* Start date range */}
        <div className="flex items-center space-x-2">
          <label className="text-[10px] font-bold text-text-muted uppercase">{t('audit.from')}</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-primary/20 bg-white px-2 py-1 text-xs text-text-body focus:outline-none focus:border-primary transition duration-150 cursor-pointer"
          />
        </div>

        {/* End date range */}
        <div className="flex items-center space-x-2">
          <label className="text-[10px] font-bold text-text-muted uppercase">{t('audit.to')}</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-primary/20 bg-white px-2 py-1 text-xs text-text-body focus:outline-none focus:border-primary transition duration-150 cursor-pointer"
          />
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={32} label={t('audit.loading')} />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-text-hint bg-white rounded-xl border border-primary/10">
          <ShieldCheck className="h-8 w-8 stroke-1 text-primary-light" />
          <span className="mt-2 text-xs font-medium">{t('audit.no_logs')}</span>
        </div>
      ) : (
        <Table headers={[t('audit.log_id'), t('audit.user'), t('audit.action'), t('audit.module'), t('audit.ip'), t('audit.timestamp'), t('audit.details')]}>
          {logs.map((log, idx) => (
            <TableRow key={log.log_id} index={idx}>
              <TableCell className="font-mono font-semibold text-primary-light">
                #{log.log_id}
              </TableCell>
              <TableCell>
                <div className="font-semibold text-text-body">{log.username || 'SYSTEM'}</div>
                <div className="text-[10px] text-text-muted font-mono">{(language === 'hi' ? 'उपयोगकर्ता आईडी' : 'User ID')}: {log.user_id || 'N/A'}</div>
              </TableCell>
              <TableCell>
                <span className={`inline-flex rounded-full py-[3px] px-[10px] text-[11px] font-semibold border ${getActionBadgeClass(log.action_type)}`}>
                  {log.action_type}
                </span>
              </TableCell>
              <TableCell className="font-semibold text-primary-light">
                {log.module}
              </TableCell>
              <TableCell className="font-mono text-text-muted">
                {log.ip_address || 'N/A'}
              </TableCell>
              <TableCell className="text-text-muted">
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
                  <span className="text-text-hint text-xs">N/A</span>
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
                <span className="font-bold text-text-hint uppercase text-[9px]">{t('audit.action')}</span>
                <p className="text-primary font-semibold">{selectedLog.action_type}</p>
              </div>
              <div>
                <span className="font-bold text-text-hint uppercase text-[9px]">{t('audit.timestamp')}</span>
                <p className="text-text-body">{new Date(selectedLog.timestamp).toLocaleString()}</p>
              </div>
            </div>
            
            <div>
              <span className="font-bold text-text-hint uppercase text-[9px]">{t('audit.logged_json')}</span>
              <pre className="mt-1 block w-full rounded-lg border border-primary/10 bg-primary-bg p-4 font-mono text-[10px] text-text-body overflow-x-auto">
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
