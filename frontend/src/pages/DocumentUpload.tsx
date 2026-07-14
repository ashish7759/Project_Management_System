import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';

interface DocumentUploadProps {
  hideHeader?: boolean;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ hideHeader = false }) => {
  const navigate = useNavigate();
  const { t, language, getTranslatedDept } = useLanguage();

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

  useEffect(() => {
    fetchDepartments();
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

  const getTranslatedDocType = (type: string) => {
    switch (type) {
      case 'Work Order': return t('docs.type.work_order');
      case 'Inspection Report': return t('docs.type.inspection');
      case 'Budget Approval': return t('docs.type.budget');
      case 'Transformer Record': return t('docs.type.transformer');
      case 'Contractor Agreement': return t('docs.type.contractor');
      default: return t('docs.type.other');
    }
  };


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
    
    const maxBytes = 20 * 1024 * 1024;
    if (file.size > maxBytes) {
      setNotification({ type: 'error', text: t('docs.err_size') });
      setSelectedFile(null);
      return;
    }

    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.tif', '.docx', '.xlsx'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setNotification({
        type: 'error',
        text: t('docs.err_format')
      });
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setNotification({ type: 'error', text: t('docs.err_select') });
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
        text: t('docs.success_upload')
      });
      
      setSelectedFile(null);
      setDescription('');
      setTags('');
      setProjectId('');

      setTimeout(() => {
        navigate('/documents');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setNotification({
        type: 'error',
        text: err.response?.data?.detail || t('docs.failed_upload')
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {!hideHeader && (
        <div className="pb-4 border-b border-primary/10">
          <h1 className="text-xl font-bold tracking-tight text-primary sm:text-2xl font-outfit">{t('docs.upload_title')}</h1>
          <p className="text-xs text-text-muted">
            {language === 'hi' 
              ? 'एआई मेटाडेटा निष्कर्षण को ट्रिगर करने के लिए अनुबंध पत्र, निरीक्षण रिपोर्ट या कार्य आदेश अपलोड करें।' 
              : 'Upload contract papers, inspection reports, or work orders to trigger AI metadata extraction.'}
          </p>
        </div>
      )}

      {notification && (
        <div className={`flex items-center space-x-2 rounded-lg border p-4 text-xs ${
          notification.type === 'error' ? 'bg-danger-bg border-danger/20 text-danger' : 'bg-primary-bg2 border-primary/20 text-primary'
        }`}>
          {notification.type === 'error' ? <AlertCircle className="h-5 w-5 text-danger" /> : <CheckCircle className="h-5 w-5 text-primary" />}
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
            className={`flex h-96 flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 ${
              isDragActive 
                ? 'border-primary bg-primary-bg-2 scale-[0.99]' 
                : 'border-primary/35 bg-primary-bg hover:border-primary hover:bg-primary-bg-2'
            }`}
          >
            <input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf, .jpg, .jpeg, .png, .tiff, .tif, .docx, .xlsx"
            />
            
            <div className="flex flex-col items-center justify-center text-center p-6 select-none">
              <div 
                className="rounded-full p-4 shadow-inner mb-4"
                style={{ backgroundColor: '#ffffff', border: '1px solid rgba(26,92,56,0.15)' }}
              >
                <UploadCloud className="h-10 w-10 text-primary animate-pulse" />
              </div>
              
              {selectedFile ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-text-body flex items-center justify-center">
                    <FileText className="mr-1.5 h-4 w-4 text-text-muted" />
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {t('common.size')}: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-xs font-semibold text-danger hover:underline cursor-pointer"
                  >
                    {t('docs.remove_file')}
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold text-text-body">
                    {language === 'hi' ? 'फ़ाइल यहाँ खींचें और छोड़ें, या ' : 'Drag and drop file here, or '}
                    <label htmlFor="file-upload" className="cursor-pointer text-primary hover:underline font-bold">
                      {language === 'hi' ? 'कंप्यूटर ब्राउज़ करें' : 'browse computer'}
                    </label>
                  </p>
                  <p className="mt-2 text-xs text-text-muted">
                    {t('docs.accepted_formats')}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Metadata Sidebar Form */}
        <div className="rounded-xl border border-primary/15 bg-surface p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-primary border-b border-primary/10 pb-3 uppercase tracking-wider font-outfit">
            {language === 'hi' ? 'दस्तावेज़ मेटाडेटा' : 'Document Metadata'}
          </h3>
          <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
            
            {/* Doc Type */}
            <Select
              label={t('docs.doc_type')}
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              {docTypes.map(t => (
                <option key={t} value={t}>{getTranslatedDocType(t)}</option>
              ))}
            </Select>

            {/* Department */}
            <Select
              label={t('common.department')}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              {departments.map(d => (
                <option key={d} value={d}>{getTranslatedDept(d)}</option>
              ))}
            </Select>

            {/* Project ID */}
            <Input
              label={language === 'hi' ? 'परियोजना आईडी (वैकल्पिक)' : 'Project ID (Optional)'}
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="e.g. JBO-RNC-09"
            />

            {/* Description */}
            <div className="w-full flex flex-col items-start">
              <label className="text-[13px] font-medium text-primary mb-1 select-none">{t('docs.description')}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-surface border border-primary/25 rounded-lg py-[0.6rem] px-[0.9rem] text-[13px] text-text-body placeholder-text-hint focus:outline-none focus:border-2 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-150"
                placeholder={t('docs.desc_placeholder')}
              />
            </div>

            {/* Tags */}
            <Input
              label={language === 'hi' ? 'खोज टैग (अल्पविराम से अलग)' : 'Search Tags (Comma separated)'}
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="transformer, tender, agreement"
            />

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={uploading || !selectedFile}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('docs.uploading_btn')}
                  </>
                ) : (
                  t('docs.process_btn')
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
