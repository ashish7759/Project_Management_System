import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Department, Project } from '../types';
import { 
  FilePieChart, 
  FileText, 
  Download, 
  Eye, 
  Loader2, 
  Calendar,
  Filter,
  AlertTriangle
} from 'lucide-react';

const ReportGeneration: React.FC = () => {
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
    { id: 1, name: 'Project-wise Detail Report', desc: 'Lists full budget, schedule, and progress for individual project nodes.' },
    { id: 2, name: 'Department-wise Summary', desc: 'Aggregates counts, budget sums, and average completion progress per department.' },
    { id: 3, name: 'Document Status Report', desc: 'Audit log of files, file formats, upload dates, and verification locks.' },
    { id: 4, name: 'Progress Summary Report', desc: 'Highlights planned target milestones vs actual progress with variance percentages.' },
    { id: 5, name: 'Monthly Upload Report', desc: 'Analyzes files upload volume month-over-month for the last 6 months.' },
    { id: 6, name: 'Contractor Report', desc: 'Lists contractors, assigned projects, registration details, and work orders.' },
    { id: 7, name: 'Custom Report', desc: 'Generic custom list showing project codes, locations, budgets, and statuses.' }
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
      setAlert({ type: 'error', text: 'Failed to generate report preview. Please check filters.' });
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Reports Hub</h1>
        <p className="text-sm text-slate-500">Query office statistics, preview summaries, and download official PDF/Excel reports.</p>
      </div>

      {alert && (
        <div className="flex items-center space-x-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{alert.text}</span>
        </div>
      )}

      {/* Main configuration row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Left Column: Report Selectors & Parameters */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">1. Select Report Type</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {reportTypes.map(t => (
                <button
                  key={t.id}
                  onClick={() => setReportType(t.id)}
                  className={`w-full text-left rounded-lg p-3 border transition-all text-xs ${
                    reportType === t.id
                      ? 'border-primary-500 bg-primary-50/50 text-primary-900 font-semibold'
                      : 'border-slate-150 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div>{t.name}</div>
                  <p className={`text-[10px] mt-1 ${reportType === t.id ? 'text-primary-700' : 'text-slate-400'}`}>
                    {t.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">2. Applied Filters</h3>
            
            {loadingFilters ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Date range start */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                {/* Date range end */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                {/* Department Filter */}
                {reportType !== 2 && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Department</label>
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="">All Departments</option>
                      {departments.map(d => (
                        <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Project Filter */}
                {[1, 4, 6].includes(reportType) && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Project Reference</label>
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="">All Projects</option>
                      {projects.map(p => (
                        <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Status Filter */}
                {[1, 3, 4, 7].includes(reportType) && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="">All Statuses</option>
                      {reportType === 3 ? (
                        <>
                          <option value="Pending">Pending Verification</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </>
                      ) : (
                        <>
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Delayed">Delayed</option>
                        </>
                      )}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGeneratePreview}
                  disabled={loadingPreview}
                  className="flex w-full items-center justify-center rounded-lg bg-primary-500 py-2 text-xs font-semibold text-white shadow hover:bg-primary-600 disabled:opacity-50"
                >
                  {loadingPreview ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Loading Preview...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      Generate Preview
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Preview Grid */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col h-[650px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 shrink-0">
            <h3 className="text-sm font-bold text-slate-900 flex items-center">
              <FileText className="mr-1.5 h-4 w-4 text-slate-500" />
              Preview Table: {previewTitle || 'Run Preview'}
            </h3>
            
            {previewRows.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExport('pdf')}
                  className="inline-flex items-center rounded border border-slate-250 bg-white px-2 py-1 text-xs font-bold text-slate-650 hover:bg-red-50 hover:text-red-700 shadow-sm"
                >
                  <Download className="mr-1 h-3 w-3" />
                  PDF
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="inline-flex items-center rounded bg-emerald-600 px-2 py-1 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
                >
                  <Download className="mr-1 h-3 w-3" />
                  Excel
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto rounded-lg border border-slate-100 bg-slate-50/50">
            {loadingPreview ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : previewRows.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-400">
                <FilePieChart className="h-16 w-16 stroke-1 text-slate-350" />
                <p className="mt-4 font-semibold text-slate-800">No preview records</p>
                <p className="mt-1 text-xs text-slate-500">Configure your parameters and click "Generate Preview" to review rows here before exporting.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs bg-white">
                <thead className="bg-slate-100 font-bold text-slate-600 sticky top-0">
                  <tr>
                    {previewHeaders.map((h, i) => (
                      <th key={i} className="px-4 py-3 border-b border-slate-200">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-700">
                  {previewRows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-slate-50">
                      {previewKeys.map((key, colIdx) => {
                        const val = row[key];
                        const displayVal = typeof val === 'number' 
                          ? val.toLocaleString() 
                          : val === null || val === undefined 
                            ? 'N/A' 
                            : String(val);
                        return (
                          <td key={colIdx} className="px-4 py-2 border-b border-slate-100">
                            {displayVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReportGeneration;
