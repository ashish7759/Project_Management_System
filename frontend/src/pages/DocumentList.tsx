import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { MasterDocument } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Download,
  AlertTriangle,
  Loader2
} from 'lucide-react';

const DocumentList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [documents, setDocuments] = useState<MasterDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [docType, setDocType] = useState('');
  const [ocrStatus, setOcrStatus] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');

  // Alerts
  const [alert, setAlert] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (docType) params.doc_type = docType;
      if (ocrStatus) params.ocr_status = ocrStatus;
      if (verificationStatus) params.verification_status = verificationStatus;

      const res = await api.get('/documents', { params });
      setDocuments(res.data);
    } catch (err: any) {
      setAlert({ type: 'error', text: 'Failed to retrieve uploaded documents.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [search, docType, ocrStatus, verificationStatus]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this document and its associated records?')) return;
    try {
      await api.delete(`/documents/${id}`);
      setAlert({ type: 'success', text: 'Document deleted successfully.' });
      fetchDocuments();
    } catch (err: any) {
      setAlert({ type: 'error', text: err.response?.data?.detail || 'Failed to delete document.' });
    }
  };

  const handleDownload = (doc: MasterDocument) => {
    // Generate static file URL or request byte stream.
    // In our backend main.py we mounted "/uploads" as static files.
    // The original_file_path is stored as an absolute path, so let's resolve relative to uploads mount.
    // E.g. original_file_path: C:\Users\OMEN\Desktop\...\uploads\2026\06\Work Order\invoice.pdf
    // We want the relative subpath starting from "uploads" or we can trigger download via a file stream!
    // Since we know the filename, let's download it.
    // The easiest way is to let the browser request the path by mapping the absolute file path to a relative URL.
    try {
      const pathParts = doc.original_file_path.replace(/\\/g, '/').split('/uploads/');
      if (pathParts.length > 1) {
        const downloadUrl = `http://localhost:8000/uploads/${pathParts[1]}`;
        window.open(downloadUrl, '_blank');
      } else {
        setAlert({ type: 'error', text: 'Invalid file reference path.' });
      }
    } catch (e) {
      setAlert({ type: 'error', text: 'Could not trigger download.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Document List</h1>
          <p className="text-sm text-slate-500">Track OCR text extraction pipelines and verify project invoice metadata.</p>
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

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none"
            placeholder="Search by file name..."
          />
        </div>

        {/* Format Filter */}
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
        >
          <option value="">All Formats</option>
          <option value="PDF">PDF</option>
          <option value="JPG">JPG/JPEG</option>
          <option value="PNG">PNG</option>
          <option value="DOCX">DOCX</option>
          <option value="XLSX">XLSX</option>
        </select>

        {/* OCR Status */}
        <select
          value={ocrStatus}
          onChange={(e) => setOcrStatus(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
        >
          <option value="">All OCR Statuses</option>
          <option value="Processing">Processing</option>
          <option value="Completed">Completed</option>
          <option value="Failed">Failed</option>
        </select>

        {/* Verification Status */}
        <select
          value={verificationStatus}
          onChange={(e) => setVerificationStatus(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
        >
          <option value="">All Verification Statuses</option>
          <option value="Pending">Pending Verification</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* List Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : documents.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-slate-400">
            <AlertTriangle className="h-8 w-8 stroke-1" />
            <span className="mt-2 text-sm font-medium">No documents uploaded yet.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Doc ID</th>
                  <th className="px-6 py-4">File Details</th>
                  <th className="px-6 py-4">Upload Info</th>
                  <th className="px-6 py-4">OCR Status</th>
                  <th className="px-6 py-4">Verification</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                {documents.map((doc) => (
                  <tr key={doc.document_id} className="hover:bg-slate-50/75">
                    <td className="px-6 py-4 font-mono font-semibold text-slate-500">
                      #{doc.document_id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 line-clamp-1">{doc.file_name}</div>
                      <div className="text-xs text-slate-400">Format: {doc.file_type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{new Date(doc.upload_date).toLocaleDateString()}</div>
                      <div className="text-xs text-slate-400">Uploaded By ID: {doc.uploaded_by || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-1 rounded px-2 py-0.5 text-xs font-medium ${
                        doc.ocr_status === 'Completed'
                          ? 'bg-green-50 text-green-700'
                          : doc.ocr_status === 'Processing'
                            ? 'bg-blue-50 text-blue-700 animate-pulse'
                            : 'bg-red-50 text-red-700'
                      }`}>
                        {doc.ocr_status === 'Processing' && <Loader2 className="h-3 w-3 animate-spin" />}
                        {doc.ocr_status === 'Completed' && <CheckCircle className="h-3 w-3" />}
                        {doc.ocr_status === 'Failed' && <XCircle className="h-3 w-3" />}
                        <span>{doc.ocr_status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${
                        doc.verification_status === 'Approved'
                          ? 'bg-green-100 text-green-800'
                          : doc.verification_status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {doc.verification_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Verify / View Details */}
                        <button
                          onClick={() => navigate(`/documents/${doc.document_id}/verify`)}
                          className="rounded p-1 text-primary-500 hover:bg-slate-100"
                          title="Verify Data / View Details"
                          disabled={doc.ocr_status === 'Processing'}
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </button>

                        {/* Download Original File */}
                        <button
                          onClick={() => handleDownload(doc)}
                          className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          title="Download Original File"
                        >
                          <Download className="h-4.5 w-4.5" />
                        </button>

                        {/* Delete Button (Restricted) */}
                        {(user?.role === 'Admin' || user?.role === 'Manager') && (
                          <button
                            onClick={() => handleDelete(doc.document_id)}
                            className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700"
                            title="Delete Document"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentList;
