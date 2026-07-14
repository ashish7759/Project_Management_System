import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { MasterDocument } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  ArrowLeft, 
  Check, 
  X, 
  Save, 
  Lock, 
  Unlock, 
  Loader2, 
  AlertCircle,
  FileText,
  Plus,
  Trash2,
  Calendar,
  LayoutGrid,
  CheckSquare
} from 'lucide-react';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import FieldConfidence from '../components/ui/FieldConfidence';
import ConfidenceSummary from '../components/ui/ConfidenceSummary';

const DocumentVerify: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language, getTranslatedDept } = useLanguage();

  const [document, setDocument] = useState<MasterDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const [departments, setDepartments] = useState<string[]>([
    'Engineering',
    'Finance',
    'Operations',
    'HR',
    'IT',
    'Administration'
  ]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/projects/departments');
      const names = res.data.map((d: any) => d.department_name);
      setDepartments(names);
    } catch (e) {
      console.warn("Failed to load departments list");
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users/minimal');
      setUsersList(res.data);
    } catch (e) {
      console.warn("Failed to load users list");
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleDatabaseUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const changes = customEvent.detail?.changes || [];
      const hasDeptChanges = changes.some((c: any) => c.table === 'department');
      if (hasDeptChanges) {
        console.log('[Realtime] Re-fetching department list due to DB updates.');
        fetchDepartments();
      }
    };
    window.addEventListener('database-update', handleDatabaseUpdate);
    return () => window.removeEventListener('database-update', handleDatabaseUpdate);
  }, []);

  // Custom dynamic fields & milestones state
  const [customFields, setCustomFields] = useState<Array<{ key: string, label: string, value: string }>>([]);
  const [milestones, setMilestones] = useState<Array<{ target_date: string, planned_progress: number, description: string, tasks?: any[] }>>([]);
  const [usersList, setUsersList] = useState<Array<{ user_id: number, full_name: string }>>([]);

  // For adding a new custom field
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [showAddFieldForm, setShowAddFieldForm] = useState(false);

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { register, handleSubmit, reset } = useForm();

  const fetchDocumentDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/documents/${id}`);
      const docData: MasterDocument = res.data;
      setDocument(docData);

      // Parse AI extracted fields
      let fields: any = {};
      if (docData.ai_extracted_json) {
        try {
          fields = JSON.parse(docData.ai_extracted_json);
        } catch (e) {
          console.warn("Failed to parse ai_extracted_json");
        }
      }

      let core = fields.core_fields || {};
      let custom = fields.custom_fields || [];
      let mileList = fields.milestones || [];

      // Backward compatibility check
      if (!fields.core_fields && Object.keys(fields).length > 0) {
        core = fields;
        custom = [];
        mileList = [];
      }

      // Populate form values
      reset({
        project_name: core.project_name || '',
        project_id: core.project_id || '',
        location: core.location || '',
        district: core.district || '',
        contractor_name: core.contractor_name || '',
        contractor_id: core.contractor_id || '',
        work_order_number: core.work_order_number || '',
        budget_amount: core.budget_amount || 0,
        start_date: core.start_date || '',
        end_date: core.end_date || '',
        department: core.department || (docData.ocr_status === 'Completed' ? 'Engineering' : ''),
        document_type: core.document_type || 'Work Order',
        status: core.status || 'Pending',
        notes: core.notes || '',
        actual_progress: core.actual_progress || 0,
      });

      setCustomFields(custom);
      setMilestones(mileList);

    } catch (err) {
      setAlert({ type: 'error', text: t('docs.verify.failed_retrieve') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentDetails();
  }, [id]);

  const handleAction = async (data: any, action: 'Approve' | 'SaveDraft' | 'Reject') => {
    if (!document) return;
    setSubmitLoading(true);
    setAlert(null);

    const payload = {
      ...data,
      budget_amount: parseFloat(data.budget_amount) || 0.0,
      actual_progress: parseFloat(data.actual_progress) || 0.0,
      action,
      reject_reason: action === 'Reject' ? rejectReason : undefined,
      custom_fields: customFields,
      milestones: milestones,
    };

    try {
      const res = await api.put(`/documents/${document.document_id}/verify`, payload);
      setAlert({ type: 'success', text: res.data.message || t('docs.verify.success_update') });
      
      if (action === 'Approve') {
        fetchDocumentDetails();
      } else if (action === 'Reject') {
        setShowRejectModal(false);
        setRejectReason('');
        fetchDocumentDetails();
      } else {
        fetchDocumentDetails();
      }
    } catch (err: any) {
      console.error(err);
      setAlert({
        type: 'error',
        text: err.response?.data?.detail || t('docs.verify.error_submit')
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCustomFieldChange = (index: number, val: string) => {
    const updated = [...customFields];
    updated[index].value = val;
    setCustomFields(updated);
  };

  const handleRemoveCustomField = (index: number) => {
    const updated = customFields.filter((_, idx) => idx !== index);
    setCustomFields(updated);
  };

  const handleAddCustomField = () => {
    if (!newFieldLabel.trim()) return;
    const key = newFieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
    setCustomFields([...customFields, { key, label: newFieldLabel.trim(), value: newFieldValue }]);
    setNewFieldLabel('');
    setNewFieldValue('');
    setShowAddFieldForm(false);
  };

  const handleMilestoneChange = (index: number, key: 'target_date' | 'planned_progress' | 'description', val: any) => {
    const updated = [...milestones];
    if (key === 'planned_progress') {
      updated[index][key] = parseFloat(val) || 0;
    } else {
      updated[index][key] = val;
    }
    setMilestones(updated);
  };

  const handleRemoveMilestone = (index: number) => {
    const updated = milestones.filter((_, idx) => idx !== index);
    setMilestones(updated);
  };

  const handleAddMilestone = () => {
    setMilestones([...milestones, { target_date: '', planned_progress: 0, description: '', tasks: [] }]);
  };

  const handleAddTask = (milestoneIndex: number) => {
    const updated = [...milestones];
    if (!updated[milestoneIndex].tasks) {
      updated[milestoneIndex].tasks = [];
    }
    updated[milestoneIndex].tasks.push({
      title: '',
      description: '',
      status: 'Pending',
      assigned_to: null,
      due_date: '',
      subtasks: []
    });
    setMilestones(updated);
  };

  const handleRemoveTask = (milestoneIndex: number, taskPath: number[]) => {
    const updated = [...milestones];
    let list = updated[milestoneIndex].tasks || [];
    
    const removeRecursive = (currentList: any[], path: number[]): any[] => {
      const [currIdx, ...rest] = path;
      if (rest.length === 0) {
        return currentList.filter((_, idx) => idx !== currIdx);
      }
      const updatedItem = { ...currentList[currIdx] };
      updatedItem.subtasks = removeRecursive(updatedItem.subtasks || [], rest);
      const copy = [...currentList];
      copy[currIdx] = updatedItem;
      return copy;
    };
    
    updated[milestoneIndex].tasks = removeRecursive(list, taskPath);
    setMilestones(updated);
  };

  const handleTaskChange = (milestoneIndex: number, taskPath: number[], key: string, val: any) => {
    const updated = [...milestones];
    let list = updated[milestoneIndex].tasks || [];
    
    const updateRecursive = (currentList: any[], path: number[]): any[] => {
      const [currIdx, ...rest] = path;
      if (rest.length === 0) {
        const copy = [...currentList];
        copy[currIdx] = {
          ...copy[currIdx],
          [key]: key === 'assigned_to' ? (parseInt(val) || null) : val
        };
        return copy;
      }
      const updatedItem = { ...currentList[currIdx] };
      updatedItem.subtasks = updateRecursive(updatedItem.subtasks || [], rest);
      const copy = [...currentList];
      copy[currIdx] = updatedItem;
      return copy;
    };
    
    updated[milestoneIndex].tasks = updateRecursive(list, taskPath);
    setMilestones(updated);
  };

  const handleAddSubtask = (milestoneIndex: number, parentTaskPath: number[]) => {
    const updated = [...milestones];
    let list = updated[milestoneIndex].tasks || [];
    
    const addSubtaskRecursive = (currentList: any[], path: number[]): any[] => {
      const [currIdx, ...rest] = path;
      if (rest.length === 0) {
        const copy = [...currentList];
        const updatedItem = { ...copy[currIdx] };
        if (!updatedItem.subtasks) {
          updatedItem.subtasks = [];
        }
        updatedItem.subtasks.push({
          title: '',
          description: '',
          status: 'Pending',
          assigned_to: null,
          due_date: '',
          subtasks: []
        });
        copy[currIdx] = updatedItem;
        return copy;
      }
      const updatedItem = { ...currentList[currIdx] };
      updatedItem.subtasks = addSubtaskRecursive(updatedItem.subtasks || [], rest);
      const copy = [...currentList];
      copy[currIdx] = updatedItem;
      return copy;
    };
    
    updated[milestoneIndex].tasks = addSubtaskRecursive(list, parentTaskPath);
    setMilestones(updated);
  };

  const milestonesSum = milestones.reduce((sum, m) => sum + (m.planned_progress || 0), 0);

  const getDocumentViewerUrl = (path: string) => {
    const parts = path.replace(/\\/g, '/').split('/uploads/');
    if (parts.length > 1) {
      return `http://localhost:8000/uploads/${parts[1]}`;
    }
    return '';
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size={32} label={t('docs.verify.loading_details')} />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-text-hint bg-surface rounded-xl border border-primary/10">
        <AlertCircle className="h-8 w-8 stroke-1 text-danger" />
        <span className="mt-2 text-sm font-semibold">{t('docs.verify.not_found')}</span>
      </div>
    );
  }

  const isApproved = document.verification_status === 'Approved';
  const isOperator = user?.role === 'Operator';
  const isViewer = user?.role === 'Viewer';
  const isFormDisabled = isApproved || isViewer;

  const renderTaskEditor = (milestoneIndex: number, tasksList: any[], path: number[]): React.ReactNode => {
    return tasksList.map((task, idx) => {
      const currentPath = [...path, idx];
      
      return (
        <div key={idx} className="space-y-3 bg-surface p-4 rounded-xl border border-primary/10 shadow-sm relative group/task mt-3 text-left transition-all duration-200 hover:shadow-md hover:border-primary/20">
          
          {/* Action buttons (Delete & Add Subtask) - Positioned Absolutely at top-right */}
          {!isFormDisabled && (
            <div className="absolute top-3 right-3 flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => handleAddSubtask(milestoneIndex, currentPath)}
                className="p-1.5 text-text-hint hover:text-primary rounded-lg bg-surface border border-primary/15 hover:border-primary/30 transition shadow-sm cursor-pointer"
                title={language === 'hi' ? 'उप-कार्य जोड़ें' : 'Add Subtask'}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleRemoveTask(milestoneIndex, currentPath)}
                className="p-1.5 text-text-hint hover:text-danger rounded-lg bg-surface border border-primary/15 hover:border-danger/30 transition shadow-sm cursor-pointer"
                title={language === 'hi' ? 'कार्य हटाएं' : 'Remove Task'}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Task Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pr-20">
            
            {/* Title */}
            <div>
              <label className="text-[10px] font-bold text-primary uppercase select-none mb-1 block">
                {language === 'hi' ? 'कार्य शीर्षक' : 'Task Title'}
              </label>
              <input
                type="text"
                value={task.title}
                placeholder="e.g. Excavation site setup"
                disabled={isFormDisabled}
                onChange={(e) => handleTaskChange(milestoneIndex, currentPath, 'title', e.target.value)}
                className="w-full bg-surface border border-primary/25 rounded-lg py-1.5 px-3 text-[12px] text-text-body focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150"
                required
              />
            </div>

            {/* Assignee */}
            <div>
              <label className="text-[10px] font-bold text-primary uppercase select-none mb-1 block">
                {language === 'hi' ? 'सौंपें' : 'Assignee'}
              </label>
              <select
                value={task.assigned_to || ''}
                disabled={isFormDisabled}
                onChange={(e) => handleTaskChange(milestoneIndex, currentPath, 'assigned_to', e.target.value)}
                className="w-full bg-surface border border-primary/25 rounded-lg py-1.5 px-2 text-[12px] text-text-body focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150 cursor-pointer"
              >
                <option value="">{language === 'hi' ? 'अनिर्दिष्ट' : 'Unassigned'}</option>
                {usersList.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] font-bold text-primary uppercase select-none mb-1 block">
                {language === 'hi' ? 'विवरण' : 'Description'}
              </label>
              <input
                type="text"
                value={task.description || ''}
                placeholder="e.g. Clear area & build fence"
                disabled={isFormDisabled}
                onChange={(e) => handleTaskChange(milestoneIndex, currentPath, 'description', e.target.value)}
                className="w-full bg-surface border border-primary/25 rounded-lg py-1.5 px-3 text-[12px] text-text-body focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="text-[10px] font-bold text-primary uppercase select-none mb-1 block">
                {language === 'hi' ? 'नियत तिथि' : 'Due Date'}
              </label>
              <input
                type="date"
                value={task.due_date || ''}
                disabled={isFormDisabled}
                onChange={(e) => handleTaskChange(milestoneIndex, currentPath, 'due_date', e.target.value)}
                className="w-full bg-surface border border-primary/25 rounded-lg py-1.5 px-3 text-[12px] text-text-body focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150 cursor-pointer"
              />
            </div>

          </div>

          {/* Child Subtasks rendering */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="pl-4 border-l-2 border-dashed border-primary/15 mt-2 space-y-2">
              {renderTaskEditor(milestoneIndex, task.subtasks, currentPath)}
            </div>
          )}
        </div>
      );
    });
  };

  const fileViewerUrl = getDocumentViewerUrl(document.original_file_path);
  const fileExt = document.file_type.toLowerCase();
  const isRenderable = ['pdf', 'jpg', 'jpeg', 'png'].includes(fileExt);

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between border-b border-primary/10 bg-surface p-4 rounded-xl shadow-sm">
        <Button
          variant="secondary"
          onClick={() => navigate('/documents')}
          className="!py-1.5 !px-3"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {t('docs.verify.back_to_list')}
        </Button>
        
        <div className="flex items-center space-x-2">
          {isApproved ? (
            <Badge variant="completed" className="font-bold">
              <Lock className="h-3.5 w-3.5 mr-1" />
              <span>{t('docs.verify.approved_locked')}</span>
            </Badge>
          ) : (
            <Badge variant="pending" className="font-bold">
              <Unlock className="h-3.5 w-3.5 mr-1 animate-pulse" />
              <span>{t('docs.verify.pending_verify')}</span>
            </Badge>
          )}
        </div>
      </div>

      {alert && (
        <div className={`flex items-center justify-between rounded-lg border p-4 text-xs ${
          alert.type === 'error' ? 'bg-danger-bg border-danger/25 text-danger' : 'bg-primary-bg2 border-primary/25 text-primary'
        }`}>
          <span>{alert.text}</span>
          <button onClick={() => setAlert(null)} className="font-semibold uppercase tracking-wider text-[10px] cursor-pointer">{t('common.dismiss')}</button>
        </div>
      )}

      {/* Side-by-side view */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Side: Original document */}
        <div className="flex flex-col rounded-xl border border-primary/15 bg-surface p-4 shadow-sm h-[750px]">
          <h3 className="text-sm font-semibold text-primary border-b border-primary/10 pb-2.5 mb-3 flex items-center uppercase tracking-wide">
            <FileText className="mr-1.5 h-4.5 w-4.5" />
            Original File: {document.file_name}
          </h3>
          
          <div className="flex-1 rounded-lg border border-primary/10 bg-primary-bg overflow-hidden">
            {isRenderable && fileViewerUrl ? (
              fileExt === 'pdf' ? (
                <iframe
                  src={`${fileViewerUrl}#toolbar=0`}
                  title="PDF Viewer"
                  className="h-full w-full border-none"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-4 overflow-auto">
                  <img
                    src={fileViewerUrl}
                    alt="Document"
                    className="max-h-full max-w-full object-contain shadow"
                  />
                </div>
              )
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                <FileText className="h-16 w-16 text-text-hint stroke-1" />
                <p className="mt-4 font-semibold text-text-body">{t('docs.verify.preview_unavailable').replace('{type}', document.file_type)}</p>
                <p className="mt-1.5 text-xs text-text-muted">{t('docs.verify.download_help')}</p>
                <div className="mt-6">
                  <a
                    href={fileViewerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-lg bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 shadow-sm text-xs"
                  >
                    {t('docs.verify.download_file')}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Extracted data form */}
        <div className="flex flex-col rounded-xl border border-primary/15 bg-surface p-5 shadow-sm h-[750px] overflow-y-auto">
          <h3 className="text-sm font-semibold text-primary border-b border-primary/10 pb-2.5 mb-4 uppercase tracking-wide">
            {t('docs.verify.parsed_fields')}
          </h3>

          <ConfidenceSummary
            confidenceScores={document?.confidence_scores}
            overallConfidence={document?.overall_confidence}
          />

          <form className="space-y-4 flex-grow" onSubmit={handleSubmit((d) => handleAction(d, 'SaveDraft'))}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              
              {/* Project Name */}
              <div className="sm:col-span-2">
                <Input
                  type="text"
                  label={
                    <div className="flex items-center gap-1.5">
                      <span>{t('projects.project_name')}</span>
                      <FieldConfidence score={document?.confidence_scores?.project_name} />
                    </div>
                  }
                  confidenceScore={document?.confidence_scores?.project_name}
                  disabled={isFormDisabled}
                  {...register('project_name')}
                  required
                />
              </div>

              {/* Project ID */}
              <div>
                <Input
                  type="text"
                  label={
                    <div className="flex items-center gap-1.5">
                      <span>{t('projects.project_id')}</span>
                      <FieldConfidence score={document?.confidence_scores?.project_id} />
                    </div>
                  }
                  confidenceScore={document?.confidence_scores?.project_id}
                  disabled={isFormDisabled}
                  {...register('project_id')}
                  required
                />
              </div>

              {/* Work Order Number */}
              <div>
                <Input
                  type="text"
                  label={
                    <div className="flex items-center gap-1.5">
                      <span>{t('docs.work_order')}</span>
                      <FieldConfidence score={document?.confidence_scores?.work_order_number} />
                    </div>
                  }
                  confidenceScore={document?.confidence_scores?.work_order_number}
                  disabled={isFormDisabled}
                  {...register('work_order_number')}
                />
              </div>

              {/* Contractor Name */}
              <div>
                <Input
                  type="text"
                  label={
                    <div className="flex items-center gap-1.5">
                      <span>{t('projects.contractor')}</span>
                      <FieldConfidence score={document?.confidence_scores?.contractor_name} />
                    </div>
                  }
                  confidenceScore={document?.confidence_scores?.contractor_name}
                  disabled={isFormDisabled}
                  {...register('contractor_name')}
                />
              </div>

              {/* Contractor ID */}
              <div>
                <Input
                  type="text"
                  label={
                    <div className="flex items-center gap-1.5">
                      <span>{t('docs.verify.contractor_id')}</span>
                      <FieldConfidence score={document?.confidence_scores?.contractor_id} />
                    </div>
                  }
                  confidenceScore={document?.confidence_scores?.contractor_id}
                  disabled={isFormDisabled}
                  {...register('contractor_id')}
                />
              </div>

              {/* Location */}
              <div>
                <Input
                  type="text"
                  label={
                    <div className="flex items-center gap-1.5">
                      <span>{t('docs.verify.location_site')}</span>
                      <FieldConfidence score={document?.confidence_scores?.location} />
                    </div>
                  }
                  confidenceScore={document?.confidence_scores?.location}
                  disabled={isFormDisabled}
                  {...register('location')}
                />
              </div>

              {/* District */}
              <div>
                <Input
                  type="text"
                  label={
                    <div className="flex items-center gap-1.5">
                      <span>{t('projects.district')}</span>
                      <FieldConfidence score={document?.confidence_scores?.district} />
                    </div>
                  }
                  confidenceScore={document?.confidence_scores?.district}
                  disabled={isFormDisabled}
                  {...register('district')}
                />
              </div>

              {/* Budget Amount */}
              <div>
                <Input
                  type="number"
                  step="any"
                  label={
                    <div className="flex items-center gap-1.5">
                      <span>{t('docs.budget')}</span>
                      <FieldConfidence score={document?.confidence_scores?.budget_amount} />
                    </div>
                  }
                  confidenceScore={document?.confidence_scores?.budget_amount}
                  disabled={isFormDisabled}
                  {...register('budget_amount')}
                />
              </div>

              {/* Actual Progress (%) */}
              <div>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  max="100"
                  label={language === 'hi' ? 'वास्तविक प्रगति (%)' : 'Actual Progress (%)'}
                  disabled={isFormDisabled}
                  {...register('actual_progress')}
                />
              </div>

              {/* Department */}
              <Select
                label={
                  <div className="flex items-center gap-1.5">
                    <span>{t('common.department')}</span>
                    <FieldConfidence score={document?.confidence_scores?.department} />
                  </div>
                }
                confidenceScore={document?.confidence_scores?.department}
                disabled={isFormDisabled}
                {...register('department')}
              >
                {departments.map(d => (
                  <option key={d} value={d}>
                    {getTranslatedDept(d)}
                  </option>
                ))}
              </Select>

              {/* Start Date */}
              <div>
                <Input
                  type="date"
                  label={
                    <div className="flex items-center gap-1.5">
                      <span>{t('projects.start_date')}</span>
                      <FieldConfidence score={document?.confidence_scores?.start_date} />
                    </div>
                  }
                  confidenceScore={document?.confidence_scores?.start_date}
                  disabled={isFormDisabled}
                  {...register('start_date')}
                />
              </div>

              {/* End Date */}
              <div>
                <Input
                  type="date"
                  label={
                    <div className="flex items-center gap-1.5">
                      <span>{t('projects.end_date')}</span>
                      <FieldConfidence score={document?.confidence_scores?.end_date} />
                    </div>
                  }
                  confidenceScore={document?.confidence_scores?.end_date}
                  disabled={isFormDisabled}
                  {...register('end_date')}
                />
              </div>

              {/* Document Type */}
              <Select
                label={
                  <div className="flex items-center gap-1.5">
                    <span>{t('docs.doc_type')}</span>
                    <FieldConfidence score={document?.confidence_scores?.document_type} />
                  </div>
                }
                confidenceScore={document?.confidence_scores?.document_type}
                disabled={isFormDisabled}
                {...register('document_type')}
              >
                <option value="Work Order">{t('docs.work_order')}</option>
                <option value="Inspection Report">Inspection Report</option>
                <option value="Budget Approval">Budget Approval</option>
                <option value="Transformer Record">Transformer Record</option>
                <option value="Contractor Agreement">Contractor Agreement</option>
                <option value="Other">Other</option>
              </Select>

              {/* Status */}
              <Select
                label={
                  <div className="flex items-center gap-1.5">
                    <span>{t('docs.verify.project_status')}</span>
                    <FieldConfidence score={document?.confidence_scores?.status} />
                  </div>
                }
                confidenceScore={document?.confidence_scores?.status}
                disabled={isFormDisabled}
                {...register('status')}
              >
                <option value="Pending">{t('projects.status.pending')}</option>
                <option value="In Progress">{t('projects.status.inprogress')}</option>
                <option value="Completed">{t('projects.status.completed')}</option>
                <option value="Delayed">{t('projects.status.delayed')}</option>
              </Select>

              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="text-[13px] font-medium text-primary mb-1 select-none flex items-center gap-1.5">
                  <span>{t('docs.verify.notes')}</span>
                  <FieldConfidence score={document?.confidence_scores?.description} />
                </label>
                <textarea
                  disabled={isFormDisabled}
                  {...register('notes')}
                  rows={2}
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--input-text)',
                    borderRadius: '8px',
                    borderColor: document?.confidence_scores?.description !== undefined && document?.confidence_scores?.description !== null
                      ? document.confidence_scores.description < 60
                        ? '#b91c1c'
                        : document.confidence_scores.description < 85
                          ? '#c9a84c'
                          : 'var(--input-border)'
                      : 'var(--input-border)',
                    borderWidth: document?.confidence_scores?.description !== undefined && document?.confidence_scores?.description !== null
                      ? document.confidence_scores.description < 60
                        ? '2px'
                        : document.confidence_scores.description < 85
                          ? '1.5px'
                          : '1px'
                      : '1px',
                  }}
                  className="w-full bg-surface rounded-lg py-[0.6rem] px-[0.9rem] text-[13px] text-text-body placeholder-text-hint focus:outline-none focus:border-2 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-150"
                  placeholder="Verification observations..."
                />
              </div>

              {/* Dynamic Custom Fields Section */}
              <div className="sm:col-span-2 border-t border-primary/10 pt-5 mt-3 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <LayoutGrid className="h-4 w-4 text-primary" />
                    <h4 className="text-[13px] font-bold text-primary uppercase tracking-wide">
                      {language === 'hi' ? 'अतिरिक्त निकाले गए फ़ील्ड' : 'Additional Extracted Fields'}
                    </h4>
                  </div>
                  {!isFormDisabled && (
                    <Button
                      type="button"
                      variant="secondary"
                      className="!py-1 !px-2.5 !text-xs flex items-center space-x-1"
                      onClick={() => setShowAddFieldForm(true)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{language === 'hi' ? 'नया फ़ील्ड जोड़ें' : 'Add Custom Field'}</span>
                    </Button>
                  )}
                </div>

                {/* Form to add a new custom field */}
                {showAddFieldForm && (
                  <div className="bg-primary-bg p-3.5 rounded-lg border border-primary/15 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-primary uppercase select-none">{language === 'hi' ? 'फ़ील्ड का नाम' : 'Field Label'}</label>
                        <input
                          type="text"
                          value={newFieldLabel}
                          onChange={(e) => setNewFieldLabel(e.target.value)}
                          placeholder="e.g. Substation Name"
                          className="w-full bg-surface border border-primary/25 rounded py-1.5 px-3 text-[12px] text-text-body focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-primary uppercase select-none">{language === 'hi' ? 'फ़ील्ड का मान' : 'Field Value'}</label>
                        <input
                          type="text"
                          value={newFieldValue}
                          onChange={(e) => setNewFieldValue(e.target.value)}
                          placeholder="e.g. Dhurwa Substation"
                          className="w-full bg-surface border border-primary/25 rounded py-1.5 px-3 text-[12px] text-text-body focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="!py-1 !px-3 !text-xs"
                        onClick={() => { setShowAddFieldForm(false); setNewFieldLabel(''); setNewFieldValue(''); }}
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        className="!py-1 !px-3 !text-xs"
                        onClick={handleAddCustomField}
                        disabled={!newFieldLabel.trim()}
                      >
                        {language === 'hi' ? 'जोड़ें' : 'Add'}
                      </Button>
                    </div>
                  </div>
                )}

                {customFields.length === 0 ? (
                  <p className="text-xs text-text-hint select-none pl-1 italic">
                    {language === 'hi' ? 'इस फ़ाइल के लिए कोई अतिरिक्त फ़ील्ड नहीं निकाला गया।' : 'No additional custom fields extracted for this file.'}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 bg-primary-bg/30 p-3 rounded-lg border border-primary/5">
                    {customFields.map((field, index) => (
                      <div key={field.key} className="flex items-end space-x-2 relative group">
                        <div className="flex-1">
                          <label className="text-[12px] font-medium text-primary mb-1 select-none block truncate" title={field.label}>
                             {field.label}
                          </label>
                          <input
                            type="text"
                            value={field.value}
                            disabled={isFormDisabled}
                            onChange={(e) => handleCustomFieldChange(index, e.target.value)}
                            className="w-full bg-surface border border-primary/25 rounded-lg py-[0.55rem] px-[0.8rem] text-[13px] text-text-body focus:outline-none focus:border-2 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-150"
                          />
                        </div>
                        {!isFormDisabled && (
                          <button
                            type="button"
                            className="p-2.5 text-text-hint hover:text-danger rounded-lg bg-surface border border-primary/15 hover:border-danger/30 transition shadow-sm mb-0.5"
                            onClick={() => handleRemoveCustomField(index)}
                            title="Remove Field"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Milestones Section */}
              <div className="sm:col-span-2 border-t border-primary/10 pt-5 mt-3 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <h4 className="text-[13px] font-bold text-primary uppercase tracking-wide">
                      {language === 'hi' ? 'परियोजना मील के पत्थर' : 'Project Milestones'}
                    </h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      milestonesSum === 100 
                        ? 'bg-primary-bg2 border-primary/20 text-primary' 
                        : 'bg-danger-bg border-danger/25 text-danger'
                    }`}>
                      {language === 'hi' ? 'कुल प्रगति' : 'Total Progress'}: {milestonesSum}%
                    </span>
                  </div>
                  {!isFormDisabled && (
                    <Button
                      type="button"
                      variant="secondary"
                      className="!py-1 !px-2.5 !text-xs flex items-center space-x-1"
                      onClick={handleAddMilestone}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{language === 'hi' ? 'मील का पत्थर जोड़ें' : 'Add Milestone'}</span>
                    </Button>
                  )}
                </div>

                {milestones.length === 0 ? (
                  <p className="text-xs text-text-hint select-none pl-1 italic">
                    {language === 'hi' ? 'इस फ़ाइल से कोई मील का पत्थर नहीं मिला।' : 'No milestones detected from this file.'}
                  </p>
                ) : (
                  <div className="space-y-3 bg-primary-bg/30 p-3 rounded-lg border border-primary/5">
                    {milestones.map((m, index) => (
                      <div key={index} className="flex flex-col gap-3.5 bg-surface p-4 rounded-xl border border-primary/15 shadow-sm relative group text-left">
                        
                        {/* Milestone Input Row */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          {/* Milestone Description */}
                          <div className="flex-1">
                            <label className="text-[11px] font-bold text-primary uppercase select-none mb-1 block">
                              {language === 'hi' ? 'विवरण' : 'Description'}
                            </label>
                            <input
                              type="text"
                              value={m.description}
                              placeholder="e.g. Foundations & Cable laying"
                              disabled={isFormDisabled}
                              onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                              className="w-full bg-surface border border-primary/25 rounded py-1.5 px-3 text-[12px] text-text-body focus:outline-none focus:border-primary"
                            />
                          </div>

                          {/* Milestone Date */}
                          <div className="w-full sm:w-40">
                            <label className="text-[11px] font-bold text-primary uppercase select-none mb-1 block">
                              {language === 'hi' ? 'लक्ष्य तिथि' : 'Target Date'}
                            </label>
                            <input
                              type="date"
                              value={m.target_date}
                              disabled={isFormDisabled}
                              onChange={(e) => handleMilestoneChange(index, 'target_date', e.target.value)}
                              className="w-full bg-surface border border-primary/25 rounded py-1.5 px-3 text-[12px] text-text-body focus:outline-none focus:border-primary"
                            />
                          </div>

                          {/* Progress % */}
                          <div className="w-full sm:w-28 flex items-end space-x-2">
                            <div className="flex-1">
                              <label className="text-[11px] font-bold text-primary uppercase select-none mb-1 block truncate">
                                {language === 'hi' ? 'प्रगति %' : 'Progress %'}
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={m.planned_progress}
                                disabled={isFormDisabled}
                                onChange={(e) => handleMilestoneChange(index, 'planned_progress', e.target.value)}
                                className="w-full bg-surface border border-primary/25 rounded py-1.5 px-3 text-[12px] text-text-body focus:outline-none focus:border-primary"
                              />
                            </div>
                            {!isFormDisabled && (
                              <button
                                type="button"
                                className="p-2 text-text-hint hover:text-danger rounded bg-primary-bg border border-primary/10 hover:border-danger/30 transition shadow-sm mb-0.5 cursor-pointer"
                                onClick={() => handleRemoveMilestone(index)}
                                title="Remove Milestone"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Milestone Tasks Section */}
                        <div className="border-t border-primary/5 pt-3.5 mt-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-primary uppercase tracking-wide flex items-center gap-1.5 select-none">
                              <CheckSquare className="h-3.5 w-3.5" />
                              {language === 'hi' ? 'मील का पत्थर कार्य' : 'Milestone Tasks'}
                            </span>
                            {!isFormDisabled && (
                              <button
                                type="button"
                                onClick={() => handleAddTask(index)}
                                className="text-[10px] font-bold text-primary hover:text-primary-dark flex items-center gap-1 cursor-pointer bg-primary-bg px-2.5 py-1 rounded-md border border-primary/15 transition shadow-sm"
                              >
                                <Plus className="h-3 w-3" />
                                <span>{language === 'hi' ? 'कार्य जोड़ें' : 'Add Task'}</span>
                              </button>
                            )}
                          </div>

                          {/* Render Tasks List Recursively */}
                          {(!m.tasks || m.tasks.length === 0) ? (
                            <p className="text-[10px] text-text-hint italic pl-1 text-left select-none">
                              {language === 'hi' ? 'इस मील के पत्थर के तहत कोई कार्य निर्धारित नहीं है।' : 'No tasks scheduled under this milestone.'}
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {renderTaskEditor(index, m.tasks, [])}
                            </div>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                )}
                
                {milestonesSum !== 100 && milestones.length > 0 && (
                  <p className="text-[11px] text-danger bg-danger-bg/50 border border-danger/15 rounded p-2 flex items-center">
                    <AlertCircle className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                    <span>
                      {language === 'hi' 
                        ? 'चेतावनी: मील के पत्थर की संचयी प्रगति का योग 100% होना चाहिए (वर्तमान में ' + milestonesSum + '% है)' 
                        : 'Warning: Combined milestone progress should ideally equal 100% (currently ' + milestonesSum + '%)'
                      }
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            {!isApproved && !isViewer && (
              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-primary/10 pt-5 mt-4">
                {/* Save Draft Button */}
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={submitLoading}
                >
                  {submitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>{t('docs.verify.save_draft')}</span>
                </Button>

                {/* Approve & Reject (Restricted to Manager and Admin) */}
                {!isOperator && (
                  <>
                    {/* Reject Button */}
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => setShowRejectModal(true)}
                      disabled={submitLoading}
                    >
                      <X className="h-4 w-4" />
                      <span>{t('common.reject')}</span>
                    </Button>

                    {/* Approve Button */}
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleSubmit((data) => handleAction(data, 'Approve'))}
                      disabled={submitLoading}
                    >
                      <Check className="h-4 w-4" />
                      <span>{t('docs.verify.approve_lock')}</span>
                    </Button>
                  </>
                )}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Rejection Reason Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => { setShowRejectModal(false); setRejectReason(''); }}
        title={t('docs.verify.reject_title')}
        variant="danger"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              className="bg-danger text-white hover:bg-red-800"
              onClick={handleSubmit((data) => handleAction(data, 'Reject'))}
              disabled={!rejectReason.trim() || submitLoading}
            >
              {submitLoading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {t('docs.verify.confirm_rejection')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-text-muted">{t('docs.verify.reject_help')}</p>
          <div className="w-full flex flex-col items-start">
            <label className="text-[13px] font-medium text-primary mb-1 select-none">{t('docs.reject_reason')}</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full bg-surface border border-primary/25 rounded-lg py-[0.6rem] px-[0.9rem] text-[13px] text-text-body placeholder-text-hint focus:outline-none focus:border-2 focus:border-danger focus:ring-4 focus:ring-danger/10 transition-all duration-150"
              placeholder={t('docs.verify.reject_placeholder')}
              required
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentVerify;
