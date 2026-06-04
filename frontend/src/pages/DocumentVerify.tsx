import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { MasterDocument } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  Check, 
  X, 
  Save, 
  Lock, 
  Unlock, 
  Loader2, 
  AlertCircle,
  FileText
} from 'lucide-react';

const DocumentVerify: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [document, setDocument] = useState<MasterDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { register, handleSubmit, reset, setValue } = useForm();

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

      // Populate form values
      reset({
        project_name: fields.project_name || '',
        project_id: fields.project_id || '',
        location: fields.location || '',
        district: fields.district || '',
        contractor_name: fields.contractor_name || '',
        contractor_id: fields.contractor_id || '',
        work_order_number: fields.work_order_number || '',
        budget_amount: fields.budget_amount || 0,
        start_date: fields.start_date || '',
        end_date: fields.end_date || '',
        department: fields.department || docData.ocr_status === 'Completed' ? 'Engineering' : '',
        document_type: fields.document_type || 'Work Order',
        status: fields.status || 'Pending',
        notes: fields.notes || '',
      });

    } catch (err) {
      setAlert({ type: 'error', text: 'Failed to retrieve document metadata.' });
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
      action,
      reject_reason: action === 'Reject' ? rejectReason : undefined,
    };

    try {
      const res = await api.put(`/documents/${document.document_id}/verify`, payload);
      setAlert({ type: 'success', text: res.data.message || 'Verification updated successfully.' });
      
      if (action === 'Approve') {
        // Fetch details again to trigger lock mode
        fetchDocumentDetails();
      } else if (action === 'Reject') {
        setShowRejectModal(false);
        setRejectReason('');
        fetchDocumentDetails();
      } else {
        // SaveDraft
        fetchDocumentDetails();
      }
    } catch (err: any) {
      console.error(err);
      setAlert({
        type: 'error',
        text: err.response?.data?.detail || 'An error occurred during submission.'
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Helper to map absolute paths to localhost static mount
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
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-slate-400">
        <AlertCircle className="h-8 w-8 stroke-1 text-red-500" />
        <span className="mt-2 text-sm font-semibold">Document details not found.</span>
      </div>
    );
  }

  const isApproved = document.verification_status === 'Approved';
  const isOperator = user?.role === 'Operator';
  const isViewer = user?.role === 'Viewer';
  // Operator cannot Approve or Reject. Approved status locks form inputs.
  const isFormDisabled = isApproved || isViewer;

  const fileViewerUrl = getDocumentViewerUrl(document.original_file_path);
  const fileExt = document.file_type.toLowerCase();
  const isRenderable = ['pdf', 'jpg', 'jpeg', 'png'].includes(fileExt);

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4 rounded-xl shadow-sm">
        <button
          onClick={() => navigate('/documents')}
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to List
        </button>
        
        <div className="flex items-center space-x-2">
          {isApproved ? (
            <span className="inline-flex items-center space-x-1.5 rounded-lg bg-green-50 px-3 py-1 text-xs font-bold text-green-700 border border-green-200">
              <Lock className="h-3.5 w-3.5" />
              <span>APPROVED & MASTER RECORD LOCKED</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 rounded-lg bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
              <Unlock className="h-3.5 w-3.5 animate-pulse" />
              <span>PENDING VERIFICATION</span>
            </span>
          )}
        </div>
      </div>

      {alert && (
        <div className={`flex items-center justify-between rounded-lg border p-4 text-sm ${
          alert.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'
        }`}>
          <span>{alert.text}</span>
          <button onClick={() => setAlert(null)} className="font-semibold uppercase tracking-wider text-xs">Dismiss</button>
        </div>
      )}

      {/* Side-by-side view */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Side: Original document */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm h-[750px]">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 mb-3 flex items-center">
            <FileText className="mr-1.5 h-4 w-4 text-slate-500" />
            Original File: {document.file_name}
          </h3>
          
          <div className="flex-1 rounded-lg border border-slate-100 bg-slate-50 overflow-hidden">
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
                <FileText className="h-16 w-16 text-slate-400 stroke-1" />
                <p className="mt-4 font-semibold text-slate-800">Preview not available for {document.file_type} format</p>
                <p className="mt-1.5 text-xs text-slate-500">You can download the original file to view it on your local system.</p>
                <a
                  href={fileViewerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex items-center rounded-lg bg-primary-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-primary-600"
                >
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Extracted data form */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm h-[750px] overflow-y-auto">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 mb-4">
            Parsed Intelligence Fields
          </h3>

          <form className="space-y-4 flex-1" onSubmit={handleSubmit((d) => handleAction(d, 'SaveDraft'))}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Project Name */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Name</label>
                <input
                  type="text"
                  disabled={isFormDisabled}
                  {...register('project_name')}
                  className="mt-1 block w-full rounded-lg border border-slate-350 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-450"
                  required
                />
              </div>

              {/* Project ID */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project ID</label>
                <input
                  type="text"
                  disabled={isFormDisabled}
                  {...register('project_id')}
                  className="mt-1 block w-full rounded-lg border border-slate-350 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-450"
                  required
                />
              </div>

              {/* Work Order Number */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Work Order Number</label>
                <input
                  type="text"
                  disabled={isFormDisabled}
                  {...register('work_order_number')}
                  className="mt-1 block w-full rounded-lg border border-slate-350 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-450"
                />
              </div>

              {/* Contractor Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contractor Name</label>
                <input
                  type="text"
                  disabled={isFormDisabled}
                  {...register('contractor_name')}
                  className="mt-1 block w-full rounded-lg border border-slate-350 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-slate-50"
                />
              </div>

              {/* Contractor ID */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contractor ID</label>
                <input
                  type="text"
                  disabled={isFormDisabled}
                  {...register('contractor_id')}
                  className="mt-1 block w-full rounded-lg border border-slate-350 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-slate-50"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location / Site</label>
                <input
                  type="text"
                  disabled={isFormDisabled}
                  {...register('location')}
                  className="mt-1 block w-full rounded-lg border border-slate-350 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-slate-50"
                />
              </div>

              {/* District */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">District</label>
                <input
                  type="text"
                  disabled={isFormDisabled}
                  {...register('district')}
                  className="mt-1 block w-full rounded-lg border border-slate-350 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-slate-50"
                />
              </div>

              {/* Budget Amount */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Budget Amount (INR)</label>
                <input
                  type="number"
                  step="any"
                  disabled={isFormDisabled}
                  {...register('budget_amount')}
                  className="mt-1 block w-full rounded-lg border border-slate-350 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-slate-50"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</label>
                <select
                  disabled={isFormDisabled}
                  {...register('department')}
                  className="mt-1 block w-full rounded-lg border border-slate-350 bg-white px-3 py-2 text-sm text-slate-805 focus:outline-none disabled:bg-slate-50"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                  <option value="HR">HR</option>
                  <option value="IT">IT</option>
                  <option value="Administration">Administration</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
                <input
                  type="date"
                  disabled={isFormDisabled}
                  {...register('start_date')}
                  className="mt-1 block w-full rounded-lg border border-slate-350 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-slate-50"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Date</label>
                <input
                  type="date"
                  disabled={isFormDisabled}
                  {...register('end_date')}
                  className="mt-1 block w-full rounded-lg border border-slate-350 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-slate-50"
                />
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Document Type</label>
                <select
                  disabled={isFormDisabled}
                  {...register('document_type')}
                  className="mt-1 block w-full rounded-lg border border-slate-350 bg-white px-3 py-2 text-sm text-slate-805 focus:outline-none disabled:bg-slate-50"
                >
                  <option value="Work Order">Work Order</option>
                  <option value="Inspection Report">Inspection Report</option>
                  <option value="Budget Approval">Budget Approval</option>
                  <option value="Transformer Record">Transformer Record</option>
                  <option value="Contractor Agreement">Contractor Agreement</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Status</label>
                <select
                  disabled={isFormDisabled}
                  {...register('status')}
                  className="mt-1 block w-full rounded-lg border border-slate-350 bg-white px-3 py-2 text-sm text-slate-805 focus:outline-none disabled:bg-slate-50"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Delayed">Delayed</option>
                </select>
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verification Notes</label>
                <textarea
                  disabled={isFormDisabled}
                  {...register('notes')}
                  rows={2}
                  className="mt-1 block w-full rounded-lg border border-slate-350 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-slate-50"
                  placeholder="Verification observations..."
                />
              </div>
            </div>

            {/* Bottom Actions */}
            {!isApproved && !isViewer && (
              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-5">
                {/* Save Draft Button (All Operators, Managers, Admins) */}
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow hover:bg-slate-50 disabled:opacity-50"
                >
                  {submitLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                  Save Draft
                </button>

                {/* Approve & Reject (Restricted to Manager and Admin) */}
                {!isOperator && (
                  <>
                    {/* Reject Button */}
                    <button
                      type="button"
                      onClick={() => setShowRejectModal(true)}
                      disabled={submitLoading}
                      className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 shadow hover:bg-red-100 disabled:opacity-50"
                    >
                      <X className="mr-1.5 h-3.5 w-3.5" />
                      Reject
                    </button>

                    {/* Approve Button */}
                    <button
                      type="button"
                      onClick={handleSubmit((data) => handleAction(data, 'Approve'))}
                      disabled={submitLoading}
                      className="inline-flex items-center rounded-lg bg-primary-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-primary-600 disabled:opacity-50"
                    >
                      <Check className="mr-1.5 h-3.5 w-3.5" />
                      Approve & Lock
                    </button>
                  </>
                )}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Rejection Reason modal dialog */}
      {showRejectModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Reject Document</h3>
            <p className="mt-1 text-xs text-slate-500">Provide the rejection reason. This will log in the document history.</p>
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-400 uppercase">Reason for Rejection</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 shadow focus:border-red-500 focus:outline-none"
                placeholder="e.g. Scanned image is too blurry. Re-upload."
                required
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 mt-4">
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                className="rounded-lg border border-slate-250 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit((data) => handleAction(data, 'Reject'))}
                disabled={!rejectReason.trim() || submitLoading}
                className="inline-flex items-center rounded-lg bg-red-650 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-red-700 disabled:opacity-50"
              >
                {submitLoading && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentVerify;
