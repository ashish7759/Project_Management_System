import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Project, Department } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Folder, 
  Search, 
  ArrowRight, 
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  
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
      let filtered = res.data;
      if (search) {
        filtered = filtered.filter((p: Project) => 
          p.project_name.toLowerCase().includes(search.toLowerCase()) ||
          p.project_id.toLowerCase().includes(search.toLowerCase())
        );
      }
      setProjects(filtered);
    } catch (err) {
      setErrorMsg(t('projects.failed_load'));
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Completed': return 'completed';
      case 'In Progress': return 'inprogress';
      case 'Pending': return 'pending';
      default: return 'delayed';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-primary/10">
        <h1 className="text-xl font-bold tracking-tight text-primary sm:text-2xl font-outfit">{t('projects.title')}</h1>
        <p className="text-xs text-text-muted">{t('projects.overview_subtitle')}</p>
      </div>

      {errorMsg && (
        <div className="flex items-center space-x-2 rounded-lg border border-danger/25 bg-danger-bg p-4 text-xs text-danger">
          <AlertTriangle className="h-5 w-5 shrink-0 text-danger" />
          <span>{errorMsg}</span>
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
            placeholder={t('projects.search_placeholder')}
          />
        </div>

        {/* Department Filter */}
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="rounded-lg border border-primary/20 bg-white px-3 py-1.5 text-xs text-text-body focus:outline-none focus:border-primary transition duration-150 cursor-pointer"
        >
          <option value="">{t('projects.all_depts')}</option>
          {departments.map(d => (
            <option key={d.department_id} value={d.department_id}>{t('dept.' + d.department_name.toLowerCase())}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-lg border border-primary/20 bg-white px-3 py-1.5 text-xs text-text-body focus:outline-none focus:border-primary transition duration-150 cursor-pointer"
        >
          <option value="">{t('projects.all_statuses')}</option>
          <option value="Pending">{t('projects.status.pending')}</option>
          <option value="In Progress">{t('projects.status.inprogress')}</option>
          <option value="Completed">{t('projects.status.completed')}</option>
          <option value="Delayed">{t('projects.status.delayed')}</option>
        </select>

        {/* Start date range */}
        <div className="flex items-center space-x-2">
          <label className="text-[10px] font-bold text-text-muted uppercase">{t('projects.from')}</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-primary/20 bg-white px-2 py-1 text-xs text-text-body focus:outline-none focus:border-primary transition duration-150 cursor-pointer"
          />
        </div>

        {/* End date range */}
        <div className="flex items-center space-x-2">
          <label className="text-[10px] font-bold text-text-muted uppercase">{t('projects.to')}</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-primary/20 bg-white px-2 py-1 text-xs text-text-body focus:outline-none focus:border-primary transition duration-150 cursor-pointer"
          />
        </div>
      </div>

      {/* Projects Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={32} label={t('projects.loading')} />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-text-hint bg-white rounded-xl border border-primary/10">
          <Folder className="h-8 w-8 stroke-1 text-text-hint" />
          <span className="mt-2 text-xs font-medium">{t('projects.no_projects')}</span>
        </div>
      ) : (
        <Table headers={[t('projects.project_id'), t('projects.name_dept'), t('projects.location'), t('projects.budget'), t('projects.completion'), t('common.status'), t('common.actions')]}>
          {projects.map((p, idx) => (
            <TableRow key={p.project_id} index={idx}>
              <TableCell className="font-mono font-semibold text-primary-light">
                {p.project_id}
              </TableCell>
              <TableCell>
                <div className="font-semibold text-text-body line-clamp-1">{p.project_name}</div>
                <div className="text-[11px] text-text-muted">{p.department?.department_name ? t('dept.' + p.department.department_name.toLowerCase()) : 'General'}</div>
              </TableCell>
              <TableCell>
                <div>{p.location || 'N/A'}</div>
                <div className="text-[11px] text-text-muted">{p.district || 'Jharkhand'}</div>
              </TableCell>
              <TableCell className="font-medium text-text-body">
                ₹{p.budget_amount ? p.budget_amount.toLocaleString('en-IN') : '0.00'}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-primary/10 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        p.status === 'Completed'
                          ? 'bg-primary'
                          : p.status === 'Delayed'
                            ? 'bg-danger'
                            : 'bg-primary-light'
                      }`}
                      style={{ width: `${p.actual_progress}%` }}
                    ></div>
                  </div>
                  <span className="text-[11px] font-semibold text-text-body">{p.actual_progress}%</span>
                </div>
                <div className="text-[9px] text-text-muted">{t('projects.planned_target')}: {p.planned_progress}%</div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(p.status)}>
                  {p.status === 'Completed' ? t('projects.status.completed') : 
                   p.status === 'In Progress' ? t('projects.status.inprogress') :
                   p.status === 'Pending' ? t('projects.status.pending') :
                   t('projects.status.delayed')}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="icon"
                  onClick={() => navigate(`/projects/${p.project_id}`)}
                  title={t('projects.view_details')}
                >
                  <ArrowRight className="h-4.5 w-4.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}
    </div>
  );
};

export default ProjectList;
