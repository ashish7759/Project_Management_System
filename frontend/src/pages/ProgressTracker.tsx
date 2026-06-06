import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  TrendingUp, 
  Edit3, 
  Calendar, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';

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
  const { t, language } = useLanguage();
  
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
      setAlert({ type: 'error', text: t('progress.failed_load') });
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
      setAlert({ 
        type: 'success', 
        text: language === 'hi' 
          ? `${activeProject.project_name} के लिए प्रगति को सफलतापूर्वक ${actualProgressInput}% पर अपडेट किया गया।` 
          : `Successfully updated progress to ${actualProgressInput}% for ${activeProject.project_name}.` 
      });
      setShowProgressModal(false);
      setProgressNotes('');
      fetchProgressOverview();
    } catch (err: any) {
      setAlert({ 
        type: 'error', 
        text: err.response?.data?.detail || (language === 'hi' ? 'प्रगति अपडेट करने में विफल।' : 'Failed to update progress.')
      });
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
      setAlert({ 
        type: 'success', 
        text: language === 'hi' 
          ? `${activeProject.project_name} के लिए ${plannedProgressInput}% का नियोजित मील का पत्थर निर्धारित किया गया।` 
          : `Planned milestone of ${plannedProgressInput}% scheduled for ${activeProject.project_name}.` 
      });
      setShowMilestoneModal(false);
      setTargetDateInput('');
      fetchProgressOverview();
    } catch (err: any) {
      setAlert({ 
        type: 'error', 
        text: err.response?.data?.detail || (language === 'hi' ? 'मील का पत्थर निर्धारित करने में विफल।' : 'Failed to schedule milestone.')
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Completed': return 'completed';
      case 'In Progress': return 'inprogress';
      case 'Pending': return 'pending';
      default: return 'delayed';
    }
  };

  const isViewer = user?.role === 'Viewer';
  const canSetMilestone = user?.role === 'Admin' || user?.role === 'Manager';
  const canUpdateProgress = !isViewer;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-primary/10">
        <h1 className="text-xl font-bold tracking-tight text-primary sm:text-2xl font-outfit">{t('progress.title')}</h1>
        <p className="text-xs text-text-muted">{t('progress.subtitle')}</p>
      </div>

      {alert && (
        <div className={`flex items-center justify-between rounded-lg border p-4 text-xs ${
          alert.type === 'error' ? 'bg-danger-bg border-danger/25 text-danger' : 'bg-primary-bg2 border-primary/25 text-primary'
        }`}>
          <span>{alert.text}</span>
          <button onClick={() => setAlert(null)} className="font-semibold uppercase tracking-wider text-[10px] cursor-pointer">{t('common.dismiss')}</button>
        </div>
      )}

      {/* Tracker Overview table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={32} label={t('progress.loading')} />
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-text-hint bg-white rounded-xl border border-primary/10">
          <AlertTriangle className="h-8 w-8 stroke-1 text-primary-light" />
          <span className="mt-2 text-xs font-medium">{t('progress.no_projects')}</span>
        </div>
      ) : (
        <Table headers={[t('projects.project_name'), t('common.department'), t('progress.planned'), t('progress.actual'), t('progress.variance'), t('common.status'), t('progress.last_updated'), ...(!isViewer ? [t('common.actions')] : [])]}>
          {items.map((item, idx) => (
            <TableRow key={item.project_id} index={idx}>
              <TableCell>
                <div className="font-semibold text-text-body">{item.project_name}</div>
                <div className="text-[11px] text-text-muted font-mono">ID: {item.project_id}</div>
              </TableCell>
              <TableCell>
                <span 
                  className="inline-flex rounded px-2 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: 'rgba(26, 92, 56, 0.08)', color: '#1a5c38' }}
                >
                  {t('dept.' + item.department_name.toLowerCase())}
                </span>
              </TableCell>
              <TableCell className="font-semibold text-text-body">
                {item.planned_progress}%
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-primary/10 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${item.actual_progress}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-text-body">{item.actual_progress}%</span>
                </div>
              </TableCell>
              <TableCell className="font-semibold">
                <span className={item.variance >= 0 ? 'text-primary' : 'text-danger'}>
                  {item.variance >= 0 ? '+' : ''}{item.variance.toFixed(1)}%
                </span>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(item.status)}>
                  {item.status === 'Completed' ? t('projects.status.completed') : 
                   item.status === 'In Progress' ? t('projects.status.inprogress') :
                   item.status === 'Pending' ? t('projects.status.pending') :
                   t('projects.status.delayed')}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-text-muted">
                {new Date(item.last_updated).toLocaleDateString()}
              </TableCell>
              {!isViewer && (
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    {/* Set Planned Milestone */}
                    {canSetMilestone && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setActiveProject(item);
                          setPlannedProgressInput(item.planned_progress);
                          setShowMilestoneModal(true);
                        }}
                        className="!py-1.5 !px-2.5 text-xs"
                        title={t('progress.set_planned_milestone')}
                      >
                        <Calendar className="mr-1 h-3.5 w-3.5" />
                        {language === 'hi' ? 'मील का पत्थर' : 'Milestone'}
                      </Button>
                    )}
                    
                    {/* Log Actual Progress */}
                    {canUpdateProgress && (
                      <Button
                        variant="primary"
                        onClick={() => {
                          setActiveProject(item);
                          setActualProgressInput(item.actual_progress);
                          setShowProgressModal(true);
                        }}
                        className="!py-1.5 !px-2.5 text-xs"
                        title={t('progress.update')}
                      >
                        <Edit3 className="mr-1 h-3.5 w-3.5" />
                        {language === 'hi' ? 'अपडेट' : 'Update'}
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </Table>
      )}

      {/* 1. Modal: Update actual progress */}
      <Modal
        isOpen={showProgressModal && !!activeProject}
        onClose={() => { setShowProgressModal(false); setProgressNotes(''); }}
        title={t('progress.update_physical_title')}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => { setShowProgressModal(false); setProgressNotes(''); }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateProgressSubmit}
              disabled={submitLoading}
            >
              {submitLoading && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
              {t('progress.confirm_update')}
            </Button>
          </>
        }
      >
        {activeProject && (
          <div className="space-y-4">
            <p className="text-xs text-text-muted">
              {t('progress.log_actual_for')} <span className="font-semibold text-primary">{activeProject.project_name}</span>.
            </p>
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase">{t('progress.actual_progress_label')}</label>
              <div className="mt-1 flex items-center space-x-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={actualProgressInput}
                  onChange={(e) => setActualProgressInput(parseInt(e.target.value))}
                  className="flex-1 accent-primary h-2 bg-primary/10 rounded-lg cursor-pointer"
                />
                <span className="font-mono font-bold text-sm w-10 text-right text-primary">{actualProgressInput}%</span>
              </div>
            </div>
            <div className="w-full flex flex-col items-start">
              <label className="text-[13px] font-medium text-primary mb-1 select-none">{t('progress.update_notes')}</label>
              <textarea
                value={progressNotes}
                onChange={(e) => setProgressNotes(e.target.value)}
                rows={3}
                className="w-full bg-white border border-primary/25 rounded-lg py-[0.6rem] px-[0.9rem] text-[13px] text-text-body placeholder-text-hint focus:outline-none focus:border-2 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-150"
                placeholder={t('progress.notes_placeholder')}
                required
              />
            </div>
          </div>
        )}
      </Modal>

      {/* 2. Modal: Set planned milestone */}
      <Modal
        isOpen={showMilestoneModal && !!activeProject}
        onClose={() => { setShowMilestoneModal(false); setTargetDateInput(''); }}
        title={t('progress.set_milestone_title')}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => { setShowMilestoneModal(false); setTargetDateInput(''); }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="accent"
              onClick={handleCreateMilestoneSubmit}
              disabled={submitLoading || !targetDateInput}
            >
              {submitLoading && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
              {t('progress.schedule_target')}
            </Button>
          </>
        }
      >
        {activeProject && (
          <div className="space-y-4">
            <p className="text-xs text-text-muted">
              {t('progress.schedule_planned_for')} <span className="font-semibold text-primary">{activeProject.project_name}</span>.
            </p>
            <Input
              type="date"
              label={t('progress.target_date_label')}
              value={targetDateInput}
              onChange={(e) => setTargetDateInput(e.target.value)}
              required
            />
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase">{t('progress.target_milestone_label')}</label>
              <div className="mt-1 flex items-center space-x-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={plannedProgressInput}
                  onChange={(e) => setPlannedProgressInput(parseInt(e.target.value))}
                  className="flex-1 accent-accent h-2 bg-primary/10 rounded-lg cursor-pointer"
                />
                <span className="font-mono font-bold text-sm w-10 text-right text-accent-dark">{plannedProgressInput}%</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProgressTracker;
