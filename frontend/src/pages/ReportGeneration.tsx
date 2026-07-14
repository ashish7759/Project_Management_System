import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Department, Project } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { 
  FilePieChart, 
  FileText, 
  Download, 
  Eye, 
  Loader2, 
  AlertTriangle,
  FolderOpen,
  Calendar,
  Users,
  TrendingUp,
  Sliders
} from 'lucide-react';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { Table, TableRow, TableCell } from '../components/ui/Table';

const ReportGeneration: React.FC = () => {
  const { t, language, getTranslatedDept } = useLanguage();
  const [reportType, setReportType] = useState<number>(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Dropdown lists
  const [departments, setDepartments] = useState<Department[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Preview data
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [previewKeys, setPreviewKeys] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<any[]>([]);

  // States
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [alert, setAlert] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const reportTypes = [
    { 
      id: 1, 
      name: language === 'hi' ? 'परियोजना-वार विस्तृत रिपोर्ट' : 'Project-wise Detail Report', 
      desc: language === 'hi' ? 'व्यक्तिगत परियोजना नोड्स के लिए पूर्ण बजट, समयसूची और प्रगति को सूचीबद्ध करता है।' : 'Lists full budget, schedule, and progress for individual project nodes.',
      icon: FolderOpen
    },
    { 
      id: 2, 
      name: language === 'hi' ? 'विभाग-वार सारांश' : 'Department-wise Summary', 
      desc: language === 'hi' ? 'प्रत्येक विभाग के लिए गणना, बजट राशि और औसत पूर्णता प्रगति को एकत्रित करता है।' : 'Aggregates counts, budget sums, and average completion progress per department.',
      icon: FilePieChart
    },
    { 
      id: 3, 
      name: language === 'hi' ? 'दस्तावेज़ स्थिति रिपोर्ट' : 'Document Status Report', 
      desc: language === 'hi' ? 'फ़ाइलों, फ़ाइल प्रारूपों, अपलोड तिथियों और सत्यापन लॉक का ऑडिट लॉग।' : 'Audit log of files, file formats, upload dates, and verification locks.',
      icon: FileText
    },
    { 
      id: 4, 
      name: language === 'hi' ? 'प्रगति सारांश रिपोर्ट' : 'Progress Summary Report', 
      desc: language === 'hi' ? 'अंतर प्रतिशत के साथ नियोजित लक्ष्य मील के पत्थर बनाम वास्तविक प्रगति को उजागर करता है।' : 'Highlights planned target milestones vs actual progress with variance percentages.',
      icon: TrendingUp
    },
    { 
      id: 5, 
      name: language === 'hi' ? 'मालिक अपलोड रिपोर्ट' : 'Monthly Upload Report', 
      desc: language === 'hi' ? 'पिछले 6 महीनों में महीने-दर-महीने फ़ाइलों के अपलोड वॉल्यूम का विश्लेषण करता है।' : 'Analyzes files upload volume month-over-month for the last 6 months.',
      icon: Calendar
    },
    { 
      id: 6, 
      name: language === 'hi' ? 'ठेकेदार रिपोर्ट' : 'Contractor Report', 
      desc: language === 'hi' ? 'ठेकेदारों, असाइन की गई परियोजनाओं, पंजीकरण विवरण और कार्य आदेशों को सूचीबद्ध करता है।' : 'Lists contractors, assigned projects, registration details, and work orders.',
      icon: Users
    },
    { 
      id: 7, 
      name: language === 'hi' ? 'कस्टम रिपोर्ट' : 'Custom Report', 
      desc: language === 'hi' ? 'परियोजना कोड, स्थान, बजट और स्थितियों को दिखाने वाली सामान्य कस्टम सूची।' : 'Generic custom list showing project codes, locations, budgets, and statuses.',
      icon: Sliders
    }
  ];

  const fetchFiltersData = async () => {
    setLoadingFilters(true);
    try {
      // Fetch departments dynamically
      const deptRes = await api.get('/projects/departments');
      setDepartments(deptRes.data);

      // Fetch projects for filters
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (e) {
      console.warn("Failed to load filters metadata");
    } finally {
      setLoadingFilters(false);
    }
  };

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    const handleDatabaseUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const changes = customEvent.detail?.changes || [];
      const hasDeptChanges = changes.some((c: any) => c.table === 'department');
      if (hasDeptChanges) {
        console.log('[Realtime] Re-fetching department list in ReportGeneration due to DB updates.');
        api.get('/projects/departments')
          .then(res => setDepartments(res.data))
          .catch(err => console.warn(err));
      }
    };
    window.addEventListener('database-update', handleDatabaseUpdate);
    return () => window.removeEventListener('database-update', handleDatabaseUpdate);
  }, []);

  const handleGeneratePreview = async () => {
    setLoadingPreview(true);
    setAlert(null);
    try {
      const params: any = { report_type: reportType };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (selectedDept) params.department_id = selectedDept;
      if (selectedProject) params.project_id = selectedProject;
      if (selectedStatus) params.status = selectedStatus;

      const res = await api.get('/reports/generate', { params });
      const { title, headers, keys, data } = res.data;
      
      setPreviewTitle(title);
      setPreviewHeaders(headers);
      setPreviewKeys(keys);
      setPreviewRows(data);
    } catch (err) {
      setAlert({ type: 'error', text: t('reports.failed_preview') });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    setAlert(null);
    try {
      const params: any = { report_type: reportType };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (selectedDept) params.department_id = selectedDept;
      if (selectedProject) params.project_id = selectedProject;
      if (selectedStatus) params.status = selectedStatus;

      const response = await api.get(`/reports/export/${format}`, {
        params,
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { 
        type: format === 'pdf' 
          ? 'application/pdf' 
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${reportType}_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setAlert({ 
        type: 'error', 
        text: language === 'hi' 
          ? 'रिपोर्ट डाउनलोड करने में विफल। कृपया पुन: प्रयास करें।' 
          : 'Failed to download report. Please try again.' 
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-primary/10">
        <h1 className="text-xl font-bold tracking-tight text-primary sm:text-2xl font-outfit">{t('reports.title_hub')}</h1>
        <p className="text-xs text-text-muted">{t('reports.subtitle')}</p>
      </div>

      {alert && (
        <div className="flex items-center justify-between rounded-lg border p-4 text-xs bg-danger-bg border-danger/25 text-danger animate-fadeIn">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-danger" />
            <span>{alert.text}</span>
          </div>
          <button onClick={() => setAlert(null)} className="font-semibold uppercase tracking-wider text-[10px] cursor-pointer hover:underline">{t('common.dismiss')}</button>
        </div>
      )}

      {/* Configuration Row: Select Report Type & Filters side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Select Report Type */}
        <div className="rounded-2xl border border-primary/12 bg-surface p-6 shadow-sm flex flex-col h-[480px]">
          <h3 className="text-[15px] font-extrabold text-primary border-b border-primary/8 pb-3 mb-4 font-outfit select-none uppercase tracking-wider flex items-center">
            <span className="flex items-center justify-center bg-primary/10 text-primary h-6 w-6 rounded-lg text-xs font-bold mr-2">1</span>
            Select Report Type
          </h3>
          <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
            {reportTypes.map(t => {
              const ReportIcon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setReportType(t.id)}
                  className={`w-full text-left rounded-xl p-3.5 border transition-all duration-300 flex items-start space-x-3.5 cursor-pointer hover:scale-[1.01] hover:shadow-sm ${
                    reportType === t.id
                      ? 'border-primary bg-primary-bg2/40 text-primary font-semibold shadow-sm'
                      : 'border-primary/10 hover:bg-primary-bg text-text-muted hover:text-text-body'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${reportType === t.id ? 'bg-primary text-white' : 'bg-primary-bg text-primary-light border border-primary/10'}`}>
                    <ReportIcon className="h-4.5 w-4.5 shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-outfit text-[13px] tracking-wide">{t.name}</div>
                    <p className={`text-[10.5px] mt-1 leading-relaxed ${reportType === t.id ? 'text-primary/80 font-normal' : 'text-text-hint font-normal'}`}>
                      {t.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card 2: Applied Filters */}
        <div className="rounded-2xl border border-primary/12 bg-surface p-6 shadow-sm flex flex-col h-[480px]">
          <h3 className="text-[15px] font-extrabold text-primary border-b border-primary/8 pb-3 mb-4 font-outfit select-none uppercase tracking-wider flex items-center">
            <span className="flex items-center justify-center bg-primary/10 text-primary h-6 w-6 rounded-lg text-xs font-bold mr-2">2</span>
            Applied Filters
          </h3>
          
          {loadingFilters ? (
            <div className="flex-1 flex items-center justify-center">
              <Spinner size={32} label="Loading filters metadata..." />
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Date range inputs side-by-side */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">{t('reports.from_date')}</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-surface border border-primary/20 rounded-xl px-3 py-2 text-xs text-text-body focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-150 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">{t('reports.to_date')}</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-surface border border-primary/20 rounded-xl px-3 py-2 text-xs text-text-body focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-150 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Filter items grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Department Filter */}
                  {reportType !== 2 && (
                    <div className={![1, 3, 4, 7].includes(reportType) && ![1, 4, 6].includes(reportType) ? "col-span-2" : "col-span-1"}>
                      <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">{t('common.department')}</label>
                      <select
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className="w-full bg-surface border border-primary/20 rounded-xl px-3 py-2 text-xs text-text-body focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-150 cursor-pointer appearance-none pr-8 font-medium"
                        style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%23666666\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25em 1.25em', backgroundRepeat: 'no-repeat' }}
                      >
                        <option value="">{t('projects.all_depts')}</option>
                        {departments.map(d => (
                          <option key={d.department_id} value={d.department_id}>{getTranslatedDept(d.department_name)}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Project Filter */}
                  {[1, 4, 6].includes(reportType) && (
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">{t('reports.project_ref')}</label>
                      <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="w-full bg-surface border border-primary/20 rounded-xl px-3 py-2 text-xs text-text-body focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-150 cursor-pointer appearance-none pr-8 font-medium"
                        style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%23666666\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25em 1.25em', backgroundRepeat: 'no-repeat' }}
                      >
                        <option value="">{t('reports.all_projects')}</option>
                        {projects.map(p => (
                          <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Status Filter */}
                  {[1, 3, 4, 7].includes(reportType) && (
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">{t('common.status')}</label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full bg-surface border border-primary/20 rounded-xl px-3 py-2 text-xs text-text-body focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-150 cursor-pointer appearance-none pr-8 font-medium"
                        style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%23666666\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25em 1.25em', backgroundRepeat: 'no-repeat' }}
                      >
                        <option value="">{t('reports.all_statuses')}</option>
                        {reportType === 3 ? (
                          <>
                            <option value="Pending">{t('docs.pending')}</option>
                            <option value="Approved">{t('docs.verified')}</option>
                            <option value="Rejected">{t('docs.rejected')}</option>
                          </>
                        ) : (
                          <>
                            <option value="Pending">{t('projects.status.pending')}</option>
                            <option value="In Progress">{t('projects.status.inprogress')}</option>
                            <option value="Completed">{t('projects.status.completed')}</option>
                            <option value="Delayed">{t('projects.status.delayed')}</option>
                          </>
                        )}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <Button
                variant="primary"
                onClick={handleGeneratePreview}
                disabled={loadingPreview}
                className="w-full justify-center text-xs font-semibold py-3.5 rounded-xl hover:scale-[1.01] hover:shadow-md transition-all duration-300 mt-6 shrink-0"
              >
                {loadingPreview ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    {t('reports.loading_preview')}
                  </>
                ) : (
                  <>
                    <Eye className="mr-1.5 h-4 w-4" />
                    {t('reports.generate_preview')}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Full-width Preview Card at the bottom */}
      <div className="rounded-2xl border border-primary/12 bg-surface p-6 shadow-sm flex flex-col min-h-[500px]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-primary/8 pb-3.5 mb-4 shrink-0 font-outfit gap-3">
          <h3 className="text-sm font-extrabold text-primary flex items-center select-none uppercase tracking-wider">
            <FileText className="mr-2 h-4.5 w-4.5 text-primary-light" />
            {t('reports.preview_table')}: {previewTitle || (language === 'hi' ? 'पूर्वावलोकन परिणाम' : 'Preview Result')}
          </h3>
          
          {previewRows.length > 0 && (
            <div className="flex space-x-2.5">
              <Button
                variant="accent"
                onClick={() => handleExport('pdf')}
                className="!py-1.5 !px-3.5 text-xs font-bold shadow-sm hover:scale-[1.02] transition-transform duration-200"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                PDF
              </Button>
              <Button
                variant="primary"
                onClick={() => handleExport('excel')}
                className="!py-1.5 !px-3.5 text-xs font-bold shadow-sm hover:scale-[1.02] transition-transform duration-200"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Excel
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto rounded-xl border border-primary/8">
          {loadingPreview ? (
            <div className="flex h-96 items-center justify-center">
              <Spinner size={32} label={t('reports.loading_preview')} />
            </div>
          ) : previewRows.length === 0 ? (
            <div className="flex h-96 flex-col items-center justify-center text-center p-6 text-text-hint bg-primary-bg rounded-xl">
              <FilePieChart className="h-16 w-16 stroke-1 text-primary-light animate-pulse" />
              <p className="mt-4 font-bold text-primary font-outfit text-sm select-none">{t('reports.no_preview')}</p>
              <p className="mt-1 text-xs text-text-muted select-none">{t('reports.no_preview_help')}</p>
            </div>
          ) : (
            <Table headers={previewHeaders}>
              {previewRows.map((row, rowIdx) => (
                <TableRow key={rowIdx} index={rowIdx}>
                  {previewKeys.map((key, colIdx) => {
                    const val = row[key];
                    const displayVal = typeof val === 'number' 
                      ? val.toLocaleString('en-IN') 
                      : val === null || val === undefined 
                        ? 'N/A' 
                        : String(val);
                    return (
                      <TableCell key={colIdx} className="whitespace-nowrap font-medium text-text-body">
                        {displayVal}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportGeneration;
