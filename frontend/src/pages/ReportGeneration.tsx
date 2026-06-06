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
  AlertTriangle
} from 'lucide-react';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { Table, TableRow, TableCell } from '../components/ui/Table';

const ReportGeneration: React.FC = () => {
  const { t, language } = useLanguage();
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
      desc: language === 'hi' ? 'व्यक्तिगत परियोजना नोड्स के लिए पूर्ण बजट, समयसूची और प्रगति को सूचीबद्ध करता है।' : 'Lists full budget, schedule, and progress for individual project nodes.' 
    },
    { 
      id: 2, 
      name: language === 'hi' ? 'विभाग-वार सारांश' : 'Department-wise Summary', 
      desc: language === 'hi' ? 'प्रत्येक विभाग के लिए गणना, बजट राशि और औसत पूर्णता प्रगति को एकत्रित करता है।' : 'Aggregates counts, budget sums, and average completion progress per department.' 
    },
    { 
      id: 3, 
      name: language === 'hi' ? 'दस्तावेज़ स्थिति रिपोर्ट' : 'Document Status Report', 
      desc: language === 'hi' ? 'फ़ाइलों, फ़ाइल प्रारूपों, अपलोड तिथियों और सत्यापन लॉक का ऑडिट लॉग।' : 'Audit log of files, file formats, upload dates, and verification locks.' 
    },
    { 
      id: 4, 
      name: language === 'hi' ? 'प्रगति सारांश रिपोर्ट' : 'Progress Summary Report', 
      desc: language === 'hi' ? 'अंतर प्रतिशत के साथ नियोजित लक्ष्य मील के पत्थर बनाम वास्तविक प्रगति को उजागर करता है।' : 'Highlights planned target milestones vs actual progress with variance percentages.' 
    },
    { 
      id: 5, 
      name: language === 'hi' ? 'मालिक अपलोड रिपोर्ट' : 'Monthly Upload Report', 
      desc: language === 'hi' ? 'पिछले 6 महीनों में महीने-दर-महीने फ़ाइलों के अपलोड वॉल्यूम का विश्लेषण करता है।' : 'Analyzes files upload volume month-over-month for the last 6 months.' 
    },
    { 
      id: 6, 
      name: language === 'hi' ? 'ठेकेदार रिपोर्ट' : 'Contractor Report', 
      desc: language === 'hi' ? 'ठेकेदारों, असाइन की गई परियोजनाओं, पंजीकरण विवरण और कार्य आदेशों को सूचीबद्ध करता है।' : 'Lists contractors, assigned projects, registration details, and work orders.' 
    },
    { 
      id: 7, 
      name: language === 'hi' ? 'कस्टम रिपोर्ट' : 'Custom Report', 
      desc: language === 'hi' ? 'परियोजना कोड, स्थान, बजट और स्थितियों को दिखाने वाली सामान्य कस्टम सूची।' : 'Generic custom list showing project codes, locations, budgets, and statuses.' 
    }
  ];

  const fetchFiltersData = async () => {
    setLoadingFilters(true);
    try {
      // Pre-fill departments
      setDepartments([
        { department_id: 1, department_name: 'Engineering' },
        { department_id: 2, department_name: 'Finance' },
        { department_id: 3, department_name: 'Operations' },
        { department_id: 4, department_name: 'HR' },
        { department_id: 5, department_name: 'IT' },
        { department_id: 6, department_name: 'Administration' }
      ]);

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

  const getExportUrl = (format: 'pdf' | 'excel') => {
    const queryParts = [`report_type=${reportType}`];
    if (startDate) queryParts.push(`start_date=${startDate}`);
    if (endDate) queryParts.push(`end_date=${endDate}`);
    if (selectedDept) queryParts.push(`department_id=${selectedDept}`);
    if (selectedProject) queryParts.push(`project_id=${selectedProject}`);
    if (selectedStatus) queryParts.push(`status=${selectedStatus}`);

    const token = localStorage.getItem('token');
    if (token) queryParts.push(`token=${token}`); // Append token in case browser authentication is strictly needed

    return `http://localhost:8000/api/v1/reports/export/${format}?${queryParts.join('&')}`;
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    setAlert(null);
    const exportUrl = getExportUrl(format);
    window.open(exportUrl, '_blank');
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

      {/* Main configuration row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Left Column: Report Selectors & Parameters */}
        <div className="rounded-xl border border-primary/15 bg-white p-5 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-bold text-primary border-b border-primary/10 pb-2 mb-3 font-outfit">1. Select Report Type</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {reportTypes.map(t => (
                <button
                  key={t.id}
                  onClick={() => setReportType(t.id)}
                  className={`w-full text-left rounded-lg p-3 border transition-all text-xs cursor-pointer ${
                    reportType === t.id
                      ? 'border-primary bg-primary-bg-2 text-primary font-semibold shadow-sm'
                      : 'border-primary/10 hover:bg-primary-bg text-text-muted'
                  }`}
                >
                  <div className="font-outfit">{t.name}</div>
                  <p className={`text-[10px] mt-1 leading-relaxed ${reportType === t.id ? 'text-primary-light' : 'text-text-hint'}`}>
                    {t.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-primary border-b border-primary/10 pb-2 mb-3 font-outfit">2. Applied Filters</h3>
            
            {loadingFilters ? (
              <div className="flex justify-center p-4">
                <Spinner size={24} label="Loading filters..." />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Date range start */}
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">{t('reports.from_date')}</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white border border-primary/25 rounded-lg px-3 py-1.5 text-xs text-text-body focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition duration-150"
                  />
                </div>

                {/* Date range end */}
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">{t('reports.to_date')}</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white border border-primary/25 rounded-lg px-3 py-1.5 text-xs text-text-body focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition duration-150"
                  />
                </div>

                {/* Department Filter */}
                {reportType !== 2 && (
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">{t('common.department')}</label>
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="w-full bg-white border border-primary/25 rounded-lg px-3 py-1.5 text-xs text-text-body focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition duration-150 cursor-pointer"
                    >
                      <option value="">{t('projects.all_depts')}</option>
                      {departments.map(d => (
                        <option key={d.department_id} value={d.department_id}>{t('dept.' + d.department_name.toLowerCase())}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Project Filter */}
                {[1, 4, 6].includes(reportType) && (
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">{t('reports.project_ref')}</label>
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="w-full bg-white border border-primary/25 rounded-lg px-3 py-1.5 text-xs text-text-body focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition duration-150 cursor-pointer"
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
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">{t('common.status')}</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full bg-white border border-primary/25 rounded-lg px-3 py-1.5 text-xs text-text-body focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition duration-150 cursor-pointer"
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

                <Button
                  variant="primary"
                  onClick={handleGeneratePreview}
                  disabled={loadingPreview}
                  className="w-full justify-center text-xs font-semibold py-2 mt-4"
                >
                  {loadingPreview ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      {t('reports.loading_preview')}
                    </>
                  ) : (
                    <>
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      {t('reports.generate_preview')}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Preview Grid */}
        <div className="lg:col-span-2 rounded-xl border border-primary/15 bg-white p-5 shadow-sm flex flex-col h-[650px]">
          <div className="flex items-center justify-between border-b border-primary/10 pb-3 mb-4 shrink-0 font-outfit">
            <h3 className="text-sm font-bold text-primary flex items-center">
              <FileText className="mr-1.5 h-4 w-4 text-primary-light" />
              {t('reports.preview_table')}: {previewTitle || (language === 'hi' ? 'पूर्वावलोकन चलाएं' : 'Run Preview')}
            </h3>
            
            {previewRows.length > 0 && (
              <div className="flex space-x-2">
                <Button
                  variant="accent"
                  onClick={() => handleExport('pdf')}
                  className="!py-1 !px-2.5 text-xs font-semibold"
                >
                  <Download className="h-3.5 w-3.5" />
                  PDF
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleExport('excel')}
                  className="!py-1 !px-2.5 text-xs font-semibold"
                >
                  <Download className="h-3.5 w-3.5" />
                  Excel
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto rounded-lg">
            {loadingPreview ? (
              <div className="flex h-full items-center justify-center">
                <Spinner size={32} label={t('reports.loading_preview')} />
              </div>
            ) : previewRows.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-6 text-text-hint bg-primary-bg rounded-lg border border-primary/10">
                <FilePieChart className="h-16 w-16 stroke-1 text-primary-light" />
                <p className="mt-4 font-semibold text-primary font-outfit">{t('reports.no_preview')}</p>
                <p className="mt-1 text-xs text-text-muted">{t('reports.no_preview_help')}</p>
              </div>
            ) : (
              <Table headers={previewHeaders}>
                {previewRows.map((row, rowIdx) => (
                  <TableRow key={rowIdx} index={rowIdx}>
                    {previewKeys.map((key, colIdx) => {
                      const val = row[key];
                      const displayVal = typeof val === 'number' 
                        ? val.toLocaleString() 
                        : val === null || val === undefined 
                          ? 'N/A' 
                          : String(val);
                      return (
                        <TableCell key={colIdx}>
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
    </div>
  );
};

export default ReportGeneration;
