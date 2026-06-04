import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  FileText, 
  FolderKanban, 
  CheckCircle, 
  AlertCircle, 
  FileWarning, 
  RefreshCw,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface KPI {
  total_documents: number;
  active_projects: number;
  completed_projects: number;
  pending_tasks: number;
  pending_verification: number;
}

interface ChartData {
  bar_chart: any[];
  pie_chart: any[];
  line_chart: any[];
}

interface Activity {
  log_id: number;
  username: string;
  action_type: string;
  module: string;
  timestamp: string;
}

const COLORS = ['#1e3a5f', '#d97706', '#b58900', '#475569', '#0d9488'];

const Dashboard: React.FC = () => {
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get('/dashboard/stats');
      const { kpis, charts, activity_feed } = res.data;
      setKpis(kpis);
      setCharts(charts);
      setActivities(activity_feed);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          <span className="text-sm font-semibold text-slate-500">Loading metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Dashboard</h1>
          <p className="text-sm text-slate-500">Real-time electricity projects progress and document intelligence stats.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={isRefreshing}
          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {/* Card 1 */}
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Uploads</p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900">{kpis.total_documents}</h3>
              </div>
              <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                <FileText className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
          </div>

          {/* Card 2 */}
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Active Projects</p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900">{kpis.active_projects}</h3>
              </div>
              <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
                <FolderKanban className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
          </div>

          {/* Card 3 */}
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Completed Projects</p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900">{kpis.completed_projects}</h3>
              </div>
              <div className="rounded-lg bg-teal-50 p-2.5 text-teal-600">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500"></div>
          </div>

          {/* Card 4 */}
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Pending Projects</p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900">{kpis.pending_tasks}</h3>
              </div>
              <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
          </div>

          {/* Card 5 */}
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Pending Verify</p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900">{kpis.pending_verification}</h3>
              </div>
              <div className="rounded-lg bg-red-50 p-2.5 text-red-600">
                <FileWarning className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500"></div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      {charts && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Bar Chart: Progress by Dept */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <h3 className="text-base font-bold text-slate-900">Average Project Progress by Department (%)</h3>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.bar_chart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="department" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="progress" fill="#1e3a5f" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart: Document types */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">Document Formats Distribution</h3>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.pie_chart}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {charts.pie_chart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Line Chart: Monthly uploads */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <h3 className="text-base font-bold text-slate-900">Monthly Document Upload Volume (6 Months Trend)</h3>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.line_chart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="uploads" 
                    stroke="#1e3a5f" 
                    strokeWidth={2.5} 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">Recent Activities</h3>
            <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1 max-h-80">
              {activities.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-slate-400">
                  <Clock className="h-8 w-8 stroke-1" />
                  <span className="mt-1 text-xs">No recent actions recorded</span>
                </div>
              ) : (
                activities.map((act) => (
                  <div key={act.log_id} className="flex items-start space-x-3 text-xs">
                    <div className="mt-0.5 rounded-full bg-slate-100 p-1.5 text-slate-600">
                      <Clock className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-slate-800">
                        <span className="font-semibold">{act.username}</span> performed{' '}
                        <span className="font-medium text-primary-500">{act.action_type}</span>{' '}
                        in <span className="font-medium">{act.module}</span>
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(act.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
