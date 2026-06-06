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
  AlertTriangle
} from 'lucide-react';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

const DocumentList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  
  const [documents, setDocuments] = useState<MasterDocument[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="flex items-center justify-between pb-4 border-b border-primary/10">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-primary sm:text-2xl font-outfit">{t('docs.title')}</h1>
          <p className="text-xs text-text-muted">
            {language === 'hi' 
              ? 'OCR पाठ निष्कर्षण पाइपलाइनों को ट्रैक करें और परियोजना चालान मेटाडेटा सत्यापित करें।' 
              : 'Track OCR text extraction pipelines and verify project invoice metadata.'}
          </p>
        </div>
      </div>

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
      <div 
        className="flex flex-wrap items-center gap-4 rounded-lg border p-4 shadow-sm"
        style={{
          backgroundColor: '#f7faf8',
          borderColor: 'rgba(26, 92, 56, 0.12)'
        }}
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-primary-light">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-lg border border-primary/20 bg-white pl-9 pr-3 py-1.5 text-xs text-text-body placeholder-text-hint focus:outline-none focus:border-primary transition duration-150"
            placeholder={t('docs.search_placeholder')}
          />
        </div>

        {/* Format Filter */}
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="rounded-lg border border-primary/20 bg-white px-3 py-1.5 text-xs text-text-body focus:outline-none focus:border-primary transition duration-150 cursor-pointer"
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
          className="rounded-lg border border-primary/20 bg-white px-3 py-1.5 text-xs text-text-body focus:outline-none focus:border-primary transition duration-150 cursor-pointer"
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
          className="rounded-lg border border-primary/20 bg-white px-3 py-1.5 text-xs text-text-body focus:outline-none focus:border-primary transition duration-150 cursor-pointer"
        >
          <option value="">{t('docs.all_verify')}</option>
          <option value="Pending">{t('docs.pending')}</option>
          <option value="Approved">{t('docs.verified')}</option>
          <option value="Rejected">{t('docs.rejected')}</option>
        </select>
      </div>

      {/* List Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={32} label={t('common.loading')} />
        </div>
      ) : documents.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-text-hint bg-white rounded-xl border border-primary/10">
          <AlertTriangle className="h-8 w-8 stroke-1 text-primary-light" />
          <span className="mt-2 text-xs font-medium">{t('common.nodata')}</span>
        </div>
      ) : (
        <Table headers={[t('docs.doc_id'), t('docs.file_details'), t('docs.upload_info'), t('docs.ocr_status'), t('docs.verification'), t('common.actions')]}>
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
      )}
    </div>
  );
};

export default DocumentList;
