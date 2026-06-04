import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AuditLog } from '../types';
import { 
  ShieldCheck, 
  Search, 
  Download, 
  Filter, 
  Loader2, 
  AlertTriangle,
  FileCode
} from 'lucide-react';

const AuditTrail: React.FC = () => {
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
      setAlert({ type: 'error', text: 'Failed to retrieve system audit records.' });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">System Audit Trail</h1>
          <p className="text-sm text-slate-500">Security history auditing logins, OCR classifications, progress adjustments, and RBAC changes.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800"
        >
          <Download className="mr-2 h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {alert && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <span>{alert.text}</span>
          <button onClick={() => setAlert(null)} className="font-semibold uppercase tracking-wider text-xs">Dismiss</button>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* Username search */}
        <div className="relative flex-1 min-w-[150px]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="block w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none"
            placeholder="Filter by Username..."
          />
        </div>

        {/* Action Type search */}
        <div className="relative flex-1 min-w-[150px]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Filter className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="block w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none"
            placeholder="e.g. Login Success..."
          />
        </div>

        {/* Start date range */}
        <div className="flex items-center space-x-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase">From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none"
          />
        </div>

        {/* End date range */}
        <div className="flex items-center space-x-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase">To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-slate-400">
            <ShieldCheck className="h-8 w-8 stroke-1" />
            <span className="mt-2 text-sm font-medium">No audit events logged.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Log ID</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Module</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                {logs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-slate-50/75">
                    <td className="px-6 py-4 font-mono font-semibold text-slate-500">
                      #{log.log_id}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {log.username || 'SYSTEM'}
                      <span className="block text-[10px] font-normal text-slate-400 font-mono">User ID: {log.user_id || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800 border border-slate-150">
                        {log.action_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-650 font-semibold">{log.module}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500">
                      {log.ip_address || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {log.details ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center text-xs font-semibold text-primary-500 hover:text-primary-650"
                        >
                          <FileCode className="mr-1 h-3.5 w-3.5" />
                          View Metadata
                        </button>
                      ) : (
                        <span className="text-slate-350 text-xs">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details JSON Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Audit Log Details</h3>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-650 uppercase"
              >
                Close
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[9px]">Action</span>
                  <p className="text-slate-800 font-semibold">{selectedLog.action_type}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[9px]">Timestamp</span>
                  <p className="text-slate-800">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <span className="font-bold text-slate-400 uppercase text-[9px]">Logged JSON Details</span>
                <pre className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-[10px] text-slate-700 overflow-x-auto">
                  {JSON.stringify(JSON.parse(selectedLog.details || '{}'), null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditTrail;
