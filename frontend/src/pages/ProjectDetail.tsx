import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Calendar, 
  MapPin, 
  IndianRupee,
  Clock,
  TrendingUp,
  Activity as ActivityIcon,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronRight,
  Square,
  CheckSquare
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { Task } from '../types';

interface ProjectDetailData {
  project: {
    project_id: string;
    project_name: string;
    location: string | null;
    district: string | null;
    start_date: string | null;
    end_date: string | null;
    budget_amount: number;
    status: string;
    actual_progress: number;
    planned_progress: number;
    department_name: string | null;
  };
  documents: Array<{
    document_id: number;
    file_name: string;
    file_type: string;
    upload_date: string;
    verification_status: string;
  }>;
  contractors: Array<{
    contractor_id: string;
    contractor_name: string;
    work_order_number: string | null;
    contact_info: string | null;
  }>;
  timeline: Array<{
    history_id: number;
    actual_progress: number;
    notes: string | null;
    updated_at: string;
    updater_name: string;
  }>;
  milestones: Array<{
    milestone_id: number;
    target_date: string;
    planned_progress: number;
    description: string | null;
    tasks?: Task[];
  }>;
  activity_log: Array<{
    username: string;
    action_type: string;
    timestamp: string;
  }>;
}

interface TaskNodeProps {
  task: Task;
  level: number;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onAddSubtask: (task: Task) => void;
  onToggleStatus: (task: Task) => void;
  canManage: boolean;
  canToggleStatus: boolean;
  t: (key: string) => string;
}

