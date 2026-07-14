import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { MasterDocument } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Search, 
  Trash2, 
  Eye, 
  Download,
  AlertTriangle,
  List,
  LayoutGrid
} from 'lucide-react';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import ConfidenceBadge from '../components/ui/ConfidenceBadge';

interface DocumentListProps {
  hideHeader?: boolean;
}

const DocumentList: React.FC<DocumentListProps> = ({ hideHeader = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  
  const [documents, setDocuments] = useState<MasterDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'list' or 'grid' (Persisted in localStorage)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    return (localStorage.getItem('documents_view_mode') as 'list' | 'grid') || 'list';
  });

  const handleViewModeChange = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('documents_view_mode', mode);
  };

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [docType, setDocType] = useState('');
  const [ocrStatus, setOcrStatus] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');

  // Alerts
  const [alert, setAlert] = useState<{ type: 'error' | 'success', message: string } | null>(null);

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
      setAlert({ type: 'error', message: language === 'hi' ? 'दस्तावेज़ों को पुनः प्राप्त करने में विफल।' : 'Failed to retrieve uploaded documents.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [search, docType, ocrStatus, verificationStatus]);

  useEffect(() => {
    const handleDatabaseUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const changes = customEvent.detail?.changes || [];
      const hasDocumentChanges = changes.some((c: any) => c.table === 'master_document');
      if (hasDocumentChanges) {
        console.log('[Realtime] Re-fetching document list due to DB updates.');
        fetchDocuments();
      }
    };
    window.addEventListener('database-update', handleDatabaseUpdate);
    return () => window.removeEventListener('database-update', handleDatabaseUpdate);
  }, [search, docType, ocrStatus, verificationStatus]);

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('docs.delete_confirm'))) return;
    try {
      await api.delete(`/documents/${id}`);
      setAlert({ type: 'success', message: t('docs.deleted_success') });
      fetchDocuments();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.detail || t('docs.deleted_failed') });
    }
  };

  const handleDownload = (doc: MasterDocument) => {
    try {
      const pathParts = doc.original_file_path.replace(/\\/g, '/').split('/uploads/');
      if (pathParts.length > 1) {
        const downloadUrl = `http://localhost:8000/uploads/${pathParts[1]}`;
        window.open(downloadUrl, '_blank');
      } else {
        setAlert({ type: 'error', message: language === 'hi' ? 'अमान्य फ़ाइल संदर्भ पथ।' : 'Invalid file reference path.' });
      }
    } catch (e) {
      setAlert({ type: 'error', message: language === 'hi' ? 'डाउनलोड शुरू नहीं किया जा सका।' : 'Could not trigger download.' });
    }
  };

  const getOcrBadgeVariant = (status: string) => {
    switch (status) {
      case 'Completed': return 'completed';
      case 'Processing': return 'inprogress';
      default: return 'delayed';
    }
  };

  const getVerifyBadgeVariant = (status: string) => {
    switch (status) {
      case 'Approved': return 'completed';
      case 'Pending': return 'pending';
      default: return 'delayed';
    }
  };

  const getOcrBadgeText = (status: string) => {
    switch (status) {
      case 'Completed': return t('docs.ocr_complete');
      case 'Processing': return t('docs.processing');
      default: return t('docs.ocr_failed');
    }
  };

  const getVerifyBadgeText = (status: string) => {
    switch (status) {
      case 'Approved': return t('docs.verified');
      case 'Pending': return t('docs.pending');
      default: return t('docs.rejected');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-primary/10 gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-primary sm:text-2xl font-outfit">{t('docs.title')}</h1>
            <p className="text-xs text-text-muted">
              {language === 'hi' 
                ? 'OCR पाठ निष्कर्षण पाइपलाइनों को ट्रैक करें और परियोजना चालान मेटाडेटा सत्यापित करें।' 
                : 'Track OCR text extraction pipelines and verify project invoice metadata.'}
            </p>
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
      )}

      {alert && (
        <div 
          className={`flex items-center justify-between rounded-lg border p-4 text-xs ${
            alert.type === 'error' 
              ? 'bg-danger-bg border-danger/20 text-danger' 
              : 'bg-primary-bg2 border-primary/20 text-primary'
          }`}
        >
          <span>{alert.message}</span>
          <button onClick={() => setAlert(null)} className="font-bold uppercase tracking-wider text-[10px] cursor-pointer">{t('common.close')}</button>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border-default bg-surface-2 p-4 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-primary-light">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-lg border border-primary/20 bg-surface pl-9 pr-3 py-1.5 text-xs text-text-body placeholder-text-hint focus:outline-none focus:border-primary transition duration-150"
            placeholder={t('docs.search_placeholder')}
          />
        </div>

        {/* Format Filter */}
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="rounded-lg border border-primary/20 bg-surface px-3 py-1.5 text-xs text-text-body focus:outline-none focus:border-primary transition duration-150 cursor-pointer"
        >
          <option value="">{t('docs.all_formats')}</option>
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
          className="rounded-lg border border-primary/20 bg-surface px-3 py-1.5 text-xs text-text-body focus:outline-none focus:border-primary transition duration-150 cursor-pointer"
        >
          <option value="">{t('docs.all_ocr')}</option>
          <option value="Processing">{t('docs.processing')}</option>
          <option value="Completed">{t('docs.ocr_complete')}</option>
          <option value="Failed">{t('docs.ocr_failed')}</option>
        </select>

        {/* Verification Status */}
        <select
          value={verificationStatus}
          onChange={(e) => setVerificationStatus(e.target.value)}
          className="rounded-lg border border-primary/20 bg-surface px-3 py-1.5 text-xs text-text-body focus:outline-none focus:border-primary transition duration-150 cursor-pointer"
        >
          <option value="">{t('docs.all_verify')}</option>
          <option value="Pending">{t('docs.pending')}</option>
          <option value="Approved">{t('docs.verified')}</option>
          <option value="Rejected">{t('docs.rejected')}</option>
        </select>

        {/* View Mode Controls in filters toolbar when header is hidden */}
        {hideHeader && (
          <div className="flex items-center space-x-2 sm:ml-auto">
            <div className="bg-primary-bg-2 p-1 rounded-lg border border-primary/10 flex items-center space-x-1">
              <button
                type="button"
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
                type="button"
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
        )}
      </div>

      {/* List Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={32} label={t('common.loading')} />
        </div>
      ) : documents.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-text-hint bg-surface rounded-xl border border-primary/10">
          <AlertTriangle className="h-8 w-8 stroke-1 text-primary-light" />
          <span className="mt-2 text-xs font-medium">{t('common.nodata')}</span>
        </div>
      ) : viewMode === 'list' ? (
        <Table headers={[t('docs.doc_id'), t('docs.file_details'), t('docs.upload_info'), t('docs.ocr_status'), t('docs.confidence'), t('docs.verification'), t('common.actions')]}>
          {documents.map((doc, idx) => (
            <TableRow key={doc.document_id} index={idx}>
              <TableCell className="font-mono font-semibold text-primary-light">
                #{doc.document_id}
              </TableCell>
              <TableCell>
                <div className="font-semibold text-text-body line-clamp-1">{doc.file_name}</div>
                <div className="text-[11px] text-text-muted">{t('docs.doc_type')}: {doc.file_type}</div>
              </TableCell>
              <TableCell>
                <div>{new Date(doc.upload_date).toLocaleDateString()}</div>
                <div className="text-[11px] text-text-muted">{t('docs.uploaded_by')} ID: {doc.uploaded_by || 'N/A'}</div>
              </TableCell>
              <TableCell>
                <Badge variant={getOcrBadgeVariant(doc.ocr_status)}>
                  {getOcrBadgeText(doc.ocr_status)}
                </Badge>
              </TableCell>
              <TableCell>
                <ConfidenceBadge score={doc.overall_confidence} />
              </TableCell>
              <TableCell>
                <Badge variant={getVerifyBadgeVariant(doc.verification_status)}>
                  {getVerifyBadgeText(doc.verification_status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-1.5">
                  {/* Verify / View Details */}
                  <Button
                    variant="icon"
                    onClick={() => navigate(`/documents/${doc.document_id}/verify`)}
                    title={t('docs.verify_title')}
                    disabled={doc.ocr_status === 'Processing'}
                  >
                    <Eye className="h-4.5 w-4.5" />
                  </Button>

                  {/* Download Original File */}
                  <Button
                    variant="icon"
                    onClick={() => handleDownload(doc)}
                    title={t('common.download')}
                  >
                    <Download className="h-4.5 w-4.5" />
                  </Button>

                  {/* Delete Button (Restricted) */}
                  {(user?.role === 'Admin' || user?.role === 'Manager') && (
                    <Button
                      variant="icon"
                      onClick={() => handleDelete(doc.document_id)}
                      className="text-danger hover:bg-danger-bg hover:text-danger"
                      title={t('common.delete')}
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      ) : (
        /* Grid (Card) View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <div
              key={doc.document_id}
              className="bg-surface border border-primary/10 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group"
            >
              {/* Card Header */}
              <div className="p-4 border-b border-primary/5 bg-primary-bg-2/30 flex items-center justify-between">
                <span className="font-mono text-xs font-bold bg-primary-bg-2 text-primary px-2.5 py-1 rounded border border-primary/10">
                  #{doc.document_id}
                </span>
                <Badge variant={getVerifyBadgeVariant(doc.verification_status)}>
                  {getVerifyBadgeText(doc.verification_status)}
                </Badge>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 space-y-4">
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-text-body leading-snug group-hover:text-primary transition-colors duration-200 line-clamp-2" title={doc.file_name}>
                    {doc.file_name}
                  </h3>
                  <div className="text-[11px] text-text-muted">
                    {t('docs.doc_type')}: <span className="font-medium text-text-body">{doc.file_type}</span>
                  </div>
                </div>

                {/* Upload & Date Info */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-text-muted bg-primary-bg/25 p-2.5 rounded-xl border border-primary/5 select-none">
                  <div>
                    <span className="block text-[10px] text-text-hint font-bold uppercase tracking-wider">{t('docs.upload_date')}</span>
                    <span className="font-medium text-text-body">{new Date(doc.upload_date).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-text-hint font-bold uppercase tracking-wider">{t('docs.uploaded_by')}</span>
                    <span className="font-medium text-text-body">ID: {doc.uploaded_by || 'N/A'}</span>
                  </div>
                </div>

                {/* OCR Status and Confidence */}
                <div className="flex items-center justify-between pt-2 border-t border-primary/5">
                  <div>
                    <span className="block text-[10px] text-text-hint font-bold uppercase tracking-wider mb-1">{t('docs.ocr_status')}</span>
                    <Badge variant={getOcrBadgeVariant(doc.ocr_status)}>
                      {getOcrBadgeText(doc.ocr_status)}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-text-hint font-bold uppercase tracking-wider mb-1">{t('docs.confidence')}</span>
                    <ConfidenceBadge score={doc.overall_confidence} />
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3 bg-primary-bg-2/30 border-t border-primary/5 flex items-center justify-end space-x-2">
                {/* Verify / View Details */}
                <Button
                  variant="secondary"
                  className="!py-1.5 !px-3 text-xs flex items-center space-x-1"
                  onClick={() => navigate(`/documents/${doc.document_id}/verify`)}
                  title={t('docs.verify_title')}
                  disabled={doc.ocr_status === 'Processing'}
                >
                  <Eye className="h-4 w-4" />
                  <span>{t('common.view')}</span>
                </Button>

                {/* Download */}
                <Button
                  variant="secondary"
                  className="!py-1.5 !px-3 text-xs flex items-center space-x-1"
                  onClick={() => handleDownload(doc)}
                  title={t('common.download')}
                >
                  <Download className="h-4 w-4" />
                  <span>{t('common.download')}</span>
                </Button>

                {/* Delete (Restricted) */}
                {(user?.role === 'Admin' || user?.role === 'Manager') && (
                  <Button
                    variant="icon"
                    onClick={() => handleDelete(doc.document_id)}
                    className="text-danger hover:bg-danger-bg hover:text-danger border border-transparent hover:border-danger/10 !p-1.5 rounded-lg"
                    title={t('common.delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList;
