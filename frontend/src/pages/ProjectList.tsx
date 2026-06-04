import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Project, Department } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  Folder, 
  Search, 
  Filter, 
  Plus, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Loader2,
  Calendar
} from 'lucide-react';

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Alerts
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedDept) params.department_id = selectedDept;
      if (selectedStatus) params.status = selectedStatus;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await api.get('/projects', { params });
      // Filter list client-side by project name/id search
      let filtered = res.data;
      if (search) {
        filtered = filtered.filter((p: Project) => 
          p.project_name.toLowerCase().includes(search.toLowerCase()) ||
          p.project_id.toLowerCase().includes(search.toLowerCase())
        );
      }
      setProjects(filtered);
    } catch (err) {
      setErrorMsg('Failed to load project records.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      setDepartments([
        { department_id: 1, department_name: 'Engineering' },
        { department_id: 2, department_name: 'Finance' },
        { department_id: 3, department_name: 'Operations' },
        { department_id: 4, department_name: 'HR' },
        { department_id: 5, department_name: 'IT' },
        { department_id: 6, department_name: 'Administration' }
      ]);
    } catch (e) {
      console.warn("Failed to load departments list");
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [search, selectedDept, selectedStatus, startDate, endDate]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Delayed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Projects</h1>
          <p className="text-sm text-slate-500">Overview of Jharkhand electricity expansion, grid works, and transformer allocations.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center space-x-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
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
            placeholder="Search by ID or Name..."
          />
        </div>

        {/* Department Filter */}
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
        >
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Delayed">Delayed</option>
        </select>

        {/* Start date range */}
        <div className="flex items-center space-x-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase">From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none"
          />
        </div>

        {/* End date range */}
        <div className="flex items-center space-x-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase">To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none"
          />
        </div>
      </div>

      {/* Projects Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-slate-400">
            <Folder className="h-8 w-8 stroke-1 text-slate-400" />
            <span className="mt-2 text-sm font-medium">No projects matching the filters.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Project ID</th>
                  <th className="px-6 py-4">Project Name / Department</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Budget (INR)</th>
                  <th className="px-6 py-4">Completion Progress</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                {projects.map((p) => (
                  <tr key={p.project_id} className="hover:bg-slate-50/75">
                    <td className="px-6 py-4 font-mono font-semibold text-slate-900">
                      {p.project_id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 line-clamp-1">{p.project_name}</div>
                      <div className="text-xs text-slate-400">{p.department?.department_name || 'General'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{p.location || 'N/A'}</div>
                      <div className="text-xs text-slate-400">{p.district || 'Jharkhand'}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      ₹{p.budget_amount ? p.budget_amount.toLocaleString('en-IN') : '0.00'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              p.status === 'Completed'
                                ? 'bg-green-500'
                                : p.status === 'Delayed'
                                  ? 'bg-red-500'
                                  : 'bg-primary-500'
                            }`}
                            style={{ width: `${p.actual_progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-semibold">{p.actual_progress}%</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Planned target: {p.planned_progress}%</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-bold ${getStatusBadge(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/projects/${p.project_id}`)}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-all"
                        title="View Project Details"
                      >
                        <ArrowRight className="h-4.5 w-4.5" />
                      </button>
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

export default ProjectList;
