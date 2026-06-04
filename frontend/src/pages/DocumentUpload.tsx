import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const DocumentUpload: React.FC = () => {
  const navigate = useNavigate();

  // File states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // Metadata form states
  const [docType, setDocType] = useState('Work Order');
  const [department, setDepartment] = useState('Engineering');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [projectId, setProjectId] = useState('');

  // Uploading state
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const docTypes = [
    'Work Order',
    'Inspection Report',
    'Budget Approval',
    'Transformer Record',
    'Contractor Agreement',
    'Other'
  ];

  const departments = [
    'Engineering',
    'Finance',
    'Operations',
    'HR',
    'IT',
    'Administration'
  ];

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setNotification(null);
    
    // Check file size (20MB)
    const maxBytes = 20 * 1024 * 1024;
    if (file.size > maxBytes) {
      setNotification({ type: 'error', text: 'File exceeds maximum size of 20MB.' });
      setSelectedFile(null);
      return;
    }

    // Check file extension
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.tif', '.docx', '.xlsx'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setNotification({
        type: 'error',
        text: 'Unsupported file format. Please upload PDF, JPG, PNG, TIFF, DOCX, or XLSX.'
      });
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setNotification({ type: 'error', text: 'Please select or drop a file to upload.' });
      return;
    }

    setUploading(true);
    setNotification(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('document_type', docType);
    formData.append('department', department);
    if (description) formData.append('description', description);
    if (tags) formData.append('tags', tags);
    if (projectId) formData.append('project_id', projectId);

    try {
      await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setNotification({
        type: 'success',
        text: 'Document uploaded successfully! Starting background OCR extraction...'
      });
      
      setSelectedFile(null);
      setDescription('');
      setTags('');
      setProjectId('');

      // Redirect to list to see processing state after 2 seconds
      setTimeout(() => {
        navigate('/documents');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setNotification({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to upload document. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Upload Document</h1>
        <p className="text-sm text-slate-500">Upload contract papers, inspection reports, or work orders to trigger AI metadata extraction.</p>
      </div>

      {notification && (
        <div className={`flex items-center space-x-2 rounded-lg border p-4 text-sm ${
          notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'
        }`}>
          {notification.type === 'error' ? <AlertCircle className="h-5 w-5 text-red-600" /> : <CheckCircle className="h-5 w-5 text-green-600" />}
          <span>{notification.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Dropzone Area */}
        <div className="lg:col-span-2">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`flex h-96 flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all ${
              isDragActive 
                ? 'border-primary-500 bg-primary-50/50 scale-[0.99]' 
                : 'border-slate-350 bg-white hover:border-slate-400'
            }`}
          >
            <input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf, .jpg, .jpeg, .png, .tiff, .tif, .docx, .xlsx"
            />
            
            <div className="flex flex-col items-center justify-center text-center p-6">
              <div className="rounded-full bg-slate-100 p-4 text-slate-500 shadow-inner">
                <UploadCloud className="h-10 w-10 text-primary-500 animate-pulse" />
              </div>
              
              {selectedFile ? (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold text-slate-900 flex items-center justify-center">
                    <FileText className="mr-1.5 h-4 w-4 text-slate-500" />
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-xs font-semibold text-red-500 hover:underline"
                  >
                    Remove and select another
                  </button>
                </div>
              ) : (
                <>
                  <p className="mt-4 text-sm font-semibold text-slate-800">
                    Drag and drop file here, or{' '}
                    <label htmlFor="file-upload" className="cursor-pointer text-primary-500 hover:text-primary-600 font-bold hover:underline">
                      browse computer
                    </label>
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Supports PDF, JPG, PNG, TIFF, DOCX, XLSX up to 20MB.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Metadata Sidebar Form */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Document Metadata</h3>
          <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
            
            {/* Doc Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary-500 focus:outline-none"
              >
                {docTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase">Department Origin</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary-500 focus:outline-none"
              >
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Project ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase">Project ID (Optional)</label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary-500 focus:outline-none"
                placeholder="e.g. JBO-RNC-09"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary-500 focus:outline-none"
                placeholder="Brief summary of document content..."
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase">Search Tags (Comma separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary-500 focus:outline-none"
                placeholder="transformer, tender, agreement"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="flex w-full items-center justify-center rounded-lg bg-primary-500 py-2.5 text-sm font-semibold text-white shadow hover:bg-primary-600 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading File...
                </>
              ) : (
                'Process Document'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
