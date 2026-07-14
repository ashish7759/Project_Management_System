import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Upload, FileText } from 'lucide-react';
import DocumentList from './DocumentList';
import DocumentUpload from './DocumentUpload';

const DocumentManagement: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const activeTab = searchParams.get('tab') || 'view';

  useEffect(() => {
    if (user?.role === 'Viewer' && activeTab === 'upload') {
      setSearchParams({ tab: 'view' });
    }
  }, [user, activeTab, setSearchParams]);

  const handleTabChange = (tab: 'view' | 'upload') => {
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-6">
      {/* Unified Page Header */}
      <div className="pb-4 border-b border-primary/10">
        <h1 className="text-xl font-bold tracking-tight text-primary sm:text-2xl font-outfit">
          {t('nav.document_management')}
        </h1>
        <p className="text-xs text-text-muted mt-1">
          {activeTab === 'upload'
            ? (language === 'hi' 
                ? 'एआई मेटाडेटा निष्कर्षण को ट्रिगर करने के लिए अनुबंध पत्र, निरीक्षण रिपोर्ट या कार्य आदेश अपलोड करें।' 
                : 'Upload contract papers, inspection reports, or work orders to trigger AI metadata extraction.')
            : (language === 'hi' 
                ? 'OCR पाठ निष्कर्षण पाइपलाइनों को ट्रैक करें और परियोजना चालान मेटाडेटा सत्यापित करें।' 
                : 'Track OCR text extraction pipelines and verify project invoice metadata.')
          }
        </p>
      </div>

      {/* Tab Selector Container */}
      {user?.role !== 'Viewer' && (
        <div className="bg-primary-bg-2 p-1 rounded-xl border border-primary/10 flex items-center space-x-1 w-fit select-none shadow-sm">
          <button
            onClick={() => handleTabChange('view')}
            className={`px-6 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center space-x-2 cursor-pointer ${
              activeTab === 'view'
                ? 'bg-primary text-white shadow-sm font-bold active-glow'
                : 'text-primary-light hover:bg-white/50 hover:text-primary font-medium'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>{t('nav.documents')}</span>
          </button>
          <button
            onClick={() => handleTabChange('upload')}
            className={`px-6 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center space-x-2 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-primary text-white shadow-sm font-bold active-glow'
                : 'text-primary-light hover:bg-white/50 hover:text-primary font-medium'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>{t('nav.upload')}</span>
          </button>
        </div>
      )}

      {/* Dynamic Content Area */}
      <div className="transition-all duration-300">
        {activeTab === 'upload' && user?.role !== 'Viewer' ? (
          <DocumentUpload hideHeader={true} />
        ) : (
          <DocumentList hideHeader={true} />
        )}
      </div>
    </div>
  );
};

export default DocumentManagement;
