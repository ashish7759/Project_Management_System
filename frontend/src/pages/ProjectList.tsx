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
  Calendar,
  LayoutGrid,
  List,
  MapPin,
  FolderOpen,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Info
} from 'lucide-react';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language, getTranslatedDept } = useLanguage();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // View Mode: 'list' or 'grid' (Persisted in localStorage)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    return (localStorage.getItem('projects_view_mode') as 'list' | 'grid') || 'list';
  });

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
      const res = await api.get('/projects/departments');
      setDepartments(res.data);
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

  useEffect(() => {
    const handleDatabaseUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const changes = customEvent.detail?.changes || [];
      
      const hasProjectChanges = changes.some(
        (c: any) => c.table === 'project' || c.table === 'milestone' || c.table === 'location'
      );
      if (hasProjectChanges) {
        console.log('[Realtime] Re-fetching project list due to DB updates.');
        fetchProjects();
      }

      const hasDepartmentChanges = changes.some(
        (c: any) => c.table === 'department'
      );
      if (hasDepartmentChanges) {
        console.log('[Realtime] Re-fetching department list due to DB updates.');
        fetchDepartments();
      }
    };
    window.addEventListener('database-update', handleDatabaseUpdate);
    return () => window.removeEventListener('database-update', handleDatabaseUpdate);
  }, [search, selectedDept, selectedStatus, startDate, endDate]);

  const handleViewModeChange = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('projects_view_mode', mode);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedDept('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = search || selectedDept || selectedStatus || startDate || endDate;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Completed': return 'completed';
      case 'In Progress': return 'inprogress';
      case 'Pending': return 'pending';
      default: return 'delayed';
    }
  };

  // Compute live statistics for current selection
  const totalCount = projects.length;
  const inProgressCount = projects.filter(p => p.status === 'In Progress').length;
  const completedCount = projects.filter(p => p.status === 'Completed').length;
  const delayedCount = projects.filter(p => p.status === 'Delayed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-primary/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-primary sm:text-2xl font-outfit">{t('projects.title')}</h1>
          <p className="text-xs text-text-muted">{t('projects.overview_subtitle')}</p>
        </div>

        {/* View Mode & Reset Controls */}
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

      {errorMsg && (
        <div className="flex items-center space-x-2 rounded-lg border border-danger/25 bg-danger-bg p-4 text-xs text-danger">
          <AlertTriangle className="h-5 w-5 shrink-0 text-danger" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div className="bg-white border border-primary/10 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              {language === 'hi' ? 'कुल परियोजनाएं' : 'Total Projects'}
            </span>
            <span className="text-2xl font-extrabold text-primary font-outfit block tracking-tight group-hover:scale-105 transition-transform duration-200">
              {totalCount}
            </span>
          </div>
          <div className="p-3 bg-primary-bg-2 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-all duration-300">
            <FolderOpen className="h-5 w-5" />
          </div>
        </div>

        {/* Card 2: Active */}
        <div className="bg-white border border-primary/10 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              {language === 'hi' ? 'सक्रिय (प्रगति में)' : 'Active (In Progress)'}
            </span>
            <span className="text-2xl font-extrabold text-accent-dark font-outfit block tracking-tight group-hover:scale-105 transition-transform duration-200">
              {inProgressCount}
            </span>
          </div>
          <div className="p-3 bg-accent-light text-accent-dark rounded-xl group-hover:bg-accent group-hover:text-white transition-all duration-300">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* Card 3: Completed */}
        <div className="bg-white border border-primary/10 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              {language === 'hi' ? 'सफलतापूर्वक पूर्ण' : 'Completed'}
            </span>
            <span className="text-2xl font-extrabold text-primary font-outfit block tracking-tight group-hover:scale-105 transition-transform duration-200">
              {completedCount}
            </span>
          </div>
          <div className="p-3 bg-primary-bg-2 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-all duration-300">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        {/* Card 4: Delayed */}
        <div className="bg-white border border-primary/10 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              {language === 'hi' ? 'विलंबित' : 'Delayed'}
            </span>
            <span className="text-2xl font-extrabold text-danger font-outfit block tracking-tight group-hover:scale-105 transition-transform duration-200">
              {delayedCount}
            </span>
          </div>
          <div className="p-3 bg-danger-bg text-danger rounded-xl group-hover:bg-danger group-hover:text-white transition-all duration-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-primary/10 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-hint">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full rounded-lg border border-primary/20 bg-white pl-9 pr-3 py-[0.55rem] text-[13px] text-text-body placeholder-text-hint focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition duration-150"
              placeholder={t('projects.search_placeholder')}
            />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="rounded-lg border border-primary/20 bg-white px-3 py-[0.55rem] text-[13px] text-text-body focus:outline-none focus:border-primary transition duration-150 cursor-pointer w-48 appearance-none pr-8 font-medium"
              style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%23666666\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25em 1.25em', backgroundRepeat: 'no-repeat' }}
            >
              <option value="">{t('projects.all_depts')}</option>
              {departments.map(d => (
                <option key={d.department_id} value={d.department_id}>{getTranslatedDept(d.department_name)}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-primary/20 bg-white px-3 py-[0.55rem] text-[13px] text-text-body focus:outline-none focus:border-primary transition duration-150 cursor-pointer w-44 appearance-none pr-8 font-medium"
              style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%23666666\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25em 1.25em', backgroundRepeat: 'no-repeat' }}
            >
              <option value="">{t('projects.all_statuses')}</option>
              <option value="Pending">{t('projects.status.pending')}</option>
              <option value="In Progress">{t('projects.status.inprogress')}</option>
              <option value="Completed">{t('projects.status.completed')}</option>
              <option value="Delayed">{t('projects.status.delayed')}</option>
            </select>
          </div>

          {/* Date range wrapper */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-primary-bg p-1.5 rounded-lg border border-primary/5">
              <label className="text-[10px] font-bold text-text-muted uppercase px-1">{t('projects.from')}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white rounded border border-primary/10 px-2 py-0.5 text-xs text-text-body focus:outline-none focus:border-primary transition duration-150 cursor-pointer"
              />
            </div>

            <div className="flex items-center space-x-2 bg-primary-bg p-1.5 rounded-lg border border-primary/5">
              <label className="text-[10px] font-bold text-text-muted uppercase px-1">{t('projects.to')}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white rounded border border-primary/10 px-2 py-0.5 text-xs text-text-body focus:outline-none focus:border-primary transition duration-150 cursor-pointer"
              />
            </div>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="secondary"
              onClick={clearFilters}
              className="!py-[0.55rem] !px-3 flex items-center space-x-1.5 text-xs border-dashed"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{language === 'hi' ? 'रीसेट फ़िल्टर' : 'Clear Filters'}</span>
            </Button>
          )}
        </div>

        {/* Live Filter Indicator Bar */}
        {hasActiveFilters && (
          <div className="flex items-center space-x-1.5 bg-primary-bg2/40 px-3 py-2 rounded-lg border border-primary/10 text-xs text-primary font-medium">
            <Filter className="h-3.5 w-3.5" />
            <span>
              {language === 'hi'
                ? `सक्रिय फ़िल्टर: ${projects.length} मिलान परियोजनाएं पाई गईं।`
                : `Active filters: Found ${projects.length} matching project record(s).`}
            </span>
          </div>
        )}
      </div>

      {/* Projects Display Panel */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={32} label={t('projects.loading')} />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-text-hint bg-white rounded-xl border border-primary/10 shadow-sm">
          <Folder className="h-10 w-10 stroke-1 text-primary-light animate-bounce" />
          <span className="mt-2 text-xs font-semibold text-text-muted">
            {hasActiveFilters 
              ? (language === 'hi' ? 'चयनित फ़िल्टर के साथ कोई परियोजना नहीं मिली।' : 'No projects match your filter criteria.')
              : t('projects.no_projects')
            }
          </span>
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="overflow-hidden rounded-xl border border-primary/15 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-primary/10 text-left text-sm">
              <thead className="bg-primary text-[11px] font-bold uppercase tracking-wider text-white select-none">
                <tr>
                  <th className="px-5 py-4 border-r border-white/10">{t('projects.project_id')}</th>
                  <th className="px-5 py-4 border-r border-white/10">{t('projects.name_dept')}</th>
                  <th className="px-5 py-4 border-r border-white/10">{t('projects.location')}</th>
                  <th className="px-5 py-4 border-r border-white/10">{t('projects.budget')}</th>
                  <th className="px-5 py-4 border-r border-white/10">{t('projects.completion')}</th>
                  <th className="px-5 py-4 border-r border-white/10">{t('common.status')}</th>
                  <th className="px-5 py-4 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5 text-text-body">
                {projects.map((p, idx) => {
                  const variance = p.actual_progress - p.planned_progress;
                  const isAhead = variance > 0;
                  const isBehind = variance < 0;
                  const varianceText = variance === 0 
                    ? (language === 'hi' ? 'अनुसूची पर' : 'On Schedule')
                    : isAhead
                      ? `${language === 'hi' ? 'आगे' : 'Ahead'}: +${variance.toFixed(0)}%`
                      : `${language === 'hi' ? 'पीछे' : 'Behind'}: ${variance.toFixed(0)}%`;

                  return (
                    <tr 
                      key={p.project_id}
                      onClick={() => navigate(`/projects/${p.project_id}`)}
                      className={`group hover:bg-primary-bg2 cursor-pointer transition-all duration-200 border-l-4 border-l-transparent hover:border-l-primary ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-primary-bg/30'
                      }`}
                    >
                      {/* Project ID */}
                      <td className="px-5 py-4.5 font-mono font-bold text-primary-light">
                        <span className="bg-primary-bg2/80 px-2.5 py-1 rounded border border-primary/10 group-hover:bg-white transition-colors duration-200">
                          {p.project_id}
                        </span>
                      </td>

                      {/* Project Name & Department */}
                      <td className="px-5 py-4.5">
                        <div className="font-bold text-text-body group-hover:text-primary transition-colors duration-200 text-[13.5px] line-clamp-1">{p.project_name}</div>
                        <div className="text-[11px] text-text-muted mt-1 select-none">
                          <span className="bg-primary/5 text-primary border border-primary/10 rounded px-1.5 py-0.5 font-medium">
                            {getTranslatedDept(p.department?.department_name)}
                          </span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-5 py-4.5">
                        <div className="flex items-center space-x-1.5 text-text-body font-medium">
                          <MapPin className="h-3.5 w-3.5 text-primary-light" />
                          <span>{p.location || 'N/A'}</span>
                        </div>
                        <div className="text-[11px] text-text-muted ml-5 mt-0.5">{p.district || 'Jharkhand'}</div>
                      </td>

                      {/* Budget */}
                      <td className="px-5 py-4.5 font-semibold text-text-body">
                        ₹{p.budget_amount ? p.budget_amount.toLocaleString('en-IN') : '0.00'}
                      </td>

                      {/* Completion Dual Bar */}
                      <td className="px-5 py-4.5">
                        <div className="flex items-center space-x-3.5">
                          <div className="relative w-28 bg-primary-bg-2 rounded-full h-2 overflow-hidden border border-primary/5 select-none" title={`Actual: ${p.actual_progress}% | Planned Target: ${p.planned_progress}%`}>
                            {/* Dotted planned marker */}
                            <div 
                              className="absolute top-0 bottom-0 w-[2px] bg-accent-dark/85 z-10 border-l border-dashed border-accent"
                              style={{ left: `${p.planned_progress}%` }}
                            />
                            {/* Actual fill */}
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                p.status === 'Completed' 
                                  ? 'bg-primary' 
                                  : p.status === 'Delayed' 
                                    ? 'bg-danger' 
                                    : 'bg-primary-light'
                              }`}
                              style={{ width: `${p.actual_progress}%` }}
                            />
                          </div>
                          <span className="text-[11.5px] font-bold text-text-body font-mono">{p.actual_progress}%</span>
                        </div>
                        <div className="flex items-center justify-between w-36 mt-1.5 select-none">
                          <span className="text-[9.5px] text-text-muted font-medium">
                            {t('projects.planned_target')}: {p.planned_progress}%
                          </span>
                          <span className={`text-[9.5px] font-bold px-1 rounded ${
                            variance === 0 
                              ? 'text-text-muted bg-primary-bg border border-primary/5' 
                              : isAhead 
                                ? 'text-primary bg-primary-bg2 border border-primary/10' 
                                : 'text-danger bg-danger-bg border border-danger/10'
                          }`}>
                            {varianceText}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4.5">
                        <Badge variant={getStatusBadgeVariant(p.status)}>
                          {p.status === 'Completed' ? t('projects.status.completed') : 
                           p.status === 'In Progress' ? t('projects.status.inprogress') :
                           p.status === 'Pending' ? t('projects.status.pending') :
                           t('projects.status.delayed')}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4.5 text-right">
                        <div className="flex items-center justify-end">
                          <span className="bg-primary/5 text-primary hover:bg-primary hover:text-white p-2 rounded-full transition-all duration-300 transform group-hover:translate-x-1 shadow-sm border border-primary/10">
                            <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid (Card) View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => {
            const variance = p.actual_progress - p.planned_progress;
            const isAhead = variance > 0;
            const isBehind = variance < 0;
            const varianceText = variance === 0 
              ? (language === 'hi' ? 'समय पर' : 'On Schedule')
              : isAhead
                ? `+${variance.toFixed(0)}% ${language === 'hi' ? 'आगे' : 'Ahead'}`
                : `${variance.toFixed(0)}% ${language === 'hi' ? 'पीछे' : 'Behind'}`;

            return (
              <div
                key={p.project_id}
                onClick={() => navigate(`/projects/${p.project_id}`)}
                className="bg-white border border-primary/10 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between group"
              >
                {/* Card Top Branding Header */}
                <div className="p-5 pb-3 border-b border-primary/5 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold bg-primary-bg-2 text-primary px-3 py-1 rounded-md border border-primary/10">
                    {p.project_id}
                  </span>
                  <Badge variant={getStatusBadgeVariant(p.status)}>
                    {p.status === 'Completed' ? t('projects.status.completed') : 
                     p.status === 'In Progress' ? t('projects.status.inprogress') :
                     p.status === 'Pending' ? t('projects.status.pending') :
                     t('projects.status.delayed')}
                  </Badge>
                </div>

                {/* Card Title & Department */}
                <div className="p-5 pt-4 flex-1 space-y-4">
                  <div>
                    <h3 className="text-[14.5px] font-extrabold text-text-body font-outfit leading-snug group-hover:text-primary transition-colors duration-200 line-clamp-2">
                      {p.project_name}
                    </h3>
                    <div className="flex items-center space-x-1.5 mt-2.5">
                      <span className="bg-primary/5 text-primary text-[10.5px] border border-primary/10 rounded-full px-2.5 py-0.5 font-bold uppercase tracking-wider">
                        {getTranslatedDept(p.department?.department_name)}
                      </span>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="flex items-start space-x-2 text-xs text-text-muted bg-primary-bg/40 p-2.5 rounded-xl border border-primary/5 select-none">
                    <MapPin className="h-4 w-4 text-primary-light shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-text-body">{p.location || 'N/A'}</div>
                      <div className="text-[10px] text-text-hint">{p.district || 'Jharkhand'}</div>
                    </div>
                  </div>

                  {/* Budget Allocation Panel */}
                  <div className="flex items-center justify-between bg-primary-bg-2/40 px-3.5 py-2.5 rounded-xl border border-primary/10 select-none">
                    <span className="text-[10.5px] font-bold text-primary-light uppercase tracking-wider block">
                      {language === 'hi' ? 'बजट राशि' : 'Sanctioned Budget'}
                    </span>
                    <span className="text-sm font-extrabold text-primary font-outfit">
                      ₹{p.budget_amount ? p.budget_amount.toLocaleString('en-IN') : '0.00'}
                    </span>
                  </div>

                  {/* Project Progress Dual Visualizer */}
                  <div className="space-y-2 border-t border-primary/5 pt-3">
                    <div className="flex justify-between items-center text-xs select-none">
                      <span className="font-semibold text-text-muted">
                        {language === 'hi' ? 'भौतिक प्रगति' : 'Physical Progress'}
                      </span>
                      <span className="font-mono font-bold text-primary text-[13px]">
                        {p.actual_progress}%
                      </span>
                    </div>

                    <div className="relative w-full bg-primary-bg-2 rounded-full h-2.5 overflow-hidden border border-primary/5 select-none">
                      {/* Dotted Planned indicator */}
                      <div 
                        className="absolute top-0 bottom-0 w-[2px] bg-accent-dark z-10 border-l border-dashed border-accent"
                        style={{ left: `${p.planned_progress}%` }}
                      />
                      {/* Actual Progress */}
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          p.status === 'Completed' 
                            ? 'bg-primary' 
                            : p.status === 'Delayed' 
                              ? 'bg-danger' 
                              : 'bg-primary-light'
                        }`}
                        style={{ width: `${p.actual_progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-text-muted select-none">
                      <span>
                        {t('projects.planned_target')}: <strong className="text-text-body">{p.planned_progress}%</strong>
                      </span>
                      <span className={`font-bold px-1.5 py-0.5 rounded ${
                        variance === 0 
                          ? 'text-text-muted bg-primary-bg border border-primary/5' 
                          : isAhead 
                            ? 'text-primary bg-primary-bg-2 border border-primary/10' 
                            : 'text-danger bg-danger-bg border border-danger/10'
                      }`}>
                        {varianceText}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Link Footer */}
                <div className="px-5 py-3.5 bg-primary-bg-2/40 border-t border-primary/5 flex items-center justify-between group-hover:bg-primary-bg-2 transition-colors duration-300">
                  <span className="text-xs font-bold text-primary flex items-center space-x-1 select-none">
                    <Info className="h-3.5 w-3.5" />
                    <span>{language === 'hi' ? 'परियोजना का विवरण देखें' : 'View Detailed Specs'}</span>
                  </span>
                  <span className="text-primary group-hover:translate-x-1.5 transition-transform duration-300">
                    <ArrowRight className="h-4.5 w-4.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectList;