const TaskNode: React.FC<TaskNodeProps> = ({ 
  task, 
  level, 
  onEdit, 
  onDelete, 
  onAddSubtask, 
  onToggleStatus, 
  canManage, 
  canToggleStatus,
  t
}) => {
  const [expanded, setExpanded] = useState(true); // Default subtasks expanded for visibility
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-success-light text-success border-success/20';
      case 'In Progress': return 'bg-info-light text-info border-info/20';
      default: return 'bg-primary-bg-2 text-text-hint border-primary/10';
    }
  };

  return (
    <div className="mt-2.5 w-full">
      <div className="flex items-center justify-between rounded-lg border border-primary/10 bg-primary-bg-2/30 p-2.5 hover:bg-primary-bg-2/60 transition duration-150 text-xs">
        <div className="flex items-center min-w-0 flex-1">
          {/* Chevron for expanding subtasks */}
          {hasSubtasks ? (
            <button 
              onClick={() => setExpanded(!expanded)} 
              className="mr-1.5 p-1 rounded hover:bg-primary/10 text-primary-light transition-transform duration-200 cursor-pointer"
            >
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          ) : (
            <div className="w-6" />
          )}

          {/* Status Checkbox */}
          <button 
            disabled={!canToggleStatus}
            onClick={() => onToggleStatus(task)}
            className={`mr-2.5 p-1 rounded hover:bg-primary/10 text-primary flex-shrink-0 transition duration-150 ${canToggleStatus ? 'cursor-pointer' : 'cursor-default'}`}
          >
            {task.status === 'Completed' ? (
              <CheckSquare className="h-4.5 w-4.5 text-primary" />
            ) : (
              <Square className="h-4.5 w-4.5 text-text-hint" />
            )}
          </button>

          <div className="min-w-0 flex-1 pr-2">
            <div className={`font-semibold text-text-body truncate ${task.status === 'Completed' ? 'line-through text-text-hint' : ''}`}>
              {task.title}
            </div>
            {task.description && (
              <p className="text-[10px] text-text-muted mt-0.5 line-clamp-1">{task.description}</p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-1 text-[9px] text-text-hint">
              {task.assignee_name && (
                <span className="bg-primary/8 text-primary px-1.5 py-0.5 rounded border border-primary/15 flex items-center font-medium">
                  <User className="h-2.5 w-2.5 mr-0.5" />
                  {task.assignee_name}
                </span>
              )}
              {task.due_date && (
                <span className="bg-accent/8 text-accent-dark px-1.5 py-0.5 rounded border border-accent/15 flex items-center font-medium">
                  <Calendar className="h-2.5 w-2.5 mr-0.5" />
                  {task.due_date}
                </span>
              )}
              <span className={`px-1.5 py-0.5 rounded border font-bold uppercase ${getStatusBadgeClass(task.status)}`}>
                {task.status === 'Completed' ? t('tasks.status.completed') : 
                 task.status === 'In Progress' ? t('tasks.status.inprogress') : 
                 t('tasks.status.pending')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
          {canManage && (
            <>
              <button 
                onClick={() => onAddSubtask(task)} 
                className="p-1 rounded hover:bg-primary/10 text-primary-light hover:text-primary cursor-pointer transition"
                title={t('tasks.add_subtask')}
              >
                <Plus className="h-4 w-4" />
              </button>
              <button 
                onClick={() => onEdit(task)} 
                className="p-1 rounded hover:bg-primary/10 text-primary-light hover:text-primary cursor-pointer transition"
                title={t('common.edit')}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button 
                onClick={() => onDelete(task.task_id)} 
                className="p-1 rounded hover:bg-primary/10 text-danger hover:text-danger cursor-pointer transition"
                title={t('common.delete')}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Render Subtasks Recursively */}
      {expanded && hasSubtasks && (
        <div className="pl-4 border-l border-primary/8 ml-3.5 space-y-1.5">
          {task.subtasks!.map(subtask => (
            <TaskNode 
              key={subtask.task_id} 
              task={subtask} 
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSubtask={onAddSubtask}
              onToggleStatus={onToggleStatus}
              canManage={canManage}
              canToggleStatus={canToggleStatus}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language, getTranslatedDept } = useLanguage();
  const { user } = useAuth();
  const [data, setData] = useState<ProjectDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isViewer = user?.role === 'Viewer';

  // Task Modal states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeMilestoneId, setActiveMilestoneId] = useState<number | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [expandedMilestones, setExpandedMilestones] = useState<Record<number, boolean>>({});

  // Form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskStatus, setTaskStatus] = useState<'Pending' | 'In Progress' | 'Completed'>('Pending');
  const [taskAssignee, setTaskAssignee] = useState<number | null>(null);
  const [taskDueDate, setTaskDueDate] = useState('');
  const [usersList, setUsersList] = useState<any[]>([]);

  useEffect(() => {
    if (user && user.role !== 'Viewer') {
      api.get('/users/minimal')
        .then(res => setUsersList(res.data))
        .catch(err => console.error('Failed to fetch minimal users:', err));
    }
  }, [user]);

  const handleOpenCreateTask = (milestoneId: number, parent: Task | null = null) => {
    setModalMode('create');
    setActiveMilestoneId(milestoneId);
    setParentTask(parent);
    setActiveTask(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskStatus('Pending');
    setTaskAssignee(null);
    setTaskDueDate('');
    setShowTaskModal(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setModalMode('edit');
    setActiveTask(task);
    setParentTask(null);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskStatus(task.status);
    setTaskAssignee(task.assigned_to || null);
    setTaskDueDate(task.due_date || '');
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;

    try {
      if (modalMode === 'create') {
        const payload = {
          title: taskTitle,
          description: taskDesc || null,
          status: taskStatus,
          assigned_to: taskAssignee || null,
          due_date: taskDueDate || null,
          parent_id: parentTask ? parentTask.task_id : null
        };
        await api.post(`/progress/milestones/${activeMilestoneId}/tasks`, payload);
      } else if (modalMode === 'edit' && activeTask) {
        const payload = {
          title: taskTitle,
          description: taskDesc || null,
          status: taskStatus,
          assigned_to: taskAssignee || null,
          due_date: taskDueDate || null
        };
        await api.put(`/progress/tasks/${activeTask.task_id}`, payload);
      }
      setShowTaskModal(false);
      
      const res = await api.get(`/projects/${id}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to submit task:', err);
      alert(language === 'hi' ? 'कार्य सहेजने में विफल।' : 'Failed to save task.');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    const confirmMsg = t('tasks.delete_confirm');
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.delete(`/progress/tasks/${taskId}`);
      const res = await api.get(`/projects/${id}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleToggleTaskStatus = async (task: Task) => {
    try {
      const nextStatus = task.status === 'Completed' ? 'In Progress' : 'Completed';
      await api.put(`/progress/tasks/${task.task_id}`, { status: nextStatus });
      const res = await api.get(`/projects/${id}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to toggle task status:', err);
    }
  };

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/projects/${id}`);
      setData(res.data);
    } catch (err) {
      setErrorMsg(t('projects.detail.failed_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  useEffect(() => {
    const handleDatabaseUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const changes = customEvent.detail?.changes || [];
      const hasRelatedChanges = changes.some((c: any) => {
        if (c.table === 'project' && c.row_id === id) return true;
        if (
          c.table === 'milestone' ||
          c.table === 'task' ||
          c.table === 'progress_history' ||
          c.table === 'master_document' ||
          c.table === 'contractor' ||
          c.table === 'location'
        ) return true;
        return false;
      });

      if (hasRelatedChanges) {
        console.log(`[Realtime] Re-fetching project details for ID ${id} due to DB changes.`);
        // Perform a silent background refresh to prevent layout shift loading spinners
        api.get(`/projects/${id}`)
          .then(res => {
            setData(res.data);
          })
          .catch(err => {
            console.error('[Realtime] Failed to background refresh project details:', err);
          });
      }
    };
    window.addEventListener('database-update', handleDatabaseUpdate);
    return () => window.removeEventListener('database-update', handleDatabaseUpdate);
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size={32} label={t('common.loading')} />
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-text-hint bg-surface rounded-xl border border-primary/10">
        <AlertTriangle className="h-8 w-8 text-danger mb-2" />
        <span className="text-sm font-semibold">{errorMsg || t('projects.detail.not_found')}</span>
        <Button onClick={() => navigate('/projects')} className="mt-4">
          {t('projects.detail.back_to_list')}
        </Button>
      </div>
    );
  }

  const { project, documents, contractors, timeline, milestones, activity_log } = data;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Completed': return 'completed';
      case 'In Progress': return 'inprogress';
      case 'Pending': return 'pending';
      default: return 'delayed';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between border-b border-primary/10 bg-surface p-4 rounded-xl shadow-sm">
        <Button
          variant="secondary"
          onClick={() => navigate('/projects')}
          className="!py-1.5 !px-3"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {t('projects.detail.back_to_projects')}
        </Button>
        <div className="text-xs text-text-muted">
          {t('projects.project_id')}: <span className="font-mono font-bold text-primary">{project.project_id}</span>
        </div>
      </div>

      {/* Main Info Header Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Project Name and Department Card */}
        <div className="rounded-xl border border-primary/12 bg-surface p-6 shadow-sm lg:col-span-2 space-y-4">
          <div>
            <span 
              className="inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase"
              style={{ color: 'var(--badge-success-txt)', backgroundColor: 'var(--badge-success-bg)', borderColor: 'var(--border-default)' }}
            >
              {getTranslatedDept(project.department_name)}
            </span>
            <h2 className="mt-2 text-xl font-semibold text-primary font-outfit">{project.project_name}</h2>
          </div>
          
          <div className="flex flex-wrap gap-4 text-xs text-text-muted pt-2 border-t border-primary/8">
            <div className="flex items-center">
              <MapPin className="mr-1.5 h-4 w-4 text-primary-light" />
              <span>{project.location || 'N/A'}, {project.district || 'Jharkhand'}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="mr-1.5 h-4 w-4 text-primary-light" />
              <span>{project.start_date || 'N/A'} to {project.end_date || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Budget Card */}
        <div className="rounded-xl border border-primary/12 bg-surface p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[10px] font-semibold uppercase tracking-wider">{t('projects.detail.sanctioned_budget')}</span>
            <IndianRupee className="h-5 w-5 text-accent" />
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold text-primary">
              ₹{project.budget_amount ? project.budget_amount.toLocaleString('en-IN') : '0.00'}
            </h3>
            <p className="text-[10px] text-text-hint mt-1">{t('projects.detail.released_inr')}</p>
          </div>
        </div>

        {/* Status Card */}
        <div className="rounded-xl border border-primary/12 bg-surface p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[10px] font-semibold uppercase tracking-wider">{t('projects.detail.project_status')}</span>
            <ActivityIcon className="h-5 w-5 text-primary-light" />
          </div>
          <div className="mt-4">
            <Badge variant={getStatusBadgeVariant(project.status)}>
              {project.status === 'Completed' ? t('projects.status.completed') : 
               project.status === 'In Progress' ? t('projects.status.inprogress') :
               project.status === 'Pending' ? t('projects.status.pending') :
               t('projects.status.delayed')}
            </Badge>
            <p className="text-[10px] text-text-hint mt-2">{t('projects.detail.calc_dynamic')}</p>
          </div>
        </div>
      </div>

      {/* Progress Comparator Bar */}
      <Card title={t('projects.detail.progress_comparison')} subtitle={t('projects.detail.variance_subtitle')} accentLeft={true}>
        <div className="space-y-4 pt-2">
          {/* Actual Progress */}
          <div>
            <ProgressBar 
              progress={project.actual_progress} 
              showLabel={false} 
              delayed={project.status === 'Delayed'}
            />
            <div className="flex justify-between text-[11px] font-medium text-text-muted mt-1 select-none">
              <span>{t('projects.detail.actual_progress')}</span>
              <span className="font-bold text-primary">{project.actual_progress}%</span>
            </div>
          </div>

          {/* Planned Progress */}
          <div>
            <div className="w-full bg-primary/10 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-accent h-full rounded-full transition-all duration-500"
                style={{ width: `${project.planned_progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-medium text-text-muted mt-1 select-none">
              <span>{t('projects.detail.planned_target')}</span>
              <span className="font-bold text-accent-dark">{project.planned_progress}%</span>
            </div>
          </div>

          {/* Variance details */}
          <div className="pt-2 border-t border-primary/6 flex justify-between items-center text-xs">
            <span className="text-text-muted">{t('projects.detail.variance')}</span>
            <span className={`font-bold ${
              project.actual_progress - project.planned_progress >= 0 
                ? 'text-primary' 
                : 'text-danger'
            }`}>
              {(project.actual_progress - project.planned_progress).toFixed(2)}%
            </span>
          </div>
        </div>
      </Card>

      {/* Linked Documents & Contractors */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* Linked Documents Card */}
        <div className="rounded-xl border border-primary/12 bg-surface p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-primary border-b border-primary/8 pb-2 flex items-center uppercase tracking-wide">
            <FileText className="mr-1.5 h-4.5 w-4.5 text-primary-light" />
            {t('projects.detail.linked_docs')}
          </h3>

          {documents.length === 0 ? (
            <p className="text-xs text-text-hint">{t('projects.detail.no_docs')}</p>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => (
                <div key={doc.document_id} className="flex items-center justify-between rounded-lg border border-primary/10 bg-primary-bg p-3 text-xs">
                  <div>
                    <div className="font-semibold text-text-body line-clamp-1">{doc.file_name}</div>
                    <div className="text-[10px] text-text-muted">{t('projects.detail.uploaded_on')} {new Date(doc.upload_date).toLocaleDateString()}</div>
                  </div>
                  <Link
                    to={`/documents/${doc.document_id}/verify`}
                    className="inline-flex items-center font-semibold text-primary hover:text-primary-dark hover:underline"
                  >
                    {t('projects.detail.view_ocr')}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contractor details */}
        <div className="rounded-xl border border-primary/12 bg-surface p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-primary border-b border-primary/8 pb-2 flex items-center uppercase tracking-wide">
            <User className="mr-1.5 h-4.5 w-4.5 text-primary-light" />
            {t('projects.detail.contractor_info')}
          </h3>

          {contractors.length === 0 ? (
            <p className="text-xs text-text-hint">{t('projects.detail.no_contractors')}</p>
          ) : (
            <div className="space-y-3">
              {contractors.map(c => (
                <div key={c.contractor_id} className="rounded-lg border border-primary/15 p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary text-sm">{c.contractor_name}</span>
                    <span 
                      className="rounded px-2 py-0.5 font-mono text-[9px] font-bold uppercase border"
                      style={{ backgroundColor: 'var(--badge-warning-bg)', color: 'var(--badge-warning-txt)', borderColor: 'rgba(201,168,76,0.25)' }}
                    >
                      ID: {c.contractor_id}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-text-muted pt-2 border-t border-primary/8">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-text-hint">{t('docs.work_order')}</span>
                      <p className="text-text-body font-semibold">{c.work_order_number || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-text-hint">{t('projects.detail.contact_details')}</span>
                      <p className="text-text-body">{c.contact_info || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Planned Milestones Schedule & Tasks */}
        <div className="rounded-xl border border-primary/12 bg-surface p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-primary border-b border-primary/8 pb-2 flex items-center uppercase tracking-wide">
            <Calendar className="mr-1.5 h-4.5 w-4.5 text-primary-light" />
            {t('projects.detail.milestones_schedule')}
          </h3>

          {milestones.length === 0 ? (
            <p className="text-xs text-text-hint">{t('projects.detail.no_milestones')}</p>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {milestones.map(m => {
                const isMilestoneExpanded = !!expandedMilestones[m.milestone_id];
                const milestoneTasks = m.tasks || [];
                const completedTasks = milestoneTasks.filter(t => t.status === 'Completed').length;
                const totalTasks = milestoneTasks.length;

                return (
                  <div key={m.milestone_id} className="border border-primary/8 rounded-lg overflow-hidden bg-primary-bg-2/10 shadow-sm">
                    {/* Milestone Header */}
                    <div 
                      onClick={() => {
                        setExpandedMilestones(prev => ({
                          ...prev,
                          [m.milestone_id]: !prev[m.milestone_id]
                        }));
                      }}
                      className="flex items-center justify-between p-3.5 bg-primary-bg-2/30 border-b border-primary/6 cursor-pointer hover:bg-primary-bg-2/50 transition select-none"
                    >
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="mr-2 text-primary-light flex-shrink-0">
                          {isMilestoneExpanded ? <ChevronDown className="h-4.5 w-4.5" /> : <ChevronRight className="h-4.5 w-4.5" />}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-text-body text-xs sm:text-[13px] block truncate">
                            {m.description || (language === 'hi' ? 'मील का पत्थर' : 'Milestone Target')}
                          </span>
                          <span className="text-[10px] text-text-hint mt-0.5 block">
                            {t('projects.detail.target_date')} <span className="font-semibold">{m.target_date}</span>
                            {totalTasks > 0 && ` · ${completedTasks}/${totalTasks} ${language === 'hi' ? 'कार्य पूर्ण' : 'Tasks Completed'}`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                        <span className="font-bold text-accent-dark bg-accent-light px-2 py-0.5 rounded border border-accent/20 text-xs">
                          {m.planned_progress}%
                        </span>
                        {user?.role !== 'Viewer' && (user?.role === 'Admin' || user?.role === 'Manager') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCreateTask(m.milestone_id);
                            }}
                            className="p-1 rounded bg-primary/10 text-primary hover:bg-primary hover:text-white transition cursor-pointer"
                            title={t('tasks.add_task')}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Milestone Tasks Content */}
                    {isMilestoneExpanded && (
                      <div className="p-3.5 bg-surface space-y-2">
                        {milestoneTasks.length === 0 ? (
                          <p className="text-xs italic text-text-hint pl-1 select-none">
                            {t('tasks.no_tasks')}
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {milestoneTasks.map(task => (
                              <TaskNode 
                                key={task.task_id} 
                                task={task} 
                                level={0}
                                onEdit={handleOpenEditTask}
                                onDelete={handleDeleteTask}
                                onAddSubtask={(pTask) => handleOpenCreateTask(m.milestone_id, pTask)}
                                onToggleStatus={handleToggleTaskStatus}
                                canManage={!isViewer && (user?.role === 'Admin' || user?.role === 'Manager')}
                                canToggleStatus={!isViewer}
                                t={t}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Progress History Timeline */}
        <div className="rounded-xl border border-primary/12 bg-surface p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-primary border-b border-primary/8 pb-2 flex items-center uppercase tracking-wide">
            <Clock className="mr-1.5 h-4.5 w-4.5 text-primary-light" />
            {t('projects.detail.progress_log')}
          </h3>

          {timeline.length === 0 ? (
            <p className="text-xs text-text-hint">{t('projects.detail.no_progress_updates')}</p>
          ) : (
            <div className="relative border-l border-primary/20 pl-4 space-y-4 max-h-60 overflow-y-auto">
              {timeline.map(tData => (
                <div key={tData.history_id} className="relative text-xs">
                  {/* Dot */}
                  <div className="absolute -left-[21px] mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                  
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text-body">{t('projects.detail.physical_progress')} {tData.actual_progress}%</span>
                    <span className="text-[10px] text-text-hint">{new Date(tData.updated_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-text-muted mt-1">{tData.notes || t('projects.detail.no_notes')}</p>
                  <p className="text-[9px] text-text-hint mt-0.5">{t('projects.detail.updated_by')}: {tData.updater_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Activity Log Audit */}
      <div className="rounded-xl border border-primary/12 bg-surface p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-primary border-b border-primary/8 pb-2 uppercase tracking-wide">
          {t('projects.detail.activity_logs')}
        </h3>
        
        {activity_log.length === 0 ? (
          <p className="text-xs text-text-hint">{t('projects.detail.no_activity')}</p>
        ) : (
          <div className="divide-y divide-primary/8 max-h-60 overflow-y-auto">
            {activity_log.map((log, idx) => (
              <div key={idx} className="flex justify-between py-2 text-xs text-text-muted">
                <div>
                  {language === 'hi' ? (
                    <>
                      <span className="font-semibold text-primary">{log.username}</span> ने{' '}
                      <span className="text-accent-dark font-medium">{log.action_type}</span> किया
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-primary">{log.username}</span> performed{' '}
                      <span className="text-accent-dark font-medium">{log.action_type}</span>
                    </>
                  )}
                </div>
                <div className="text-[10px] font-mono">{new Date(log.timestamp).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Creation / Edit Modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title={modalMode === 'create' 
          ? (parentTask ? t('tasks.create_subtask_title') : t('tasks.create_task_title')) 
          : t('tasks.edit_task_title')}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowTaskModal(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleTaskSubmit}
              disabled={!taskTitle.trim()}
            >
              {t('common.save')}
            </Button>
          </>
        }
      >
        <form onSubmit={handleTaskSubmit} className="space-y-4 text-xs">
          {parentTask && (
            <div className="bg-primary/5 p-2.5 rounded border border-primary/10 select-none">
              <span className="font-semibold text-primary">{language === 'hi' ? 'मूल कार्य' : 'Parent Task'}:</span> {parentTask.title}
            </div>
          )}
          <Input
            type="text"
            label={t('tasks.task_title')}
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder={t('tasks.task_title_placeholder')}
            required
            className="w-full"
          />
          <div className="flex flex-col">
            <label className="text-[13px] font-medium mb-1 select-none text-text-body">{t('tasks.description')}</label>
            <textarea
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              rows={3}
              className="w-full rounded-lg py-2 px-3 text-[13px] border border-primary/15 bg-surface placeholder-text-hint focus:outline-none focus:border-primary transition"
              placeholder={t('tasks.desc_placeholder')}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-[13px] font-medium mb-1 select-none text-text-body">{t('tasks.status')}</label>
              <select
                value={taskStatus}
                onChange={(e) => setTaskStatus(e.target.value as any)}
                className="w-full rounded-lg py-2 px-3 text-[13px] border border-primary/15 bg-surface focus:outline-none focus:border-primary transition"
              >
                <option value="Pending">{t('tasks.status.pending')}</option>
                <option value="In Progress">{t('tasks.status.inprogress')}</option>
                <option value="Completed">{t('tasks.status.completed')}</option>
              </select>
            </div>
            <Input
              type="date"
              label={t('tasks.due_date')}
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              className="w-full"
            />
          </div>
          {modalMode === 'create' || (activeTask && user?.role !== 'Operator') ? (
            <div className="flex flex-col">
              <label className="text-[13px] font-medium mb-1 select-none text-text-body">{t('tasks.assigned_to')}</label>
              <select
                value={taskAssignee || ''}
                onChange={(e) => setTaskAssignee(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full rounded-lg py-2 px-3 text-[13px] border border-primary/15 bg-surface focus:outline-none focus:border-primary transition"
              >
                <option value="">{t('tasks.unassigned')}</option>
                {usersList.map(u => (
                  <option key={u.user_id} value={u.user_id}>{u.full_name} ({u.role})</option>
                ))}
              </select>
            </div>
          ) : null}
        </form>
      </Modal>
    </div>
  );
};

export default ProjectDetail;
