import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
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
  CheckCircle
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import Spinner from '../components/ui/Spinner';

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
  }>;
  activity_log: Array<{
    username: string;
    action_type: string;
    timestamp: string;
  }>;
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [data, setData] = useState<ProjectDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size={32} label={t('common.loading')} />
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-text-hint bg-white rounded-xl border border-primary/10">
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
      <div className="flex items-center justify-between border-b border-primary/10 bg-white p-4 rounded-xl shadow-sm">
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
        <div className="rounded-xl border border-primary/12 bg-white p-6 shadow-sm lg:col-span-2 space-y-4">
          <div>
            <span 
              className="inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase"
              style={{ color: '#2e7d52', backgroundColor: '#eaf4ee', borderColor: 'rgba(46, 125, 82, 0.3)' }}
            >
              {project.department_name ? t('dept.' + project.department_name.toLowerCase()) : 'General'}
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
        <div className="rounded-xl border border-primary/12 bg-white p-6 shadow-sm flex flex-col justify-between">
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
        <div className="rounded-xl border border-primary/12 bg-white p-6 shadow-sm flex flex-col justify-between">
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
        <div className="rounded-xl border border-primary/12 bg-white p-5 shadow-sm space-y-4">
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
        <div className="rounded-xl border border-primary/12 bg-white p-5 shadow-sm space-y-4">
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
                      className="rounded px-2 py-0.5 font-mono text-[9px] font-bold uppercase"
                      style={{ backgroundColor: 'rgba(201,168,76,0.2)', color: '#c9a84c' }}
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

        {/* Planned Milestones Schedule */}
        <div className="rounded-xl border border-primary/12 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-primary border-b border-primary/8 pb-2 flex items-center uppercase tracking-wide">
            <Calendar className="mr-1.5 h-4.5 w-4.5 text-primary-light" />
            {t('projects.detail.milestones_schedule')}
          </h3>

          {milestones.length === 0 ? (
            <p className="text-xs text-text-hint">{t('projects.detail.no_milestones')}</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {milestones.map(m => (
                <div key={m.milestone_id} className="flex items-center justify-between border-b border-primary/6 py-2 text-xs last:border-0">
                  <div className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-text-hint" />
                    <span>{t('projects.detail.target_date')} <span className="font-semibold">{m.target_date}</span></span>
                  </div>
                  <span className="font-bold text-accent-dark bg-accent-light px-2 py-0.5 rounded border border-accent/20">{m.planned_progress}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress History Timeline */}
        <div className="rounded-xl border border-primary/12 bg-white p-5 shadow-sm space-y-4">
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
      <div className="rounded-xl border border-primary/12 bg-white p-5 shadow-sm space-y-4">
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
    </div>
  );
};

export default ProjectDetail;
