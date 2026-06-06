import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
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

const COLORS = ['#1a5c38', '#2e7d52', '#c9a84c', '#5a8cbd', '#b91c1c'];

const Dashboard: React.FC = () => {
  const { t, language } = useLanguage();
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
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const getTranslatedDept = (deptName: string) => {
    const key = `dept.${deptName.toLowerCase()}`;
    const trans = t(key);
    return trans === key ? deptName : trans;
  };

  const renderActivityText = (act: Activity) => {
    if (language === 'hi') {
      return (
        <>
          <span className="font-semibold text-primary">{act.username}</span> ने{' '}
          <span className="font-medium text-primary-light">{act.module}</span> में{' '}
          <span className="font-semibold" style={{ color: '#c9a84c' }}>{act.action_type}</span> किया
        </>
      );
    }
    return (
      <>
        <span className="font-semibold text-primary">{act.username}</span> performed{' '}
        <span className="font-semibold" style={{ color: '#c9a84c' }}>{act.action_type}</span>{' '}
        in <span className="font-medium text-primary-light">{act.module}</span>
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <span className="text-sm font-semibold text-primary">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  // Pre-translate chart labels
  const barChartData = charts?.bar_chart.map(item => ({
    ...item,
    department: getTranslatedDept(item.department)
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header and Refresh */}
      <div className="flex items-center justify-between pb-4 border-b border-primary/10">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-primary sm:text-2xl font-outfit">{t('dashboard.title')}</h1>
          <p className="text-xs text-text-muted">{t('app.tagline')}</p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={isRefreshing}
          className="inline-flex items-center rounded-lg border border-primary/20 bg-white px-3.5 py-2 text-xs font-semibold text-primary hover:bg-[#f0f7f3] transition shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? t('common.loading') : (language === 'hi' ? 'ताज़ा करें' : 'Refresh')}
        </button>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {/* Card 1: Total Uploads */}
          <div 
            className="bg-white rounded-[10px] p-5 shadow-sm border border-primary/15"
            style={{ borderTop: '3px solid #c9a84c' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-text-muted uppercase tracking-wider">{t('dashboard.total_documents')}</p>
                <h3 className="mt-1 text-[28px] font-semibold text-primary">{kpis.total_documents}</h3>
              </div>
              <div className="rounded-lg p-2 bg-[#eaf4ee] text-[#1a5c38]">
                <FileText className="h-5.5 w-5.5" />
              </div>
            </div>
          </div>

          {/* Card 2: Active Projects */}
          <div 
            className="bg-white rounded-[10px] p-5 shadow-sm border border-primary/15"
            style={{ borderTop: '3px solid #c9a84c' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-text-muted uppercase tracking-wider">{t('dashboard.active_projects')}</p>
                <h3 className="mt-1 text-[28px] font-semibold text-primary">{kpis.active_projects}</h3>
              </div>
              <div className="rounded-lg p-2 bg-[#eaf4ee] text-[#1a5c38]">
                <FolderKanban className="h-5.5 w-5.5" />
              </div>
            </div>
          </div>

          {/* Card 3: Completed Projects */}
          <div 
            className="bg-white rounded-[10px] p-5 shadow-sm border border-primary/15"
            style={{ borderTop: '3px solid #c9a84c' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-text-muted uppercase tracking-wider">{t('dashboard.completed_projects')}</p>
                <h3 className="mt-1 text-[28px] font-semibold text-primary">{kpis.completed_projects}</h3>
              </div>
              <div className="rounded-lg p-2 bg-[#eaf4ee] text-[#1a5c38]">
                <CheckCircle className="h-5.5 w-5.5" />
              </div>
            </div>
          </div>

          {/* Card 4: Pending Projects */}
          <div 
            className="bg-white rounded-[10px] p-5 shadow-sm border border-primary/15"
            style={{ borderTop: '3px solid #c9a84c' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-text-muted uppercase tracking-wider">{t('dashboard.pending_tasks')}</p>
                <h3 className="mt-1 text-[28px] font-semibold text-primary">{kpis.pending_tasks}</h3>
              </div>
              <div className="rounded-lg p-2 bg-[#eaf4ee] text-[#1a5c38]">
                <AlertCircle className="h-5.5 w-5.5" />
              </div>
            </div>
          </div>

          {/* Card 5: Pending Verify */}
          <div 
            className="bg-white rounded-[10px] p-5 shadow-sm border border-primary/15"
            style={{ borderTop: '3px solid #c9a84c' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-text-muted uppercase tracking-wider">{t('dashboard.pending_verify')}</p>
                <h3 className="mt-1 text-[28px] font-semibold text-primary">{kpis.pending_verification}</h3>
              </div>
              <div className="rounded-lg p-2 bg-[#eaf4ee] text-[#1a5c38]">
                <FileWarning className="h-5.5 w-5.5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      {charts && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Bar Chart: Progress by Dept */}
          <div 
            className="bg-white rounded-[10px] p-5 shadow-sm border border-primary/15 lg:col-span-2"
            style={{ borderTop: '3px solid #1a5c38' }}
          >
            <h3 className="text-[13px] font-bold text-primary uppercase tracking-wide font-outfit">
              {language === 'hi' ? 'विभाग अनुसार औसत परियोजना प्रगति (%)' : 'Average Project Progress by Department (%)'}
            </h3>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid stroke="rgba(26,92,56,0.08)" vertical={false} />
                  <XAxis dataKey="department" tick={{ fill: '#666666', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#666666', fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#1a5c38', borderRadius: '8px' }} 
                    cursor={{ fill: 'rgba(26,92,56,0.03)' }} 
                  />
                  <Bar dataKey="progress" fill="#1a5c38" radius={[4, 4, 0, 0]} barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart: Document types */}
          <div 
            className="bg-white rounded-[10px] p-5 shadow-sm border border-primary/15"
            style={{ borderTop: '3px solid #1a5c38' }}
          >
            <h3 className="text-[13px] font-bold text-primary uppercase tracking-wide font-outfit">
              {language === 'hi' ? 'दस्तावेज़ प्रारूप वितरण' : 'Document Formats Distribution'}
            </h3>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.pie_chart}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {charts.pie_chart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#1a5c38', borderRadius: '8px' }} />
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
          <div 
            className="bg-white rounded-[10px] p-5 shadow-sm border border-primary/15 lg:col-span-2"
            style={{ borderTop: '3px solid #1a5c38' }}
          >
            <h3 className="text-[13px] font-bold text-primary uppercase tracking-wide font-outfit">
              {language === 'hi' ? 'मालिक दस्तावेज़ अपलोड मात्रा (6 महीने का रुझान)' : 'Monthly Document Upload Volume (6 Months Trend)'}
            </h3>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.line_chart}>
                  <CartesianGrid stroke="rgba(26,92,56,0.08)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#666666', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#666666', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#1a5c38', borderRadius: '8px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="uploads" 
                    stroke="#1a5c38" 
                    strokeWidth={2.5} 
                    activeDot={{ r: 6, fill: '#c9a84c', stroke: '#1a5c38' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Feed */}
          <div 
            className="flex flex-col bg-white rounded-[10px] p-5 shadow-sm border border-primary/15"
          >
            <h3 className="text-[13px] font-bold text-primary uppercase tracking-wide border-b border-primary/8 pb-2 font-outfit">
              {language === 'hi' ? 'हालिया गतिविधियां' : 'Recent Activities'}
            </h3>
            <div className="mt-4 flex-grow overflow-y-auto space-y-3 pr-1 max-h-80">
              {activities.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-text-hint">
                  <Clock className="h-8 w-8 stroke-1" />
                  <span className="mt-1 text-xs">{language === 'hi' ? 'कोई हालिया कार्रवाई दर्ज नहीं की गई' : 'No recent actions recorded'}</span>
                </div>
              ) : (
                activities.map((act) => (
                  <div key={act.log_id} className="flex items-start space-x-3 text-xs border-b border-[#f0f0f0] pb-2 last:border-0 last:pb-0">
                    <div className="mt-0.5 rounded-full p-1 bg-primary-bg2 text-primary">
                      <Clock className="h-3 w-3" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-[13px] text-text-body">
                        {renderActivityText(act)}
                      </p>
                      <p className="text-[11px] text-text-hint">
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
