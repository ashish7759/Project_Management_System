import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Plus, 
  Search, 
  Cpu, 
  Send,
  Loader2,
  ChevronRight,
  Sparkles,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { Table, TableRow, TableCell } from '../components/ui/Table';

interface Project {
  project_id: string;
  project_name: string;
}

interface IssueAction {
  action_id: number;
  issue_id: number;
  action_type: string;
  action_date: string;
  meeting_date?: string;
  notes?: string;
  document_path?: string;
  document_name?: string;
  taken_by?: string;
}

interface ProjectIssue {
  issue_id: number;
  project_id: string;
  project_name: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  reported_by: string;
  reported_date: string;
  resolution_notes?: string;
  resolved_date?: string;
  resolved_by?: string;
  ai_suggestions?: string;
  actions?: IssueAction[];
}


const IssueTracker: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { theme } = useTheme();

  // State
  const [issues, setIssues] = useState<ProjectIssue[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter States
  const [filterSearch, setFilterSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');

  // Modals state
  const [showLogModal, setShowLogModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<ProjectIssue | null>(null);

  // Form States (New Issue)
  const [newProjectId, setNewProjectId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSeverity, setNewSeverity] = useState('Medium');

  // Form States (Resolve Issue)
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Form States (Record Action / Meeting)
  const [actionType, setActionType] = useState('Meeting');
  const [actionNotes, setActionNotes] = useState('');
  const [actionMeetingDate, setActionMeetingDate] = useState('');
  const [actionStatus, setActionStatus] = useState('');
  const [actionFile, setActionFile] = useState<File | null>(null);


  const canWrite = user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'Operator';

  // Tab handling: 'log' or 'instant'
  const [activeTab, setActiveTab] = useState<'log' | 'instant'>('log');

  // Instant solution finder states
  const [instantTitle, setInstantTitle] = useState('');
  const [instantDesc, setInstantDesc] = useState('');
  const [instantProject, setInstantProject] = useState('');
  const [instantLoading, setInstantLoading] = useState(false);
  const [instantResult, setInstantResult] = useState<string | null>(null);
  const [instantError, setInstantError] = useState<string | null>(null);

  const handleInstantSuggest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instantTitle.trim() || !instantDesc.trim()) return;

    setInstantLoading(true);
    setInstantResult(null);
    setInstantError(null);

    try {
      const res = await api.post('/issues/instant-suggest', {
        title: instantTitle,
        description: instantDesc,
        project_id: instantProject || null
      });
      setInstantResult(res.data.suggestions);
    } catch (err: any) {
      setInstantError(language === 'hi' ? 'एआई समाधान प्राप्त करने में विफल।' : 'Failed to retrieve AI solution.');
    } finally {
      setInstantLoading(false);
    }
  };

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await api.get('/issues');
      setIssues(res.data);
    } catch (err: any) {
      setAlert({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to load issues.'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to load projects list.', err);
    }
  };

  useEffect(() => {
    fetchIssues();
    fetchProjects();
    
    // Listen for realtime updates
    const handleDatabaseUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const changes = customEvent.detail?.changes || [];
      const hasIssueChanges = changes.some((c: any) => c.table === 'project_issue');
      if (hasIssueChanges) {
        console.log('[Realtime] Re-fetching issues due to database changes.');
        fetchIssues();
      }
    };
    window.addEventListener('database-update', handleDatabaseUpdate);
    return () => window.removeEventListener('database-update', handleDatabaseUpdate);
  }, []);

  const handleLogIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectId || !newTitle) return;

    setBtnLoading(true);
    setAlert(null);
    try {
      await api.post('/issues', {
        project_id: newProjectId,
        title: newTitle,
        description: newDescription,
        severity: newSeverity
      });
      setAlert({
        type: 'success',
        text: language === 'hi' 
          ? 'समस्या सफलतापूर्वक लॉग की गई।' 
          : 'Issue logged successfully.'
      });
      setShowLogModal(false);
      setNewProjectId('');
      setNewTitle('');
      setNewDescription('');
      setNewSeverity('Medium');
      fetchIssues();
    } catch (err: any) {
      setAlert({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to log issue.'
      });
    } finally {
      setBtnLoading(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue || !resolutionNotes) return;

    setBtnLoading(true);
    setAlert(null);
    try {
      const res = await api.post(`/issues/${selectedIssue.issue_id}/resolve`, {
        resolution_notes: resolutionNotes
      });
      setAlert({
        type: 'success',
        text: language === 'hi' 
          ? 'समस्या का समाधान दर्ज किया गया।' 
          : 'Issue resolved successfully.'
      });
      setResolutionNotes('');
      setSelectedIssue(res.data);
      fetchIssues();
    } catch (err: any) {
      setAlert({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to resolve issue.'
      });
    } finally {
      setBtnLoading(false);
    }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;

    setBtnLoading(true);
    setAlert(null);
    try {
      const formData = new FormData();
      formData.append('action_type', actionType);
      if (actionNotes) {
        formData.append('notes', actionNotes);
      }
      if (actionType === 'Meeting' && actionMeetingDate) {
        formData.append('meeting_date', actionMeetingDate);
      }
      if (actionStatus) {
        formData.append('status', actionStatus);
      }
      if (actionFile) {
        formData.append('file', actionFile);
      }

      const res = await api.post(`/issues/${selectedIssue.issue_id}/actions`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setAlert({
        type: 'success',
        text: language === 'hi' 
          ? 'कार्रवाई सफलतापूर्वक दर्ज की गई।' 
          : 'Action recorded successfully.'
      });
      
      setActionNotes('');
      setActionMeetingDate('');
      setActionFile(null);
      
      setSelectedIssue(res.data);
      fetchIssues();
    } catch (err: any) {
      setAlert({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to record action.'
      });
    } finally {
      setBtnLoading(false);
    }
  };

  useEffect(() => {
    if (selectedIssue) {
      setActionStatus(selectedIssue.status);
      setActionType('Meeting');
      setActionNotes('');
      setActionMeetingDate('');
      setActionFile(null);
    }
  }, [selectedIssue]);
  const handleActionTypeChange = (val: string) => {
    setActionType(val);
    if (val === 'Resolution') {
      setActionStatus('Resolved');
    }
  };

  const handleTriggerAiSuggestion = async () => {
    if (!selectedIssue) return;

    setAiLoading(true);
    setAlert(null);
    try {
      const res = await api.post(`/issues/${selectedIssue.issue_id}/ai-suggest`);
      setSelectedIssue(res.data);
      setAlert({
        type: 'success',
        text: language === 'hi' 
          ? 'एआई समाधान सुझाव सफलतापूर्वक प्राप्त किए गए।' 
          : 'AI suggestions generated successfully.'
      });
      fetchIssues();
    } catch (err: any) {
      setAlert({
        type: 'error',
        text: err.response?.data?.detail || 'AI Solution Finder failed.'
      });
    } finally {
      setAiLoading(false);
    }
  };

  // KPIs
  const totalCount = issues.length;
  const openCount = issues.filter(i => i.status === 'Open').length;
  const resolvedCount = issues.filter(i => i.status === 'Resolved').length;
  const criticalCount = issues.filter(i => i.severity === 'Critical').length;

  // Filter & Search logic
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = 
      issue.title.toLowerCase().includes(filterSearch.toLowerCase()) ||
      issue.project_name.toLowerCase().includes(filterSearch.toLowerCase()) ||
      (issue.description && issue.description.toLowerCase().includes(filterSearch.toLowerCase()));
    const matchesProject = filterProject === '' || issue.project_id === filterProject;
    const matchesStatus = filterStatus === '' || issue.status === filterStatus;
    const matchesSeverity = filterSeverity === '' || issue.severity === filterSeverity;

    return matchesSearch && matchesProject && matchesStatus && matchesSeverity;
  });

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return { bg: 'rgba(239, 68, 68, 0.1)', txt: '#ef4444', border: 'rgba(239, 68, 68, 0.2)' };
      case 'High':
        return { bg: 'rgba(249, 115, 22, 0.1)', txt: '#f97316', border: 'rgba(249, 115, 22, 0.2)' };
      case 'Medium':
        return { bg: 'rgba(234, 179, 8, 0.1)', txt: '#cab308', border: 'rgba(234, 179, 8, 0.2)' };
      default:
        return { bg: 'rgba(59, 130, 246, 0.1)', txt: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Unified Page Header */}
      <div className="pb-4 border-b border-primary/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-primary sm:text-2xl font-outfit">
            {t('issues.title')}
          </h1>
          <p className="text-xs text-text-muted mt-1">
            {t('issues.subtitle')}
          </p>
        </div>

        {canWrite && (
          <Button
            onClick={() => setShowLogModal(true)}
            style={{
              backgroundColor: '#1a5c38',
              color: '#ffffff',
              borderBottom: '3px solid #c9a84c'
            }}
            className="!py-2 !px-4 text-xs font-semibold flex items-center space-x-1 hover:brightness-110 active:scale-[0.98] transition-all shadow-md self-start sm:self-center"
          >
            <Plus size={16} />
            <span>{t('issues.add')}</span>
          </Button>
        )}
      </div>

      {/* Alert banner */}
      {alert && (
        <div 
          className={`p-3.5 rounded-lg border text-xs flex items-center justify-between animate-fadeIn`}
          style={{
            backgroundColor: alert.type === 'success' ? 'var(--badge-success-bg)' : 'rgba(239, 68, 68, 0.05)',
            borderColor: alert.type === 'success' ? 'var(--border-strong)' : 'rgba(239, 68, 68, 0.2)',
            color: alert.type === 'success' ? 'var(--badge-success-txt)' : '#ef4444'
          }}
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span className="font-medium">{alert.text}</span>
          </div>
          <button 
            onClick={() => setAlert(null)}
            className="text-[10px] font-bold uppercase tracking-wider opacity-70 hover:opacity-100"
          >
            {t('common.dismiss')}
          </button>
        </div>
      )}

      {/* Tab Selector Container */}
      <div className="bg-primary-bg-2 p-1 rounded-xl border border-primary/10 flex items-center space-x-1 w-fit select-none shadow-sm">
        <button
          onClick={() => setActiveTab('log')}
          className={`px-6 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center space-x-2 cursor-pointer ${
            activeTab === 'log'
              ? 'bg-primary text-white shadow-sm font-bold active-glow'
              : 'text-primary-light hover:bg-white/50 hover:text-primary font-medium'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>{language === 'hi' ? 'लॉग बुक' : 'Log Book'}</span>
        </button>
        <button
          onClick={() => setActiveTab('instant')}
          className={`px-6 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center space-x-2 cursor-pointer ${
            activeTab === 'instant'
              ? 'bg-primary text-white shadow-sm font-bold active-glow'
              : 'text-primary-light hover:bg-white/50 hover:text-primary font-medium'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>{t('issues.instant_finder_title')}</span>
        </button>
      </div>

      {activeTab === 'log' && (
        <>
          {/* Metrics Strips */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
            <div className="p-4 rounded-xl border flex flex-col justify-between shadow-sm bg-surface-2" style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border-default)' }}>
              <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {t('issues.total')}
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold font-outfit" style={{ color: 'var(--text-heading)' }}>
                  {totalCount}
                </span>
                <AlertTriangle className="h-5 w-5 text-[#c9a84c]" />
              </div>
            </div>

            <div className="p-4 rounded-xl border flex flex-col justify-between shadow-sm bg-surface-2" style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border-default)' }}>
              <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {t('issues.open')}
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold font-outfit" style={{ color: 'var(--text-heading)' }}>
                  {openCount}
                </span>
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
            </div>

            <div className="p-4 rounded-xl border flex flex-col justify-between shadow-sm bg-surface-2" style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border-default)' }}>
              <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {t('issues.resolved')}
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold font-outfit animate-fadeIn" style={{ color: 'var(--text-heading)' }}>
                  {resolvedCount}
                </span>
                <CheckCircle className="h-5 w-5 text-[#1a5c38]" />
              </div>
            </div>

            <div className="p-4 rounded-xl border flex flex-col justify-between shadow-sm bg-surface-2" style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border-default)' }}>
              <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {t('issues.critical')}
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold font-outfit" style={{ color: 'var(--text-heading)' }}>
                  {criticalCount}
                </span>
                <AlertCircle className="h-5 w-5 text-red-500 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Filters Toolbar */}
          <div className="bg-surface border border-primary/10 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-hint">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="block w-full rounded-lg border border-primary/20 bg-surface pl-9 pr-3 py-[0.55rem] text-[13px] text-text-body placeholder-text-hint focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition duration-150"
                placeholder={t('common.search')}
              />
            </div>

            {/* Project Select */}
            <div className="relative">
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="rounded-lg border border-primary/20 bg-surface px-3 py-[0.55rem] text-[13px] text-text-body focus:outline-none focus:border-primary transition duration-150 cursor-pointer w-48 appearance-none pr-8 font-medium"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%23666666\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25em 1.25em', backgroundRepeat: 'no-repeat' }}
              >
                <option value="">{language === 'hi' ? 'सभी परियोजनाएं' : 'All Projects'}</option>
                {projects.map(p => (
                  <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-primary/20 bg-surface px-3 py-[0.55rem] text-[13px] text-text-body focus:outline-none focus:border-primary transition duration-150 cursor-pointer w-44 appearance-none pr-8 font-medium"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%23666666\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25em 1.25em', backgroundRepeat: 'no-repeat' }}
              >
                <option value="">{language === 'hi' ? 'सभी स्थितियां' : 'All Statuses'}</option>
                <option value="Open">{t('issues.status.open')}</option>
                <option value="Resolved">{t('issues.status.resolved')}</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div className="relative">
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="rounded-lg border border-primary/20 bg-surface px-3 py-[0.55rem] text-[13px] text-text-body focus:outline-none focus:border-primary transition duration-150 cursor-pointer w-44 appearance-none pr-8 font-medium"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%23666666\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25em 1.25em', backgroundRepeat: 'no-repeat' }}
              >
                <option value="">{language === 'hi' ? 'सभी गंभीरता स्तर' : 'All Severities'}</option>
                <option value="Low">{t('issues.severity.low')}</option>
                <option value="Medium">{t('issues.severity.medium')}</option>
                <option value="High">{t('issues.severity.high')}</option>
                <option value="Critical">{t('issues.severity.critical')}</option>
              </select>
            </div>

            {(filterSearch || filterProject || filterStatus || filterSeverity) && (
              <button
                onClick={() => {
                  setFilterSearch('');
                  setFilterProject('');
                  setFilterStatus('');
                  setFilterSeverity('');
                }}
                className="text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-600 transition shrink-0 ml-2 cursor-pointer"
              >
                {language === 'hi' ? 'साफ़ करें' : 'Clear'}
              </button>
            )}
          </div>

          {/* Main Table view */}
          <div className="rounded-xl border overflow-hidden bg-surface shadow-sm" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" style={{ color: 'var(--color-primary)' }} />
                <span className="text-xs text-muted" style={{ color: 'var(--text-muted)' }}>
                  {language === 'hi' ? 'समस्याएं लोड हो रही हैं...' : 'Loading issues list...'}
                </span>
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="p-12 text-center select-none animate-fadeIn">
                <AlertTriangle className="h-10 w-10 text-muted mx-auto mb-2" style={{ color: 'var(--text-hint)' }} />
                <p className="text-sm font-semibold animate-fadeIn" style={{ color: 'var(--text-heading)' }}>
                  {language === 'hi' ? 'कोई समस्या नहीं मिली' : 'No logged issues found'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {language === 'hi' 
                    ? 'लॉग की गई समस्याओं की समीक्षा करने के लिए फ़िल्टर समायोजित करें।' 
                    : 'Adjust filters or log a new issue to review blockers.'}
                </p>
              </div>
            ) : (
              <Table
                headers={[
                  language === 'hi' ? 'परियोजना / शीर्षक' : 'Project / Issue Title',
                  language === 'hi' ? 'गंभीरता' : 'Severity',
                  language === 'hi' ? 'स्थिति' : 'Status',
                  language === 'hi' ? 'रिपोर्टकर्ता / तारीख' : 'Reported By',
                  t('common.actions')
                ]}
              >
                {filteredIssues.map((issue, idx) => {
                  const sev = getSeverityStyle(issue.severity);
                  return (
                    <TableRow 
                      key={issue.issue_id} 
                      index={idx}
                      onClick={() => {
                        setSelectedIssue(issue);
                        setShowDetailsModal(true);
                      }}
                    >
                      <TableCell className="px-6 py-4">
                        <div className="font-semibold text-xs text-primary" style={{ color: 'var(--text-heading)' }}>
                          {issue.project_name}
                        </div>
                        <div className="text-[13px] font-semibold mt-0.5" style={{ color: 'var(--text-body)' }}>
                          {issue.title}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span 
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase"
                          style={{ backgroundColor: sev.bg, color: sev.txt, borderColor: sev.border }}
                        >
                          {t(`issues.severity.${issue.severity.toLowerCase()}`)}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span 
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase"
                          style={{
                            backgroundColor: issue.status === 'Resolved' ? '#eaf4ee' : 'rgba(239, 68, 68, 0.05)',
                            color: issue.status === 'Resolved' ? '#1a5c38' : '#ef4444',
                            borderColor: issue.status === 'Resolved' ? 'rgba(26,92,56,0.2)' : 'rgba(239,68,68,0.2)'
                          }}
                        >
                          {issue.status === 'Resolved' ? t('issues.status.resolved') : t('issues.status.open')}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="text-xs font-semibold" style={{ color: 'var(--text-body)' }}>
                          {issue.reported_by}
                        </div>
                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {new Date(issue.reported_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <button 
                          className="p-1.5 rounded-lg hover:bg-primary-bg-2/30 transition-colors"
                          style={{ color: 'var(--text-heading)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIssue(issue);
                            setShowDetailsModal(true);
                          }}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </Table>
            )}
          </div>
        </>
      )}

      {activeTab === 'instant' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          {/* Left: Input Form Card */}
          <div className="bg-surface border border-primary/10 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-primary font-outfit uppercase tracking-wider">
                {t('issues.instant_finder_title')}
              </h2>
              <p className="text-xs text-text-muted mt-1">
                {t('issues.instant_finder_subtitle')}
              </p>
            </div>

            <form onSubmit={handleInstantSuggest} className="space-y-4 pt-2">
              {/* Select Project Context */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted">
                  {language === 'hi' ? 'परियोजना संदर्भ (वैकल्पिक)' : 'Project Context (Optional)'}
                </label>
                <div className="relative">
                  <select
                    value={instantProject}
                    onChange={(e) => setInstantProject(e.target.value)}
                    className="rounded-lg border border-primary/20 bg-surface px-3 py-2.5 text-xs text-text-body focus:outline-none focus:border-primary transition duration-150 cursor-pointer w-full appearance-none pr-8 font-medium"
                    style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%23666666\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25em 1.25em', backgroundRepeat: 'no-repeat' }}
                  >
                    <option value="">{language === 'hi' ? 'सामान्य जेबीवीएनएल ग्रिड संदर्भ' : 'General JBVNL Grid Context'}</option>
                    {projects.map(p => (
                      <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title / Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted">
                  {t('issues.instant_title_label')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('issues.instant_placeholder_title')}
                  value={instantTitle}
                  onChange={(e) => setInstantTitle(e.target.value)}
                  className="block w-full rounded-lg border border-primary/20 bg-surface px-3 py-2.5 text-xs text-text-body placeholder-text-hint focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition duration-150 font-medium"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted">
                  {t('issues.instant_desc_label')}
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder={t('issues.instant_placeholder_desc')}
                  value={instantDesc}
                  onChange={(e) => setInstantDesc(e.target.value)}
                  className="block w-full rounded-lg border border-primary/20 bg-surface px-3 py-2.5 text-xs text-text-body placeholder-text-hint focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition duration-150 font-medium resize-none"
                />
              </div>

              {instantError && (
                <p className="text-xs text-red-500 font-semibold">{instantError}</p>
              )}

              <Button
                type="submit"
                disabled={instantLoading || !instantTitle.trim() || !instantDesc.trim()}
                style={{
                  backgroundColor: '#1a5c38',
                  color: '#ffffff',
                  borderBottom: '3px solid #c9a84c'
                }}
                className="w-full !py-2.5 text-xs font-bold flex items-center justify-center space-x-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-md cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
              >
                {instantLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('issues.ai_loading')}</span>
                  </>
                ) : (
                  <>
                    <Cpu className="h-4 w-4 animate-pulse" />
                    <span>{t('issues.instant_btn')}</span>
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Right: Output Suggestions Panel */}
          <div className="bg-surface border border-primary/10 rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[400px]">
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-primary/10">
                <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 select-none font-outfit">
                  <Sparkles className="h-4 w-4 text-[#c9a84c] animate-pulse" />
                  {t('issues.ai_solution_title')}
                </span>
                {instantResult && (
                  <button
                    onClick={() => {
                      setInstantResult(null);
                      setInstantTitle('');
                      setInstantDesc('');
                    }}
                    className="text-[10px] uppercase font-bold text-red-500 hover:text-red-600 transition cursor-pointer"
                  >
                    {language === 'hi' ? 'रीसेट करें' : 'Reset'}
                  </button>
                )}
              </div>

              {instantLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1a5c38]" />
                  <p className="text-xs text-text-muted animate-pulse font-medium">
                    {language === 'hi' ? 'जेबीवीएनएल एआई इंजीनियरिंग सहायक गणना कर रहा है...' : 'JBVNL AI Engineering Assistant calculating optimal resolutions...'}
                  </p>
                </div>
              ) : instantResult ? (
                <div className="text-xs text-text-body leading-relaxed space-y-3 max-h-[480px] overflow-y-auto pr-1 select-text">
                  {instantResult.split('\n').map((line, idx) => {
                    const cleanLine = line.trim();
                    if (cleanLine.startsWith('###')) {
                      return (
                        <h4 key={idx} className="text-xs font-bold text-primary pt-2 border-b border-primary/5 pb-1 font-outfit uppercase tracking-wider">
                          {cleanLine.replace('###', '').trim()}
                        </h4>
                      );
                    }
                    if (cleanLine.startsWith('##')) {
                      return (
                        <h3 key={idx} className="text-sm font-bold text-primary pt-3 pb-1 font-outfit uppercase tracking-wider">
                          {cleanLine.replace('##', '').trim()}
                        </h3>
                      );
                    }
                    if (cleanLine.startsWith('#')) {
                      return (
                        <h2 key={idx} className="text-base font-bold text-primary pt-4 pb-2 font-outfit uppercase tracking-wider">
                          {cleanLine.replace('#', '').trim()}
                        </h2>
                      );
                    }
                    if (cleanLine.startsWith('-') || cleanLine.startsWith('*')) {
                      return (
                        <div key={idx} className="flex items-start gap-2 pl-2">
                          <span className="text-[#c9a84c] mt-0.5">•</span>
                          <span>{cleanLine.substring(1).trim()}</span>
                        </div>
                      );
                    }
                    if (/^\d+\./.test(cleanLine)) {
                      return (
                        <div key={idx} className="pl-2 font-medium">
                          {cleanLine}
                        </div>
                      );
                    }
                    return cleanLine ? <p key={idx}>{cleanLine}</p> : <div key={idx} className="h-1" />;
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-2 select-none">
                  <Cpu className="h-10 w-10 text-text-muted opacity-30" />
                  <p className="text-xs text-text-muted max-w-sm">
                    {language === 'hi' 
                      ? 'बाईं ओर विवरण भरें और एआई-संचालित समाधान उत्पन्न करने के लिए "त्वरित समाधान प्राप्त करें" पर क्लिक करें।' 
                      : 'Fill in details on the left and click "Ask Instant Solution" to generate AI-driven solutions.'}
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-3 border-t border-primary/10 text-[10px] text-text-muted flex justify-between items-center select-none">
              <span>{language === 'hi' ? 'जेबीवीएनएल सुरक्षा और ग्रिड संचालन एआई' : 'JBVNL Safety & Grid Operations AI'}</span>
              <span>v1.2.0</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Log Issue */}
      <Modal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        title={t('issues.add')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowLogModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              variant="primary" 
              onClick={handleLogIssueSubmit}
              disabled={btnLoading || !newProjectId || !newTitle}
              style={{
                backgroundColor: (newProjectId && newTitle) ? '#1a5c38' : 'var(--border-default)',
                color: '#ffffff',
                cursor: (newProjectId && newTitle) ? 'pointer' : 'not-allowed'
              }}
            >
              {btnLoading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {language === 'hi' ? 'समस्या लॉग करें' : 'Log Issue'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleLogIssueSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
              {language === 'hi' ? 'परियोजना का चयन करें *' : 'Select Project *'}
            </label>
            <select
              className="w-full text-xs rounded-lg py-2.5 px-3 focus:outline-none border"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
              value={newProjectId}
              onChange={(e) => setNewProjectId(e.target.value)}
              required
            >
              <option value="">{language === 'hi' ? '-- परियोजना चुनें --' : '-- Choose Project --'}</option>
              {projects.map(p => (
                <option key={p.project_id} value={p.project_id}>{p.project_name} ({p.project_id})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
              {language === 'hi' ? 'समस्या का शीर्षक *' : 'Issue Title *'}
            </label>
            <input
              type="text"
              className="w-full text-xs rounded-lg py-2.5 px-3 focus:outline-none border"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
              placeholder="e.g. Delay in transformer procurement"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
              {language === 'hi' ? 'समस्या विवरण' : 'Issue Description'}
            </label>
            <textarea
              className="w-full text-xs rounded-lg py-2 px-3 focus:outline-none border"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
              rows={4}
              placeholder="Enter comprehensive details about what is blocking progress..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
              {language === 'hi' ? 'गंभीरता स्तर *' : 'Severity Level *'}
            </label>
            <select
              className="w-full text-xs rounded-lg py-2.5 px-3 focus:outline-none border"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
              value={newSeverity}
              onChange={(e) => setNewSeverity(e.target.value)}
              required
            >
              <option value="Low">{t('issues.severity.low')}</option>
              <option value="Medium">{t('issues.severity.medium')}</option>
              <option value="High">{t('issues.severity.high')}</option>
              <option value="Critical">{t('issues.severity.critical')}</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Issue Details & AI Resolution Hub */}
      <Modal
        isOpen={showDetailsModal && !!selectedIssue}
        size="xl"
        onClose={() => {
          if (!aiLoading && !btnLoading) {
            setShowDetailsModal(false);
            setSelectedIssue(null);
            setResolutionNotes('');
          }
        }}
        title={selectedIssue?.title || ''}
        footer={
          <Button variant="secondary" onClick={() => { setShowDetailsModal(false); setSelectedIssue(null); setResolutionNotes(''); }}>
            {t('common.close')}
          </Button>
        }
      >
        {selectedIssue && (
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <div className={canWrite ? "grid grid-cols-1 lg:grid-cols-5 gap-6" : "space-y-4"}>
              
              {/* Left Column: Details, Description, AI Recommendations, Timeline */}
              <div className={canWrite ? "lg:col-span-3 space-y-4" : "space-y-4"}>
                
                {/* Metadata strip */}
                <div className="p-3 rounded-lg border grid grid-cols-2 gap-4 text-xs" style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border-default)' }}>
                  <div>
                    <span className="font-bold text-[10px] uppercase text-muted block" style={{ color: 'var(--text-muted)' }}>
                      {language === 'hi' ? 'परियोजना संदर्भ' : 'Project Reference'}
                    </span>
                    <span className="font-semibold text-primary">{selectedIssue.project_name}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[10px] uppercase text-muted block" style={{ color: 'var(--text-muted)' }}>
                      {language === 'hi' ? 'गंभीरता / स्थिति' : 'Severity & Status'}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-bold uppercase text-[9px] px-1.5 py-0.2 rounded border" style={{
                        backgroundColor: getSeverityStyle(selectedIssue.severity).bg,
                        color: getSeverityStyle(selectedIssue.severity).txt,
                        borderColor: getSeverityStyle(selectedIssue.severity).border
                      }}>{selectedIssue.severity}</span>
                      <span className="font-bold uppercase text-[9px] px-1.5 py-0.2 rounded border" style={{
                        backgroundColor: selectedIssue.status === 'Resolved' ? '#eaf4ee' : 'rgba(239, 68, 68, 0.05)',
                        color: selectedIssue.status === 'Resolved' ? '#1a5c38' : '#ef4444',
                        borderColor: selectedIssue.status === 'Resolved' ? 'rgba(26,92,56,0.2)' : 'rgba(239,68,68,0.2)'
                      }}>{selectedIssue.status}</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-[10px] uppercase text-muted block" style={{ color: 'var(--text-muted)' }}>
                      <span className="flex items-center gap-1"><User size={10} /> {t('issues.reported_by')}</span>
                    </span>
                    <span className="font-medium">{selectedIssue.reported_by}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[10px] uppercase text-muted block" style={{ color: 'var(--text-muted)' }}>
                      <span className="flex items-center gap-1"><Calendar size={10} /> {t('issues.reported_date')}</span>
                    </span>
                    <span className="font-medium">
                      {new Date(selectedIssue.reported_date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {language === 'hi' ? 'समस्या का विवरण' : 'Blocker Description'}
                  </h4>
                  <p className="p-3 rounded-lg border text-xs whitespace-pre-wrap leading-relaxed" style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border-subtle)', color: 'var(--text-body)' }}>
                    {selectedIssue.description || (language === 'hi' ? 'कोई विवरण नहीं दिया गया है।' : 'No details provided.')}
                  </p>
                </div>

                {/* AI Resolution Recommendations (COLLAPSIBLE / SPARKLE FEATURE) */}
                <div className="border rounded-xl overflow-hidden mt-4" style={{ borderColor: 'var(--border-default)' }}>
                  <div 
                    className="p-3 flex items-center justify-between cursor-pointer select-none bg-primary-bg-2/30"
                    style={{ backgroundColor: 'rgba(201, 168, 76, 0.05)', borderBottom: '1px solid var(--border-subtle)' }}
                  >
                    <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#a8863c' }}>
                      <Sparkles size={14} className="text-[#c9a84c] animate-bounce" />
                      {t('issues.ai_solution_title')}
                    </span>
                    {!selectedIssue.ai_suggestions && !aiLoading && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTriggerAiSuggestion();
                        }}
                        style={{
                          backgroundColor: '#1a5c38',
                          color: '#ffffff',
                        }}
                        className="!py-1 !px-2.5 text-[10px] font-semibold flex items-center gap-1 hover:brightness-110 active:scale-[0.98] transition-all"
                      >
                        <Cpu size={12} />
                        {t('issues.ai_solution_btn')}
                      </Button>
                    )}
                  </div>
                  
                  <div className="p-3.5 bg-black/[0.02]" style={{ backgroundColor: theme === 'dark' ? '#181b1c' : 'rgba(0,0,0,0.01)' }}>
                    {aiLoading ? (
                      <div className="flex flex-col items-center justify-center py-6 space-y-2">
                        <Loader2 className="h-7 w-7 animate-spin text-[#c9a84c]" />
                        <span className="text-[10px] font-medium tracking-wide animate-pulse" style={{ color: '#a8863c' }}>
                          {t('issues.ai_loading')}
                        </span>
                      </div>
                    ) : selectedIssue.ai_suggestions ? (
                      <div className="text-xs prose prose-slate max-w-none leading-relaxed text-left max-h-[30vh] overflow-y-auto pr-1">
                        {/* Render raw suggestions output split by double newline or custom formatting */}
                        {selectedIssue.ai_suggestions.split('\n').map((line, idx) => {
                          if (line.startsWith('### ')) {
                            return <h4 key={idx} className="font-bold text-xs mt-3 mb-1 text-primary" style={{ color: 'var(--text-heading)' }}>{line.replace('### ', '')}</h4>;
                          }
                          if (line.startsWith('#### ')) {
                            return <h5 key={idx} className="font-bold text-xs mt-2.5 mb-1" style={{ color: 'var(--text-heading)' }}>{line.replace('#### ', '')}</h5>;
                          }
                          if (line.startsWith('- ')) {
                            return <li key={idx} className="ml-4 list-disc mt-0.5">{line.replace('- ', '')}</li>;
                          }
                          return <p key={idx} className="mt-1">{line}</p>;
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-[11px] italic" style={{ color: 'var(--text-muted)' }}>
                        {language === 'hi' 
                          ? 'इस समस्या के लिए समाधान उत्पन्न करने के लिए "एआई समाधान खोजक से पूछें" पर क्लिक करें।' 
                          : 'Click "Ask AI Solution Finder" to fetch step-by-step engineering/admin guides.'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action History / Timeline */}
                <div className="border-t pt-4 space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary font-outfit animate-fadeIn" style={{ color: 'var(--text-heading)' }}>
                    {language === 'hi' ? 'कार्रवाई इतिहास और बैठकें' : 'Action History & Meetings'}
                  </h4>
                  
                  {selectedIssue.actions && selectedIssue.actions.length > 0 ? (
                    <div className="relative pl-4 border-l border-primary/20 space-y-4 py-1 select-text">
                      {selectedIssue.actions.map((act) => {
                        const fileUrl = act.document_path 
                          ? (act.document_path.startsWith('http') ? act.document_path : `http://localhost:8000${act.document_path}`)
                          : null;
                        return (
                          <div key={act.action_id} className="relative text-xs">
                            {/* Bullet point indicator */}
                            <span className="absolute -left-[21.5px] top-1 h-3 w-3 rounded-full border bg-white flex items-center justify-center" style={{ borderColor: '#c9a84c' }}>
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            </span>
                            
                            <div className="flex items-center justify-between text-[10px] font-semibold text-text-muted mb-0.5">
                              <span className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.2 rounded border bg-primary/5 text-primary text-[9px] uppercase font-bold" style={{ borderColor: 'rgba(16,92,56,0.1)' }}>
                                  {act.action_type}
                                </span>
                                <span>by {act.taken_by}</span>
                              </span>
                              <span>
                                {new Date(act.action_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            
                            {act.meeting_date && (
                              <div className="flex items-center gap-1 text-[10px] text-orange-600 font-bold mb-1">
                                <Calendar size={11} />
                                <span>Meeting Date: {new Date(act.meeting_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              </div>
                            )}
                            
                            {act.notes && (
                              <p className="text-xs leading-relaxed text-text-body p-2 rounded-lg bg-black/[0.015] border border-black/[0.03] whitespace-pre-wrap">
                                {act.notes}
                              </p>
                            )}

                            {fileUrl && (
                              <div className="mt-1 flex items-center gap-1.5 select-none">
                                <span className="text-[10px] text-text-muted">Attachment:</span>
                                <a 
                                  href={fileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
                                >
                                  📎 {act.document_name || 'Download Attached File'}
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-[10px] italic border rounded-lg bg-black/[0.01]" style={{ color: 'var(--text-muted)' }}>
                      {language === 'hi' ? 'कोई इतिहास नहीं मिला।' : 'No action history recorded yet.'}
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column: Take Action Form */}
              {canWrite && (
                <div className="lg:col-span-2">
                  <div className="p-4 rounded-xl border space-y-4 shadow-sm bg-surface-2" style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border-default)' }}>
                    <h4 className="text-[11.5px] font-bold uppercase tracking-wider text-primary font-outfit" style={{ color: 'var(--text-heading)' }}>
                      {language === 'hi' ? 'कार्रवाई दर्ज करें या बैठक शेड्यूल करें' : 'Record Action or Meeting'}
                    </h4>
                    
                    <form onSubmit={handleActionSubmit} className="space-y-3.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
                            {language === 'hi' ? 'कार्रवाई प्रकार' : 'Action Type'}
                          </label>
                          <select
                            className="w-full text-xs rounded-lg py-2 px-3 focus:outline-none border bg-surface"
                            style={{ borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
                            value={actionType}
                            onChange={(e) => handleActionTypeChange(e.target.value)}
                            required
                          >
                            <option value="Meeting">{language === 'hi' ? 'बैठक (Meeting)' : 'Meeting'}</option>
                            <option value="Site Visit">{language === 'hi' ? 'साइट विजिट (Site Visit)' : 'Site Visit'}</option>
                            <option value="Resolution">{language === 'hi' ? 'समाधान (Resolution)' : 'Resolution'}</option>
                            <option value="Progress Update">{language === 'hi' ? 'प्रगति अपडेट (Progress Update)' : 'Progress Update'}</option>
                            <option value="Other">{language === 'hi' ? 'अन्य (Other)' : 'Other'}</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
                            {language === 'hi' ? 'अद्यतन स्थिति' : 'Update Status'}
                          </label>
                          <select
                            className="w-full text-xs rounded-lg py-2 px-3 focus:outline-none border bg-surface"
                            style={{ borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
                            value={actionStatus}
                            onChange={(e) => setActionStatus(e.target.value)}
                            required
                          >
                            <option value="Open">{t('issues.status.open')}</option>
                            <option value="Resolved">{t('issues.status.resolved')}</option>
                          </select>
                        </div>
                      </div>

                      {actionType === 'Meeting' && (
                        <div className="animate-fadeIn">
                          <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
                            {language === 'hi' ? 'बैठक की तिथि *' : 'Meeting Date *'}
                          </label>
                          <input
                            type="date"
                            className="w-full text-xs rounded-lg py-2 px-3 focus:outline-none border bg-surface"
                            style={{ borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
                            value={actionMeetingDate}
                            onChange={(e) => setActionMeetingDate(e.target.value)}
                            required={actionType === 'Meeting'}
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
                          {language === 'hi' ? 'कार्रवाई विवरण / नोट्स *' : 'Action Details / Notes *'}
                        </label>
                        <textarea
                          className="w-full text-xs rounded-lg py-2 px-3 focus:outline-none border bg-surface"
                          style={{ borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
                          rows={4}
                          placeholder={
                            actionType === 'Meeting'
                              ? (language === 'hi' ? 'बैठक का विवरण और निर्णय दर्ज करें...' : 'Enter meeting agenda, attendees, and decisions...')
                              : (language === 'hi' ? 'कार्रवाई या अपडेट विवरण दर्ज करें...' : 'Enter action details or progress updates...')
                          }
                          value={actionNotes}
                          onChange={(e) => setActionNotes(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
                          {language === 'hi' ? 'दस्तावेज़ संलग्न करें (वैकल्पिक)' : 'Attach Document (Optional)'}
                        </label>
                        <input
                          type="file"
                          className="w-full text-xs rounded-lg py-1.5 px-2 focus:outline-none border bg-surface"
                          style={{ borderColor: 'var(--input-border)', color: 'var(--text-body)' }}
                          onChange={(e) => setActionFile(e.target.files ? e.target.files[0] : null)}
                        />
                        <p className="text-[9px] text-text-hint mt-0.5 font-medium">
                          Supported: PDF, JPG, PNG, TIFF, DOCX, XLSX (Max 20MB)
                        </p>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button
                          type="submit"
                          disabled={btnLoading || !actionNotes}
                          style={{
                            backgroundColor: actionNotes ? '#1a5c38' : 'var(--border-default)',
                            color: '#ffffff',
                            cursor: actionNotes ? 'pointer' : 'not-allowed'
                          }}
                          className="!py-2 w-full text-xs font-semibold flex items-center justify-center gap-1.5 shadow"
                        >
                          {btnLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={12} />}
                          {language === 'hi' ? 'कार्रवाई दर्ज करें' : 'Record Action'}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default IssueTracker;
