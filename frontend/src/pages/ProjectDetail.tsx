import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
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
  Loader2,
  CheckCircle
} from 'lucide-react';

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
  const [data, setData] = useState<ProjectDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/projects/${id}`);
      setData(res.data);
    } catch (err) {
      setErrorMsg('Failed to load project details.');
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
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-slate-400">
        <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
        <span className="text-sm font-semibold">{errorMsg || 'Project details not found.'}</span>
        <button onClick={() => navigate('/projects')} className="mt-4 text-xs font-semibold text-primary-500 hover:underline">
          Back to Projects List
        </button>
      </div>
    );
  }

  const { project, documents, contractors, timeline, milestones, activity_log } = data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'In Progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Delayed': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4 rounded-xl shadow-sm">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </button>
        <div className="text-xs text-slate-400">
          Project ID: <span className="font-mono font-bold text-slate-700">{project.project_id}</span>
        </div>
      </div>

      {/* Main Info Header Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Project Name and Department Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 space-y-4">
          <div>
            <span className="inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase text-primary-600 bg-primary-50 border-primary-100">
              {project.department_name || 'General'}
            </span>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">{project.project_name}</h2>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex items-center">
              <MapPin className="mr-1.5 h-4 w-4 text-slate-400" />
              <span>{project.location || 'N/A'}, {project.district || 'Jharkhand'}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="mr-1.5 h-4 w-4 text-slate-400" />
              <span>{project.start_date || 'N/A'} to {project.end_date || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Budget Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Sanctioned Budget</span>
            <IndianRupee className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900">
              ₹{project.budget_amount ? project.budget_amount.toLocaleString('en-IN') : '0.00'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Released in INR</p>
          </div>
        </div>

        {/* Status Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Project Status</span>
            <ActivityIcon className="h-5 w-5 text-primary-500" />
          </div>
          <div className="mt-4">
            <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-bold uppercase tracking-wider ${getStatusColor(project.status)}`}>
              {project.status}
            </span>
            <p className="text-xs text-slate-400 mt-2">Calculated dynamically</p>
          </div>
        </div>
      </div>

      {/* Progress Comparator Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
          <TrendingUp className="mr-1.5 h-4 w-4 text-primary-500" />
          Progress Comparison
        </h3>
        
        <div className="space-y-4">
          {/* Actual Progress */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="text-slate-600">Actual Physical Progress</span>
              <span className="font-bold text-slate-900">{project.actual_progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-primary-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${project.actual_progress}%` }}
              ></div>
            </div>
          </div>

          {/* Planned Progress */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="text-slate-600">Planned Milestone Target</span>
              <span className="font-bold text-slate-900">{project.planned_progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${project.planned_progress}%` }}
              ></div>
            </div>
          </div>

          {/* Variance details */}
          <div className="pt-2 flex justify-between items-center text-xs">
            <span className="text-slate-400">Variance (Actual - Planned):</span>
            <span className={`font-bold ${
              project.actual_progress - project.planned_progress >= 0 
                ? 'text-green-600' 
                : 'text-red-500'
            }`}>
              {(project.actual_progress - project.planned_progress).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Linked Documents & Contractors */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* Linked Documents Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center">
            <FileText className="mr-1.5 h-4 w-4 text-slate-500" />
            Linked Document Credentials
          </h3>

          {documents.length === 0 ? (
            <p className="text-xs text-slate-400">No linked intelligence files found.</p>
          ) : (
            <div className="space-y-3">
              {documents.map(doc => (
                <div key={doc.document_id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-xs">
                  <div>
                    <div className="font-semibold text-slate-800 line-clamp-1">{doc.file_name}</div>
                    <div className="text-[10px] text-slate-400">Uploaded on {new Date(doc.upload_date).toLocaleDateString()}</div>
                  </div>
                  <Link
                    to={`/documents/${doc.document_id}/verify`}
                    className="inline-flex items-center text-xs font-semibold text-primary-500 hover:text-primary-600"
                  >
                    View OCR Text
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contractor details */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center">
            <User className="mr-1.5 h-4 w-4 text-slate-500" />
            Agency & Contractor Info
          </h3>

          {contractors.length === 0 ? (
            <p className="text-xs text-slate-400">No contractor profiles associated with this project.</p>
          ) : (
            <div className="space-y-3">
              {contractors.map(c => (
                <div key={c.contractor_id} className="rounded-lg border border-slate-150 p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">{c.contractor_name}</span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-500 uppercase">
                      ID: {c.contractor_id}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-500 pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400">Work Order Number</span>
                      <p className="text-slate-800 font-semibold">{c.work_order_number || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400">Contact Details</span>
                      <p className="text-slate-800">{c.contact_info || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Planned Milestones List */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center">
            <Calendar className="mr-1.5 h-4 w-4 text-slate-500" />
            Planned Milestones Schedule
          </h3>

          {milestones.length === 0 ? (
            <p className="text-xs text-slate-400">No milestones scheduled for this project.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {milestones.map(m => (
                <div key={m.milestone_id} className="flex items-center justify-between border-b border-slate-100 py-2 text-xs">
                  <div className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-slate-350" />
                    <span>Target Date: <span className="font-semibold">{m.target_date}</span></span>
                  </div>
                  <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">{m.planned_progress}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress History Timeline */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center">
            <Clock className="mr-1.5 h-4 w-4 text-slate-500" />
            Physical Progress Log
          </h3>

          {timeline.length === 0 ? (
            <p className="text-xs text-slate-400">No progress updates logged yet.</p>
          ) : (
            <div className="relative border-l border-slate-200 pl-4 space-y-4 max-h-60 overflow-y-auto">
              {timeline.map(t => (
                <div key={t.history_id} className="relative text-xs">
                  {/* Dot */}
                  <div className="absolute -left-[21px] mt-1 h-2.5 w-2.5 rounded-full bg-primary-500"></div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Physical Progress: {t.actual_progress}%</span>
                    <span className="text-[10px] text-slate-400">{new Date(t.updated_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-500 mt-1">{t.notes || 'No description notes provided.'}</p>
                  <p className="text-[10px] text-slate-450 mt-0.5">Updated by: {t.updater_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Activity Log Audit */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          Project Activity Logs
        </h3>
        
        {activity_log.length === 0 ? (
          <p className="text-xs text-slate-400">No activity trail records matching Project ID.</p>
        ) : (
          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {activity_log.map((log, idx) => (
              <div key={idx} className="flex justify-between py-2 text-xs text-slate-500">
                <div>
                  <span className="font-semibold text-slate-700">{log.username}</span> performed{' '}
                  <span className="text-primary-500 font-medium">{log.action_type}</span>
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
