import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { 
  TrendingUp, 
  Edit3, 
  Calendar, 
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Circle,
  List,
  LayoutGrid
} from 'lucide-react';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';

interface MilestoneData {
  milestone_id: number;
  target_date: string;
  planned_progress: number;
  description: string | null;
}

interface ProgressOverview {
  project_id: string;
  project_name: string;
  department_name: string;
  planned_progress: number;
  actual_progress: number;
  variance: number;
  status: string;
  last_updated: string;
  milestones?: MilestoneData[];
  actual_percentage?: number;
  planned_percentage?: number;
  work_completed?: string;
  issues?: string;
  next_steps?: string;
  source_file_name?: string;
  reported_by?: string;
  updated_at?: string;
  updated_by?: string;
}

const ProgressTracker: React.FC = () => {
  const { user } = useAuth();
  const { t, language, getTranslatedDept } = useLanguage();
  const { isDark } = useTheme();
  
  const [items, setItems] = useState<ProgressOverview[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'list' or 'grid' (Persisted in localStorage)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    return (localStorage.getItem('progress_view_mode') as 'list' | 'grid') || 'list';
  });

  const handleViewModeChange = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('progress_view_mode', mode);
  };

  // Expandable row tracking
  const [expandedProjectIds, setExpandedProjectIds] = useState<Record<string, boolean>>({});

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

  // 3. Unified Progress Update Modal
  const [showDocUpdateModal, setShowDocUpdateModal] = useState(false);
  const [selectedProjectForDocUpdate, setSelectedProjectForDocUpdate] = useState<ProgressOverview | null>(null);
  const [isAiSectionExpanded, setIsAiSectionExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("Running OCR on document...");
  const [docUpdateStage, setDocUpdateStage] = useState<1 | 2 | 3 | 4>(1); // 1 = form editing, 2 = extracting, 4 = success
  
  // Manual form fields
  const [formActualProgress, setFormActualProgress] = useState<number | string>("");
  const [formPlannedProgress, setFormPlannedProgress] = useState<number | string>("");
  const [formWorkCompleted, setFormWorkCompleted] = useState("");
  const [formIssues, setFormIssues] = useState("");
  const [formNextSteps, setFormNextSteps] = useState("");
  const [formReportDate, setFormReportDate] = useState("");
  const [formReportedBy, setFormReportedBy] = useState("");
  const [formSourceFileName, setFormSourceFileName] = useState("");
  const [formConfidence, setFormConfidence] = useState<number>(0);
  const [formDocIdRef, setFormDocIdRef] = useState<number | null>(null);
  const [extractedMilestones, setExtractedMilestones] = useState<any[]>([]);

  const handleDocProcessSubmit = async () => {
    if (!selectedFile || !selectedProjectForDocUpdate) return;
    
    setIsExtracting(true);
    setProcessingMessage("Uploading document and preparing system...");
    
    const messages = [
      "Uploading document and preparing system...",
      "Running OCR engine to extract document text...",
      "Text extracted successfully. Invoking GPT-4o engine...",
      "Extracting physical actual and planned progress percentages...",
      "Parsing milestones and target dates from document...",
      "Parsing work completed, issues, next steps, and reporter details...",
      "Validating extracted JSON schemas...",
      "Almost ready! Structuring progress JSON payload..."
    ];
    let msgIdx = 0;
    const timer = setInterval(() => {
      msgIdx = (msgIdx + 1) % messages.length;
      setProcessingMessage(messages[msgIdx]);
    }, 1500);
    
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      const res = await api.post(
        `/projects/${selectedProjectForDocUpdate.project_id}/update-document`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );
      
      const resData = res.data;
      const ext = resData.extracted_data;
      
      // Auto-fill form fields below
      if (ext.actual_percentage !== undefined && ext.actual_percentage !== null) {
        setFormActualProgress(ext.actual_percentage);
      }
      if (ext.planned_percentage !== undefined && ext.planned_percentage !== null) {
        setFormPlannedProgress(ext.planned_percentage);
      }
      setFormWorkCompleted(ext.work_completed || "");
      setFormIssues(ext.issues || "");
      setFormNextSteps(ext.next_steps || "");
      if (ext.report_date) {
        setFormReportDate(ext.report_date);
      }
      if (ext.reported_by) {
        setFormReportedBy(ext.reported_by);
      }
      setFormSourceFileName(resData.file_name || selectedFile.name);
      setFormConfidence(ext.confidence || 0);
      setFormDocIdRef(resData.document_id_ref || resData.document_id || null);
      
      // Preview milestones inside upload section
      setExtractedMilestones(ext.milestones || []);
      
      // Collapse AI section after successful extraction
      setIsAiSectionExpanded(false);
    } catch (err: any) {
      setAlert({
        type: 'error',
        text: err.response?.data?.detail || "AI processing failed. Please try again with a valid document."
      });
    } finally {
      clearInterval(timer);
      setIsExtracting(false);
    }
  };

  const handleSaveDocProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectForDocUpdate) return;
    if (formActualProgress === "" || formActualProgress === undefined) return;
    
    setSubmitLoading(true);
    setAlert(null);
    try {
      await api.post(
        `/projects/${selectedProjectForDocUpdate.project_id}/save-progress`,
        {
          actual_percentage: parseFloat(formActualProgress.toString()),
          planned_percentage: parseFloat(formPlannedProgress.toString() || "0"),
          work_completed: formWorkCompleted,
          issues: formIssues,
          next_steps: formNextSteps,
          report_date: formReportDate,
          reported_by: formReportedBy,
          confidence: formConfidence,
          document_id_ref: formDocIdRef,
          source_file_name: formSourceFileName,
          milestones: extractedMilestones
        }
      );
      
      setDocUpdateStage(4); // Success stage
      setTimeout(() => {
        setShowDocUpdateModal(false);
        setSelectedFile(null);
        setDocUpdateStage(1);
        fetchProgressOverview();
      }, 2000);
    } catch (err: any) {
      setAlert({
        type: 'error',
        text: err.response?.data?.detail || "Failed to save project progress."
      });
    } finally {
      setSubmitLoading(false);
    }
  };

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

    const handleDatabaseUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const changes = customEvent.detail?.changes || [];
      const hasTrackerChanges = changes.some(
        (c: any) => c.table === 'project' || c.table === 'milestone' || c.table === 'progress_history'
      );
      if (hasTrackerChanges) {
        console.log('[Realtime] Re-fetching progress tracker due to DB updates.');
        fetchProgressOverview();
      }
    };
    window.addEventListener('database-update', handleDatabaseUpdate);
    return () => window.removeEventListener('database-update', handleDatabaseUpdate);
  }, []);



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

  const toggleRow = (projectId: string) => {
    setExpandedProjectIds(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
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
      <div className="pb-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ borderBottomColor: 'var(--border-subtle)' }}>
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl font-outfit" style={{ color: 'var(--text-heading)' }}>{t('progress.title')}</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('progress.subtitle')}</p>
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
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-hint)' }}>
          <AlertTriangle className="h-8 w-8 stroke-1" style={{ color: 'var(--text-primary)' }} />
          <span className="mt-2 text-xs font-medium">{t('progress.no_projects')}</span>
        </div>
      ) : viewMode === 'list' ? (
        <Table headers={[t('projects.project_name'), t('common.department'), t('progress.planned'), t('progress.actual'), t('progress.variance'), t('common.status'), t('progress.last_updated'), ...(!isViewer ? [t('common.actions')] : [])]}>
          {items.map((item, idx) => (
            <React.Fragment key={item.project_id}>
              <TableRow 
                index={idx} 
                onClick={() => toggleRow(item.project_id)}
              >
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div className="p-1 rounded transition duration-150" style={{ color: 'var(--text-muted)' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      {expandedProjectIds[item.project_id] ? (
                        <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-primary)' }} />
                      ) : (
                        <ChevronRight className="h-4 w-4" style={{ color: 'var(--text-primary)' }} />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-text-body" style={{ color: 'var(--text-heading)' }}>{item.project_name}</div>
                      <div className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>ID: {item.project_id}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span 
                    className="inline-flex rounded px-2 py-0.5 text-xs font-medium border"
                    style={{ backgroundColor: 'var(--badge-success-bg)', color: 'var(--badge-success-txt)', borderColor: 'rgba(26, 92, 56, 0.2)' }}
                  >
                    {getTranslatedDept(item.department_name)}
                  </span>
                </TableCell>
                <TableCell className="font-semibold text-text-body" style={{ color: 'var(--text-body)' }}>
                  {item.planned_progress}%
                </TableCell>
                <TableCell>
                  <div className="min-w-[200px]">
                    <div className="flex items-center space-x-2">
                      <div className="w-20 rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: 'var(--border-default)' }}>
                        <div 
                          className="h-full rounded-full"
                          style={{ width: `${item.actual_progress}%`, backgroundColor: 'var(--color-primary)' }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-text-body" style={{ color: 'var(--text-body)' }}>{item.actual_progress}%</span>
                    </div>

                    {/* Latest update info strip */}
                    <div style={{
                      display    : 'flex',
                      alignItems : 'center',
                      gap        : '12px',
                      marginTop  : '6px',
                      flexWrap   : 'wrap',
                    }}>
                      {item.source_file_name && (
                        <span style={{
                          display    : 'flex',
                          alignItems : 'center',
                          gap        : '4px',
                          fontSize   : '11px',
                          color      : 'var(--text-muted)',
                        }}>
                          <i className="ti ti-file"
                             style={{ fontSize: '12px', color: '#c9a84c' }} />
                          {item.source_file_name}
                        </span>
                      )}
                      {item.reported_by && (
                        <span style={{
                          display    : 'flex',
                          alignItems : 'center',
                          gap        : '4px',
                          fontSize   : '11px',
                          color      : 'var(--text-muted)',
                        }}>
                          <i className="ti ti-user"
                             style={{ fontSize: '12px', color: '#1a5c38' }} />
                          {item.reported_by}
                        </span>
                      )}
                      {item.updated_at && (
                        <span style={{
                          display    : 'flex',
                          alignItems : 'center',
                          gap        : '4px',
                          fontSize   : '11px',
                          color      : 'var(--text-muted)',
                        }}>
                          <i className="ti ti-clock"
                             style={{ fontSize: '12px', color: '#1a5c38' }} />
                          {new Date(item.updated_at).toLocaleDateString('en-IN', {
                            day  : '2-digit',
                            month: 'short',
                            year : 'numeric',
                          })}
                        </span>
                      )}
                    </div>

                    {/* Work completed note */}
                    {item.work_completed && (
                      <p style={{
                        fontSize     : '12px',
                        color        : 'var(--text-muted)',
                        margin       : '6px 0 0',
                        lineHeight   : 1.5,
                        borderLeft   : '2px solid #c9a84c',
                        paddingLeft  : '8px',
                      }}>
                        {item.work_completed}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-semibold">
                  <span style={{ color: item.variance >= 0 ? 'var(--badge-success-txt)' : 'var(--badge-danger-txt)' }}>
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
                <TableCell className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(item.last_updated).toLocaleDateString()}
                </TableCell>
                {!isViewer && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Set Planned Milestone */}
                      {canSetMilestone && (
                        <Button
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveProject(item);
                            setPlannedProgressInput(item.planned_progress);
                            setShowMilestoneModal(true);
                          }}
                          className="!py-1.5 !px-2.5 text-xs font-semibold"
                          title={t('progress.set_planned_milestone')}
                        >
                          <Calendar className="mr-1 h-3.5 w-3.5" />
                          {language === 'hi' ? 'मील का पत्थर' : 'Milestone'}
                        </Button>
                      )}
                      
                      {/* Log Actual Progress */}
                      {canUpdateProgress && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProjectForDocUpdate(item);
                            
                            // Initialize modal fields with item values
                            setFormActualProgress(item.actual_progress);
                            setFormPlannedProgress(item.planned_progress);
                            setFormWorkCompleted(item.work_completed || "");
                            setFormIssues(item.issues || "");
                            setFormNextSteps(item.next_steps || "");
                            setFormReportDate(new Date().toISOString().split('T')[0]);
                            setFormReportedBy(item.reported_by || user?.full_name || "");
                            setFormSourceFileName("");
                            setExtractedMilestones(item.milestones || []);
                            
                            setIsAiSectionExpanded(false);
                            setSelectedFile(null);
                            setIsExtracting(false);
                            setDocUpdateStage(1);
                            setShowDocUpdateModal(true);
                          }}
                          style={{
                            backgroundColor: '#1a5c38',
                            color: '#ffffff',
                            borderBottom: '3px solid #c9a84c'
                          }}
                          className="!py-1.5 !px-2.5 text-xs font-semibold hover:brightness-110 active:scale-[0.98] transition-all"
                          title={language === 'hi' ? 'प्रगति अपडेट' : 'Update Progress'}
                        >
                          <Edit3 className="mr-1 h-3.5 w-3.5" />
                          {language === 'hi' ? 'अपडेट' : 'Update'}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>

              {/* Collapsible milestones sub-row */}
              {expandedProjectIds[item.project_id] && (
                <tr style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
                  <td colSpan={isViewer ? 7 : 8} className="px-6 py-4 border-b" style={{ borderBottomColor: 'var(--border-subtle)' }}>
                    <div className="p-4 rounded-xl border space-y-4 shadow-sm" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
                      <div className="flex items-center space-x-2 border-b pb-2" style={{ borderBottomColor: 'var(--border-subtle)' }}>
                        <TrendingUp className="h-4.5 w-4.5" style={{ color: 'var(--text-primary)' }} />
                        <h4 className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--text-heading)' }}>
                          {language === 'hi' ? 'मील का पत्थर सत्यापन और ट्रैकिंग' : 'Milestone Verification & Tracking'}
                        </h4>
                      </div>

                      {!item.milestones || item.milestones.length === 0 ? (
                        <p className="text-xs italic pl-1" style={{ color: 'var(--text-hint)' }}>
                          {language === 'hi' ? 'इस परियोजना के लिए कोई मील का पत्थर निर्धारित नहीं है।' : 'No milestones scheduled for this project.'}
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {item.milestones.map((m) => {
                            const isVerified = item.actual_progress >= m.planned_progress;
                            return (
                              <div 
                                key={m.milestone_id} 
                                className="flex items-start justify-between p-3.5 rounded-lg border transition-all duration-300"
                                style={{
                                  backgroundColor: isVerified ? 'var(--badge-success-bg)' : 'var(--bg-surface-2)',
                                  borderColor: isVerified ? 'var(--border-strong)' : 'var(--border-subtle)',
                                  boxShadow: isVerified ? 'var(--shadow-card)' : 'none'
                                }}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="mt-0.5">
                                    {isVerified ? (
                                      <CheckCircle className="h-5 w-5 stroke-[2.5]" style={{ color: 'var(--badge-success-txt)' }} />
                                    ) : (
                                      <Circle className="h-5 w-5 stroke-[1.5] animate-pulse" style={{ color: 'var(--text-hint)' }} />
                                    )}
                                  </div>
                                  <div className="select-none">
                                    <div className="font-semibold text-xs sm:text-[13px]" style={{ color: 'var(--text-body)' }}>
                                      {m.description || (language === 'hi' ? 'मील का पत्थर' : 'Milestone Target')}
                                    </div>
                                    <div className="text-[10px] mt-1 flex items-center" style={{ color: 'var(--text-muted)' }}>
                                      <Calendar className="mr-1 h-3 w-3" style={{ color: 'var(--text-hint)' }} />
                                      {language === 'hi' ? 'लक्ष्य तिथि' : 'Target Date'}: <span className="font-semibold ml-1">{m.target_date}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right flex flex-col justify-between items-end">
                                  <span 
                                    className="text-xs font-bold px-2 py-0.5 rounded border"
                                    style={{
                                      backgroundColor: isVerified ? 'var(--badge-success-bg)' : 'var(--bg-surface-hover)',
                                      borderColor: isVerified ? 'var(--border-strong)' : 'var(--border-default)',
                                      color: isVerified ? 'var(--badge-success-txt)' : 'var(--text-muted)'
                                    }}
                                  >
                                    {m.planned_progress}%
                                  </span>
                                  <span 
                                    className="text-[10px] font-semibold mt-2" 
                                    style={{ color: isVerified ? 'var(--badge-success-txt)' : 'var(--text-hint)', fontWeight: isVerified ? 'bold' : 'normal' }}
                                  >
                                    {isVerified 
                                      ? (language === 'hi' ? 'सत्यापित' : 'Verified') 
                                      : (language === 'hi' ? 'सत्यापन लंबित' : 'Pending Verification')
                                    }
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </Table>
      ) : (
        /* Grid (Card) View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const isMilestonesExpanded = expandedProjectIds[item.project_id];
            return (
              <div
                key={item.project_id}
                className="bg-surface border border-primary/10 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-default)'
                }}
              >
                {/* Card Header */}
                <div className="p-4 border-b border-primary/5 bg-primary-bg-2/30 flex items-center justify-between" style={{ borderBottomColor: 'var(--border-subtle)' }}>
                  <span className="text-xs font-mono font-bold text-text-hint">
                    ID: {item.project_id}
                  </span>
                  <Badge variant={getStatusBadgeVariant(item.status)}>
                    {item.status === 'Completed' ? t('projects.status.completed') : 
                     item.status === 'In Progress' ? t('projects.status.inprogress') :
                     item.status === 'Pending' ? t('projects.status.pending') :
                     t('projects.status.delayed')}
                  </Badge>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold leading-snug group-hover:text-primary transition-colors duration-200 line-clamp-2" style={{ color: 'var(--text-heading)' }}>
                      {item.project_name}
                    </h3>
                    <div className="mt-2 flex items-center">
                      <span 
                        className="inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border"
                        style={{ backgroundColor: 'var(--badge-success-bg)', color: 'var(--badge-success-txt)', borderColor: 'rgba(26, 92, 56, 0.2)' }}
                      >
                        {getTranslatedDept(item.department_name)}
                      </span>
                    </div>
                  </div>

                  {/* Progress & Variance Info */}
                  <div className="space-y-3 p-3.5 rounded-xl border select-none" style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border-default)' }}>
                    {/* Planned progress */}
                    <div className="flex justify-between items-center text-xs">
                      <span style={{ color: 'var(--text-muted)' }}>{t('progress.planned')}:</span>
                      <span className="font-bold" style={{ color: 'var(--text-body)' }}>{item.planned_progress}%</span>
                    </div>

                    {/* Actual progress */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>{t('progress.actual')}:</span>
                        <span className="font-bold text-primary">{item.actual_progress}%</span>
                      </div>
                      <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: 'var(--border-default)' }}>
                        <div 
                          className="h-full rounded-full"
                          style={{ width: `${item.actual_progress}%`, backgroundColor: 'var(--color-primary)' }}
                        />
                      </div>

                      {/* Latest update info strip */}
                      <div style={{
                        display    : 'flex',
                        alignItems : 'center',
                        gap        : '12px',
                        marginTop  : '6px',
                        flexWrap   : 'wrap',
                      }}>
                        {item.source_file_name && (
                          <span style={{
                            display    : 'flex',
                            alignItems : 'center',
                            gap        : '4px',
                            fontSize   : '11px',
                            color      : 'var(--text-muted)',
                          }}>
                            <i className="ti ti-file"
                               style={{ fontSize: '12px', color: '#c9a84c' }} />
                            {item.source_file_name}
                          </span>
                        )}
                        {item.reported_by && (
                          <span style={{
                            display    : 'flex',
                            alignItems : 'center',
                            gap        : '4px',
                            fontSize   : '11px',
                            color      : 'var(--text-muted)',
                          }}>
                            <i className="ti ti-user"
                               style={{ fontSize: '12px', color: '#1a5c38' }} />
                            {item.reported_by}
                          </span>
                        )}
                        {item.updated_at && (
                          <span style={{
                            display    : 'flex',
                            alignItems : 'center',
                            gap        : '4px',
                            fontSize   : '11px',
                            color      : 'var(--text-muted)',
                          }}>
                            <i className="ti ti-clock"
                               style={{ fontSize: '12px', color: '#1a5c38' }} />
                            {new Date(item.updated_at).toLocaleDateString('en-IN', {
                              day  : '2-digit',
                              month: 'short',
                              year : 'numeric',
                            })}
                          </span>
                        )}
                      </div>

                      {/* Work completed note */}
                      {item.work_completed && (
                        <p style={{
                          fontSize     : '12px',
                          color        : 'var(--text-muted)',
                          margin       : '6px 0 0',
                          lineHeight   : 1.5,
                          borderLeft   : '2px solid #c9a84c',
                          paddingLeft  : '8px',
                        }}>
                          {item.work_completed}
                        </p>
                      )}
                    </div>

                    {/* Variance and Last Updated */}
                    <div className="flex justify-between items-center text-xs pt-2 border-t" style={{ borderTopColor: 'var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{t('progress.variance')}:</span>
                      <span className="font-bold" style={{ color: item.variance >= 0 ? 'var(--badge-success-txt)' : 'var(--badge-danger-txt)' }}>
                        {item.variance >= 0 ? '+' : ''}{item.variance.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="text-[10px] flex items-center select-none" style={{ color: 'var(--text-hint)' }}>
                    <span>{t('progress.last_updated')}: {new Date(item.last_updated).toLocaleDateString()}</span>
                  </div>

                  {/* Collapsible milestones sub-section inside card */}
                  <div className="pt-2 border-t" style={{ borderTopColor: 'var(--border-subtle)' }}>
                    <button
                      type="button"
                      onClick={() => toggleRow(item.project_id)}
                      className="w-full flex items-center justify-between py-1 px-2 rounded-lg text-xs font-bold uppercase transition hover:bg-primary-bg2"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <span className="flex items-center space-x-1">
                        <TrendingUp className="h-3.5 w-3.5 mr-1" />
                        <span>{language === 'hi' ? 'मील के पत्थर' : 'Milestones'}</span>
                      </span>
                      {isMilestonesExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    {isMilestonesExpanded && (
                      <div className="mt-3 space-y-2.5 max-h-48 overflow-y-auto pr-1">
                        {!item.milestones || item.milestones.length === 0 ? (
                          <p className="text-[11px] italic text-text-hint pl-1 select-none">
                            {language === 'hi' ? 'कोई मील का पत्थर नहीं।' : 'No milestones scheduled.'}
                          </p>
                        ) : (
                          item.milestones.map((m) => {
                            const isVerified = item.actual_progress >= m.planned_progress;
                            return (
                              <div
                                key={m.milestone_id}
                                className="flex items-center justify-between p-2 rounded border"
                                style={{
                                  backgroundColor: isVerified ? 'var(--badge-success-bg)' : 'var(--bg-surface-2)',
                                  borderColor: isVerified ? 'var(--border-strong)' : 'var(--border-subtle)',
                                }}
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="font-semibold text-[11px] truncate" style={{ color: 'var(--text-body)' }}>
                                    {m.description || (language === 'hi' ? 'मील का पत्थर' : 'Milestone')}
                                  </div>
                                  <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                                    {m.target_date}
                                  </div>
                                </div>
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0"
                                  style={{
                                    backgroundColor: isVerified ? 'var(--badge-success-bg)' : 'var(--bg-surface-hover)',
                                    borderColor: isVerified ? 'var(--border-strong)' : 'var(--border-default)',
                                    color: isVerified ? 'var(--badge-success-txt)' : 'var(--text-muted)'
                                  }}
                                >
                                  {m.planned_progress}%
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                {!isViewer && (
                  <div className="px-5 py-3 border-t flex items-center justify-end space-x-2 bg-primary-bg-2/30" style={{ borderTopColor: 'var(--border-subtle)' }}>
                    {/* Set Planned Milestone */}
                    {canSetMilestone && (
                      <Button
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveProject(item);
                          setPlannedProgressInput(item.planned_progress);
                          setShowMilestoneModal(true);
                        }}
                        className="!py-1.5 !px-3 text-xs font-semibold flex items-center space-x-1"
                        title={t('progress.set_planned_milestone')}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{language === 'hi' ? 'मील का पत्थर' : 'Milestone'}</span>
                      </Button>
                    )}

                    {/* Log Actual Progress */}
                    {canUpdateProgress && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProjectForDocUpdate(item);
                          
                          // Initialize modal fields with item values
                          setFormActualProgress(item.actual_progress);
                          setFormPlannedProgress(item.planned_progress);
                          setFormWorkCompleted(item.work_completed || "");
                          setFormIssues(item.issues || "");
                          setFormNextSteps(item.next_steps || "");
                          setFormReportDate(new Date().toISOString().split('T')[0]);
                          setFormReportedBy(item.reported_by || user?.full_name || "");
                          setFormSourceFileName("");
                          setExtractedMilestones(item.milestones || []);
                          
                          setIsAiSectionExpanded(false);
                          setSelectedFile(null);
                          setIsExtracting(false);
                          setDocUpdateStage(1);
                          setShowDocUpdateModal(true);
                        }}
                        style={{
                          backgroundColor: '#1a5c38',
                          color: '#ffffff',
                          borderBottom: '3px solid #c9a84c'
                        }}
                        className="!py-1.5 !px-3 text-xs font-semibold flex items-center space-x-1 hover:brightness-110 active:scale-[0.98] transition-all"
                        title={language === 'hi' ? 'प्रगति अपडेट' : 'Update Progress'}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>{language === 'hi' ? 'अपडेट' : 'Update'}</span>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {t('progress.schedule_planned_for')} <span className="font-semibold text-primary" style={{ color: 'var(--text-primary)' }}>{activeProject.project_name}</span>.
            </p>
            <Input
              type="date"
              label={t('progress.target_date_label')}
              value={targetDateInput}
              onChange={(e) => setTargetDateInput(e.target.value)}
              required
            />
            <div>
              <label className="block text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>{t('progress.target_milestone_label')}</label>
              <div className="mt-1 flex items-center space-x-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={plannedProgressInput}
                  onChange={(e) => setPlannedProgressInput(parseInt(e.target.value))}
                  className="flex-1 h-2 rounded-lg cursor-pointer"
                  style={{ accentColor: 'var(--color-accent)', background: 'var(--border-default)' }}
                />
                <span className="font-mono font-bold text-sm w-10 text-right" style={{ color: 'var(--color-accent-dark)' }}>{plannedProgressInput}%</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 3. Modal: Unified Project Progress Update */}
      <Modal
        isOpen={showDocUpdateModal && !!selectedProjectForDocUpdate}
        onClose={() => {
          if (!isExtracting) {
            setShowDocUpdateModal(false);
            setSelectedFile(null);
            setDocUpdateStage(1);
          }
        }}
        title={
          language === 'hi' 
            ? `${selectedProjectForDocUpdate?.project_name} - प्रगति अपडेट` 
            : `Update Progress — ${selectedProjectForDocUpdate?.project_name}`
        }
        footer={
          docUpdateStage !== 4 ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDocUpdateModal(false);
                  setSelectedFile(null);
                }}
                disabled={submitLoading || isExtracting}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveDocProgressSubmit}
                disabled={formActualProgress === "" || formActualProgress === undefined || isExtracting || submitLoading}
                style={{
                  backgroundColor: (formActualProgress !== "" && formActualProgress !== undefined && !isExtracting && !submitLoading) ? '#1a5c38' : 'var(--border-default)',
                  color: '#ffffff',
                  cursor: (formActualProgress !== "" && formActualProgress !== undefined && !isExtracting && !submitLoading) ? 'pointer' : 'not-allowed'
                }}
              >
                {submitLoading && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                {language === 'hi' ? 'प्रगति सहेजें' : 'Save Progress'}
              </Button>
            </>
          ) : null
        }
      >
        {selectedProjectForDocUpdate && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            
            {/* Stage 1 or 3: Unified Form (Manual fields always visible) */}
            {docUpdateStage !== 4 && (
              <div className="space-y-4">
                
                {/* Collapsible AI section */}
                <div className="space-y-3">
                  <div 
                    onClick={() => {
                      if (!isExtracting) {
                        setIsAiSectionExpanded(!isAiSectionExpanded);
                      }
                    }}
                    className="p-3 rounded-lg border flex items-center justify-between cursor-pointer select-none bg-primary-bg-2/30 hover:bg-primary-bg-2/50 transition-colors"
                    style={{ borderColor: 'var(--border-default)' }}
                  >
                    <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-heading)' }}>
                      <i className="ti ti-cpu text-[#c9a84c]" style={{ fontSize: '14px' }} />
                      {language === 'hi' ? 'एआई के साथ ऑटो-फिल (वैकल्पिक)' : 'Auto-fill with AI (Optional)'}
                    </span>
                    <div className="flex items-center gap-2">
                      {formSourceFileName && (
                        <span className="text-[10px] bg-primary-bg2 px-2 py-0.5 rounded border border-primary/20 text-primary font-semibold max-w-[120px] truncate">
                          {formSourceFileName}
                        </span>
                      )}
                      {isAiSectionExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </div>

                  {isAiSectionExpanded && (
                    <div className="p-4 rounded-xl border space-y-4 bg-primary-bg-2/10" style={{ borderColor: 'var(--border-default)' }}>
                      {isExtracting ? (
                        <div className="flex flex-col items-center justify-center py-6 space-y-3">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" style={{ borderTopColor: 'var(--color-primary)' }} />
                            <i className="ti ti-cpu absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" style={{ color: 'var(--color-primary)' }} />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-semibold animate-pulse" style={{ color: 'var(--text-heading)' }}>
                              {language === 'hi' ? 'दस्तावेज़ का विश्लेषण हो रहा है...' : 'AI Analyzing Document...'}
                            </p>
                            <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                              {processingMessage}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            {language === 'hi' 
                              ? 'दस्तावेज़ (PDF, PNG, JPG, DOCX, XLSX) अपलोड करें। एआई टेक्स्ट पढ़ेगा और प्रगति फ़ील्ड को ऑटो-फिल करेगा।' 
                              : 'Upload progress report (PDF, PNG, JPG, DOCX, XLSX). AI will run OCR, extract progress info, and fill the manual fields below.'}
                          </p>
                          <div 
                            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDragOver(false);
                              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                setSelectedFile(e.dataTransfer.files[0]);
                              }
                            }}
                            style={{
                              borderColor: isDragOver ? 'var(--color-primary)' : 'var(--border-default)',
                              backgroundColor: isDragOver ? 'var(--bg-surface-hover)' : 'var(--bg-surface-2)',
                            }}
                            className="border-2 border-dashed rounded-lg p-6 text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
                            onClick={() => document.getElementById('project-doc-file-input')?.click()}
                          >
                            <input 
                              id="project-doc-file-input"
                              type="file" 
                              className="hidden" 
                              onChange={(e) => { if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]); }}
                              accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx"
                            />
                            <i className="ti ti-cloud-upload text-2xl mb-1.5 text-muted" style={{ color: 'var(--text-hint)' }} />
                            <p className="text-[11px] font-semibold" style={{ color: 'var(--text-heading)' }}>
                              {language === 'hi' ? 'दस्तावेज़ को यहाँ खींचें या ब्राउज़ करें' : 'Drag & drop document or click to browse'}
                            </p>
                            
                            <div className="flex flex-wrap justify-center gap-1 mt-2">
                              {['PDF', 'PNG', 'JPG', 'DOCX', 'XLSX'].map((badge) => (
                                <span 
                                  key={badge}
                                  className="text-[8px] font-bold px-1 py-0.2 rounded border"
                                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}
                                >
                                  {badge}
                                </span>
                              ))}
                            </div>
                          </div>

                          {selectedFile && (
                            <div className="p-2.5 rounded-lg border flex items-center justify-between bg-primary-bg-2/30" style={{ borderColor: 'var(--border-default)' }}>
                              <div className="flex items-center space-x-2 min-w-0">
                                <i className="ti ti-file text-[#c9a84c] text-xs flex-shrink-0" />
                                <span className="text-xs font-medium truncate" style={{ color: 'var(--text-body)' }}>{selectedFile.name}</span>
                              </div>
                              <div className="flex items-center space-x-2 flex-shrink-0">
                                <Button
                                  type="button"
                                  onClick={handleDocProcessSubmit}
                                  style={{
                                    backgroundColor: '#1a5c38',
                                    color: '#ffffff',
                                  }}
                                  className="!py-1 !px-2.5 text-[10px] font-semibold hover:brightness-110 active:scale-[0.98] transition-all"
                                >
                                  <i className="ti ti-cpu mr-0.5" />
                                  {language === 'hi' ? 'एआई से निकालें' : 'Extract with AI'}
                                </Button>
                                <button 
                                  type="button" 
                                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                                  className="p-1 rounded-full hover:bg-black/10 hover:text-red-600 transition"
                                >
                                  <i className="ti ti-x text-xs" />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Extracted Milestones Preview list inside AI section */}
                          {extractedMilestones.length > 0 && (
                            <div className="mt-3.5 space-y-2 border-t pt-3" style={{ borderColor: 'var(--border-subtle)' }}>
                              <p className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                                {language === 'hi' ? 'निकाले गए मील के पत्थर:' : 'Milestones from document:'}
                              </p>
                              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                {extractedMilestones.map((m, i) => (
                                  <div key={i} className="flex items-center justify-between p-2 rounded bg-surface border text-[11px]" style={{ borderColor: 'var(--border-subtle)' }}>
                                    <div className="min-w-0 flex-1">
                                      <div className="font-semibold truncate" style={{ color: 'var(--text-body)' }}>{m.title || m.description}</div>
                                      <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{m.target_date || 'No Date'}</div>
                                    </div>
                                    <div className="text-right flex items-center gap-2">
                                      <span className="font-semibold text-primary">{m.percentage || m.planned_progress}%</span>
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase" style={{
                                        backgroundColor: m.status === 'completed' ? '#eaf4ee' : m.status === 'in_progress' ? '#fdf6e3' : 'var(--bg-surface-2)',
                                        color: m.status === 'completed' ? '#1a5c38' : m.status === 'in_progress' ? '#a8863c' : 'var(--text-muted)'
                                      }}>{m.status}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Manual form fields */}
                <form onSubmit={handleSaveDocProgressSubmit} className="space-y-4 border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
                        {language === 'hi' ? 'वास्तविक प्रगति (%) *' : 'Actual Progress (%) *'}
                      </label>
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        value={formActualProgress}
                        onChange={(e) => setFormActualProgress(e.target.value)}
                        className="w-full rounded-lg py-2 px-3 text-xs focus:outline-none border"
                        style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
                        placeholder="e.g. 65"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
                        {language === 'hi' ? 'नियोजित प्रगति (%)' : 'Planned Progress (%)'}
                      </label>
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        value={formPlannedProgress}
                        onChange={(e) => setFormPlannedProgress(e.target.value)}
                        className="w-full rounded-lg py-2 px-3 text-xs focus:outline-none border"
                        style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
                        placeholder="e.g. 60"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
                      {language === 'hi' ? 'कार्य संपन्न' : 'Work Completed'}
                    </label>
                    <textarea 
                      rows={3}
                      value={formWorkCompleted}
                      onChange={(e) => setFormWorkCompleted(e.target.value)}
                      className="w-full rounded-lg py-2 px-3 text-xs focus:outline-none border"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
                      placeholder={language === 'hi' ? 'पूरा किया गया कार्य दर्ज करें...' : 'Enter details of work completed...'}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
                        {language === 'hi' ? 'समस्याएं / मुद्दे' : 'Issues'}
                      </label>
                      <textarea 
                        rows={2}
                        value={formIssues}
                        onChange={(e) => setFormIssues(e.target.value)}
                        className="w-full rounded-lg py-2 px-3 text-xs focus:outline-none border"
                        style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
                        placeholder={language === 'hi' ? 'कोई समस्या दर्ज करें...' : 'Enter issues if any...'}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
                        {language === 'hi' ? 'अगले कदम' : 'Next Steps'}
                      </label>
                      <textarea 
                        rows={2}
                        value={formNextSteps}
                        onChange={(e) => setFormNextSteps(e.target.value)}
                        className="w-full rounded-lg py-2 px-3 text-xs focus:outline-none border"
                        style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
                        placeholder={language === 'hi' ? 'अगली गतिविधियाँ...' : 'Enter next steps...'}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
                        {language === 'hi' ? 'रिपोर्ट की तारीख' : 'Report Date'}
                      </label>
                      <input 
                        type="date"
                        value={formReportDate}
                        onChange={(e) => setFormReportDate(e.target.value)}
                        className="w-full rounded-lg py-2 px-3 text-xs focus:outline-none border"
                        style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
                        {language === 'hi' ? 'रिपोर्टकर्ता का नाम' : 'Reported By'}
                      </label>
                      <input 
                        type="text"
                        value={formReportedBy}
                        onChange={(e) => setFormReportedBy(e.target.value)}
                        className="w-full rounded-lg py-2 px-3 text-xs focus:outline-none border"
                        style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
                        required
                      />
                    </div>
                  </div>
                  
                  {formSourceFileName && (
                    <div className="flex items-center justify-between pt-3 border-t text-[10px]" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                      <span className="flex items-center gap-1">
                        <i className="ti ti-file" style={{ color: '#c9a84c' }} />
                        {language === 'hi' ? 'स्रोत फ़ाइल:' : 'Source Document:'} <span className="font-semibold">{formSourceFileName}</span>
                      </span>
                      {formConfidence > 0 && (
                        <span className="flex items-center gap-1 font-semibold" style={{ color: formConfidence >= 70 ? '#1a5c38' : '#a8863c' }}>
                          <i className="ti ti-circle-check" />
                          {language === 'hi' ? `एआई आत्मविश्वास: ${formConfidence}%` : `Confidence: ${formConfidence}%`}
                        </span>
                      )}
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Stage 4: Success */}
            {docUpdateStage === 4 && (
              <div className="flex flex-col items-center justify-center p-8 space-y-3">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 animate-scaleIn">
                  <i className="ti ti-circle-check text-2xl animate-bounce" />
                </div>
                <div className="text-center select-none animate-fadeIn">
                  <p className="text-xs font-semibold" style={{ color: '#1a5c38' }}>
                    {language === 'hi' ? 'प्रगति सफलतापूर्वक सहेजी गई!' : 'Progress Saved Successfully!'}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {language === 'hi' ? 'परियोजना की प्रगति अपडेट कर दी गई है।' : 'The project progress tracker has been updated.'}
                  </p>
                </div>
              </div>
            )}

          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProgressTracker;
