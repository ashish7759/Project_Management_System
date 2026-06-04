import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  Edit3, 
  Calendar, 
  Loader2, 
  AlertTriangle,
  CheckCircle,
  Plus
} from 'lucide-react';

interface ProgressOverview {
  project_id: string;
  project_name: string;
  department_name: string;
  planned_progress: number;
  actual_progress: number;
  variance: number;
  status: string;
  last_updated: string;
}

const ProgressTracker: React.FC = () => {
  const { user } = useAuth();
  
  const [items, setItems] = useState<ProgressOverview[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal forms states
  const [activeProject, setActiveProject] = useState<ProgressOverview | null>(null);
  
  // 1. Update actual progress modal
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [actualProgressInput, setActualProgressInput] = useState<number>(0);
  const [progressNotes, setProgressNotes] = useState('');
  
  // 2. Set planned milestone modal
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [targetDateInput, setTargetDateInput] = useState('');
  const [plannedProgressInput, setPlannedProgressInput] = useState<number>(0);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const fetchProgressOverview = async () => {
    setLoading(true);
    try {
      const res = await api.get('/progress');
      setItems(res.data);
    } catch (err) {
      setAlert({ type: 'error', text: 'Failed to retrieve progress tracking records.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressOverview();
  }, []);

  const handleUpdateProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;
    setSubmitLoading(true);
    setAlert(null);
    try {
      await api.put(`/progress/${activeProject.project_id}`, {
        actual_progress: actualProgressInput,
        notes: progressNotes
      });
      setAlert({ type: 'success', text: `Successfully updated progress to ${actualProgressInput}% for ${activeProject.project_name}.` });
      setShowProgressModal(false);
      setProgressNotes('');
      fetchProgressOverview();
    } catch (err: any) {
      setAlert({ type: 'error', text: err.response?.data?.detail || 'Failed to update progress.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCreateMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !targetDateInput) return;
    setSubmitLoading(true);
    setAlert(null);
    try {
      await api.post(`/progress/${activeProject.project_id}/milestones`, {
        target_date: targetDateInput,
        planned_progress: plannedProgressInput
      });
      setAlert({ type: 'success', text: `Planned milestone of ${plannedProgressInput}% scheduled for ${activeProject.project_name}.` });
      setShowMilestoneModal(false);
      setTargetDateInput('');
      fetchProgressOverview();
    } catch (err: any) {
      setAlert({ type: 'error', text: err.response?.data?.detail || 'Failed to schedule milestone.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Delayed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const isOperator = user?.role === 'Operator';
  const isViewer = user?.role === 'Viewer';
  // Manager or Admin can set planned milestones
  const canSetMilestone = user?.role === 'Admin' || user?.role === 'Manager';
  // Operator or Manager or Admin can update actual progress
  const canUpdateProgress = !isViewer;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Progress Tracker</h1>
        <p className="text-sm text-slate-500">Record physical grid progress, log construction notes, and align project milestones.</p>
      </div>

      {alert && (
        <div className={`flex items-center justify-between rounded-lg border p-4 text-sm ${
          alert.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'
        }`}>
          <span>{alert.text}</span>
          <button onClick={() => setAlert(null)} className="font-semibold uppercase tracking-wider text-xs">Dismiss</button>
        </div>
      )}

      {/* Tracker Overview table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-slate-400">
            <AlertTriangle className="h-8 w-8 stroke-1" />
            <span className="mt-2 text-sm font-medium">No projects are loaded in the system yet.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Project Name</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Planned %</th>
                  <th className="px-6 py-4">Actual Progress %</th>
                  <th className="px-6 py-4">Variance</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Updated</th>
                  {!isViewer && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                {items.map((item) => (
                  <tr key={item.project_id} className="hover:bg-slate-50/75">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{item.project_name}</div>
                      <div className="text-xs text-slate-400 font-mono">ID: {item.project_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                        {item.department_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {item.planned_progress}%
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-primary-500 h-full rounded-full"
                            style={{ width: `${item.actual_progress}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold text-slate-900">{item.actual_progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      <span className={item.variance >= 0 ? 'text-green-600' : 'text-red-500'}>
                        {item.variance >= 0 ? '+' : ''}{item.variance.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded px-2 py-0.5 text-xs font-bold ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(item.last_updated).toLocaleDateString()}
                    </td>
                    {!isViewer && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Set Planned Milestone */}
                          {canSetMilestone && (
                            <button
                              onClick={() => {
                                setActiveProject(item);
                                setPlannedProgressInput(item.planned_progress);
                                setShowMilestoneModal(true);
                              }}
                              className="inline-flex items-center rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-650 hover:bg-slate-50 shadow-sm"
                              title="Set Planned Milestones"
                            >
                              <Calendar className="mr-1 h-3.5 w-3.5" />
                              Milestone
                            </button>
                          )}
                          
                          {/* Log Actual Progress */}
                          {canUpdateProgress && (
                            <button
                              onClick={() => {
                                setActiveProject(item);
                                setActualProgressInput(item.actual_progress);
                                setShowProgressModal(true);
                              }}
                              className="inline-flex items-center rounded bg-primary-500 px-2 py-1 text-xs font-semibold text-white hover:bg-primary-600 shadow-sm"
                              title="Update Actual Progress"
                            >
                              <Edit3 className="mr-1 h-3.5 w-3.5" />
                              Update
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 1. Modal: Update actual progress */}
      {showProgressModal && activeProject && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-primary-500" />
              Update Physical Progress
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Log actual progress for <span className="font-semibold text-slate-700">{activeProject.project_name}</span>.
            </p>
            <form onSubmit={handleUpdateProgressSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase">Actual Progress %</label>
                <div className="mt-1 flex items-center space-x-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={actualProgressInput}
                    onChange={(e) => setActualProgressInput(parseInt(e.target.value))}
                    className="flex-1 accent-primary-500 h-2 bg-slate-100 rounded-lg cursor-pointer"
                  />
                  <span className="font-mono font-bold text-sm w-10 text-right">{actualProgressInput}%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase">Update Notes</label>
                <textarea
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 shadow focus:border-primary-500 focus:outline-none"
                  placeholder="Notes on current physical progress state..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowProgressModal(false); setProgressNotes(''); }}
                  className="rounded-lg border border-slate-250 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="inline-flex items-center rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-primary-600 disabled:opacity-50"
                >
                  {submitLoading && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                  Confirm Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Set planned milestone */}
      {showMilestoneModal && activeProject && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-amber-500" />
              Set Planned Milestone
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Schedule targeted planned % for <span className="font-semibold text-slate-700">{activeProject.project_name}</span>.
            </p>
            <form onSubmit={handleCreateMilestoneSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase">Target Date</label>
                <input
                  type="date"
                  value={targetDateInput}
                  onChange={(e) => setTargetDateInput(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 shadow focus:border-primary-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase">Target Milestone Progress %</label>
                <div className="mt-1 flex items-center space-x-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={plannedProgressInput}
                    onChange={(e) => setPlannedProgressInput(parseInt(e.target.value))}
                    className="flex-1 accent-amber-500 h-2 bg-slate-100 rounded-lg cursor-pointer"
                  />
                  <span className="font-mono font-bold text-sm w-10 text-right">{plannedProgressInput}%</span>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowMilestoneModal(false); setTargetDateInput(''); }}
                  className="rounded-lg border border-slate-250 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading || !targetDateInput}
                  className="inline-flex items-center rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-amber-600 disabled:opacity-50"
                >
                  {submitLoading && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                  Schedule Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;
