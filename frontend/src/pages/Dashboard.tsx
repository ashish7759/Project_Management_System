import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { 
  FileText, 
  FolderKanban, 
  CheckCircle, 
  AlertCircle, 
  FileWarning, 
  RefreshCw,
  Clock,
  Gauge
} from 'lucide-react';
import Toast from '../components/ui/Toast';
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

interface PendingDoc {
  document_id: number;
  file_name: string;
  file_type: string;
  overall_confidence: number | null;
  upload_date: string | null;
}

const Dashboard: React.FC = () => {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [pendingDocs, setPendingDocs] = useState<PendingDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshHover, setIsRefreshHover] = useState(false);
  const [confidenceStats, setConfidenceStats] = useState<{
    average_confidence: number;
    high_count: number;
    low_count: number;
  } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get('/dashboard/stats');
      const { kpis, charts, pending_verifications } = res.data;
      setKpis(kpis);
      setCharts(charts);
      setPendingDocs(pending_verifications || []);

      try {
        const confRes = await api.get('/documents/stats/confidence');
        setConfidenceStats(confRes.data);
      } catch (confErr) {
        console.warn('Failed to load confidence stats, falling back:', confErr);
        setConfidenceStats({ average_confidence: 0, high_count: 0, low_count: 0 });
      }

      // Show success toast on manual refresh only
      if (!loading) {
        setToast({
          message: language === 'hi' ? 'डैशबोर्ड डेटा सफलतापूर्वक ताज़ा किया गया!' : 'Dashboard data refreshed successfully!',
          type: 'success'
        });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setToast({
        message: language === 'hi' ? 'डैशबोर्ड डेटा ताज़ा करने में विफल।' : 'Failed to refresh dashboard data.',
        type: 'error'
      });
      setTimeout(() => setToast(null), 4000);
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

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}></div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  // Pre-translate chart labels
  const barChartData = charts?.bar_chart.map(item => ({
    ...item,
    department: getTranslatedDept(item.department)
  })) || [];

  // Theme colors for charts
  const gridColor = isDark ? 'rgba(46, 125, 82, 0.2)' : 'rgba(26, 92, 56, 0.08)';
  const textColor = isDark ? '#9ab5a0' : '#666666';
  const tooltipBg = isDark ? '#223328' : '#ffffff';
  const tooltipBorder = isDark ? '#2e7d52' : '#1a5c38';
  const primaryFill = isDark ? '#2e7d52' : '#1a5c38';
  const accentStroke = isDark ? '#d4a847' : '#c9a84c';

  const pieColors = isDark 
    ? ['#2e7d52', '#4a9e6e', '#d4a847', '#5a8cbd', '#f87171'] 
    : ['#1a5c38', '#2e7d52', '#c9a84c', '#5a8cbd', '#b91c1c'];

  return (
    <div className="space-y-6">
      {/* Header and Refresh */}
      <div className="flex items-center justify-between pb-4 border-b" style={{ borderBottomColor: 'var(--border-subtle)' }}>
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl font-outfit" style={{ color: 'var(--text-heading)' }}>{t('dashboard.title')}</h1>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{t('app.tagline')}</p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={isRefreshing}
          className="inline-flex items-center rounded-lg text-xs font-semibold transition shadow-sm disabled:opacity-50 cursor-pointer px-3.5 py-2"
          style={{
            background: isRefreshHover ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)'
          }}
          onMouseEnter={() => setIsRefreshHover(true)}
          onMouseLeave={() => setIsRefreshHover(false)}
        >
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? t('common.loading') : (language === 'hi' ? 'ताज़ा करें' : 'Refresh')}
        </button>
      </div>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
          className="animate-fadeIn"
        />
      )}

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {/* Card 1: Total Uploads */}
          <div 
            className="rounded-[10px] p-5 border"
            style={{
              background   : 'var(--bg-surface)',
              border       : '0.5px solid var(--border-default)',
              borderTop    : '3px solid var(--color-accent)',
              boxShadow    : 'var(--shadow-card)',
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }} title={t('dashboard.total_documents')}>
                  {t('dashboard.total_documents')}
                </p>
                <h3 className="mt-1 font-semibold font-outfit" style={{ color: 'var(--text-heading)', fontSize: '28px' }}>{kpis.total_documents}</h3>
              </div>
              <div className="rounded-lg p-2 flex-shrink-0" style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-primary)' }}>
                <FileText className="h-5.5 w-5.5" />
              </div>
            </div>
          </div>

          {/* Card 2: Active Projects */}
          <div 
            className="rounded-[10px] p-5 border"
            style={{
              background   : 'var(--bg-surface)',
              border       : '0.5px solid var(--border-default)',
              borderTop    : '3px solid var(--color-accent)',
              boxShadow    : 'var(--shadow-card)',
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }} title={t('dashboard.active_projects')}>
                  {t('dashboard.active_projects')}
                </p>
                <h3 className="mt-1 font-semibold font-outfit" style={{ color: 'var(--text-heading)', fontSize: '28px' }}>{kpis.active_projects}</h3>
              </div>
              <div className="rounded-lg p-2 flex-shrink-0" style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-primary)' }}>
                <FolderKanban className="h-5.5 w-5.5" />
              </div>
            </div>
          </div>

          {/* Card 3: Completed Projects */}
          <div 
            className="rounded-[10px] p-5 border"
            style={{
              background   : 'var(--bg-surface)',
              border       : '0.5px solid var(--border-default)',
              borderTop    : '3px solid var(--color-accent)',
              boxShadow    : 'var(--shadow-card)',
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }} title={t('dashboard.completed_projects')}>
                  {t('dashboard.completed_projects')}
                </p>
                <h3 className="mt-1 font-semibold font-outfit" style={{ color: 'var(--text-heading)', fontSize: '28px' }}>{kpis.completed_projects}</h3>
              </div>
              <div className="rounded-lg p-2 flex-shrink-0" style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-primary)' }}>
                <CheckCircle className="h-5.5 w-5.5" />
              </div>
            </div>
          </div>

          {/* Card 4: Pending Projects */}
          <div 
            className="rounded-[10px] p-5 border"
            style={{
              background   : 'var(--bg-surface)',
              border       : '0.5px solid var(--border-default)',
              borderTop    : '3px solid var(--color-accent)',
              boxShadow    : 'var(--shadow-card)',
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }} title={t('dashboard.pending_tasks')}>
                  {t('dashboard.pending_tasks')}
                </p>
                <h3 className="mt-1 font-semibold font-outfit" style={{ color: 'var(--text-heading)', fontSize: '28px' }}>{kpis.pending_tasks}</h3>
              </div>
              <div className="rounded-lg p-2 flex-shrink-0" style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-primary)' }}>
                <AlertCircle className="h-5.5 w-5.5" />
              </div>
            </div>
          </div>

          {/* Card 5: Pending Verify */}
          <div 
            className="rounded-[10px] p-5 border"
            style={{
              background   : 'var(--bg-surface)',
              border       : '0.5px solid var(--border-default)',
              borderTop    : '3px solid var(--color-accent)',
              boxShadow    : 'var(--shadow-card)',
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }} title={t('dashboard.pending_verify')}>
                  {t('dashboard.pending_verify')}
                </p>
                <h3 className="mt-1 font-semibold font-outfit" style={{ color: 'var(--text-heading)', fontSize: '28px' }}>{kpis.pending_verification}</h3>
              </div>
              <div className="rounded-lg p-2 flex-shrink-0" style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-primary)' }}>
                <FileWarning className="h-5.5 w-5.5" />
              </div>
            </div>
          </div>

          {/* Card 6: Average OCR Confidence */}
          {confidenceStats && (
            <div 
              className="rounded-[10px] p-5 border"
              style={{
                background   : 'var(--bg-surface)',
                border       : '0.5px solid var(--border-default)',
                borderTop    : '3px solid var(--color-accent)',
                boxShadow    : 'var(--shadow-card)',
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }} title={t('dashboard.avg_ocr_confidence')}>
                    {t('dashboard.avg_ocr_confidence')}
                  </p>
                  <h3 className="mt-1 font-semibold font-outfit" style={{ color: 'var(--text-heading)', fontSize: '28px' }}>
                    {confidenceStats.average_confidence}%
                  </h3>
                </div>
                <div className="rounded-lg p-2 flex-shrink-0" style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-primary)' }}>
                  <Gauge className="h-5.5 w-5.5" />
                </div>
              </div>
              <p className="text-[10px] mt-2 font-medium" style={{ color: 'var(--text-hint)' }}>
                {language === 'hi'
                  ? `उच्च (≥85%): ${confidenceStats.high_count} | कम (<60%): ${confidenceStats.low_count}`
                  : `High (≥85%): ${confidenceStats.high_count} | Low (<60%): ${confidenceStats.low_count}`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Charts Grid */}
      {charts && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Bar Chart: Progress by Dept */}
          <div 
            className="rounded-[10px] p-5 border lg:col-span-2"
            style={{
              background   : 'var(--bg-surface)',
              border       : '0.5px solid var(--border-default)',
              borderTop    : '3px solid var(--color-primary)',
              boxShadow    : 'var(--shadow-card)',
            }}
          >
            <h3 className="text-[13px] font-bold uppercase tracking-wide font-outfit" style={{ color: 'var(--text-heading)' }}>
              {language === 'hi' ? 'विभाग अनुसार औसत परियोजना प्रगति (%)' : 'Average Project Progress by Department (%)'}
            </h3>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid stroke={gridColor} vertical={false} />
                  <XAxis dataKey="department" tick={{ fill: textColor, fontSize: 11 }} />
                  <YAxis tick={{ fill: textColor, fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{
                      background  : tooltipBg,
                      border      : `1px solid ${tooltipBorder}`,
                      borderRadius: '8px',
                      color       : isDark ? '#e8f5ee' : '#2d2d2d',
                    }}
                    cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(26,92,56,0.03)' }} 
                  />
                  <Bar dataKey="progress" fill={primaryFill} radius={[4, 4, 0, 0]} barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart: Document types */}
          <div 
            className="rounded-[10px] p-5 border"
            style={{
              background   : 'var(--bg-surface)',
              border       : '0.5px solid var(--border-default)',
              borderTop    : '3px solid var(--color-primary)',
              boxShadow    : 'var(--shadow-card)',
            }}
          >
            <h3 className="text-[13px] font-bold uppercase tracking-wide font-outfit" style={{ color: 'var(--text-heading)' }}>
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
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      background  : tooltipBg,
                      border      : `1px solid ${tooltipBorder}`,
                      borderRadius: '8px',
                      color       : isDark ? '#e8f5ee' : '#2d2d2d',
                    }}
                  />
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
            className="rounded-[10px] p-5 border lg:col-span-2"
            style={{
              background   : 'var(--bg-surface)',
              border       : '0.5px solid var(--border-default)',
              borderTop    : '3px solid var(--color-primary)',
              boxShadow    : 'var(--shadow-card)',
            }}
          >
            <h3 className="text-[13px] font-bold uppercase tracking-wide font-outfit" style={{ color: 'var(--text-heading)' }}>
              {language === 'hi' ? 'मालिक दस्तावेज़ अपलोड मात्रा (6 महीने का रुझान)' : 'Monthly Document Upload Volume (6 Months Trend)'}
            </h3>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.line_chart}>
                  <CartesianGrid stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: textColor, fontSize: 11 }} />
                  <YAxis tick={{ fill: textColor, fontSize: 11 }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{
                      background  : tooltipBg,
                      border      : `1px solid ${tooltipBorder}`,
                      borderRadius: '8px',
                      color       : isDark ? '#e8f5ee' : '#2d2d2d',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="uploads" 
                    stroke={primaryFill} 
                    strokeWidth={2.5} 
                    activeDot={{ r: 6, fill: accentStroke, stroke: primaryFill }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pending Verifications */}
          <div 
            className="flex flex-col rounded-[10px] p-5 border"
            style={{
              background   : 'var(--bg-surface)',
              border       : '0.5px solid var(--border-default)',
              boxShadow    : 'var(--shadow-card)',
            }}
          >
            <h3 
              className="text-[13px] font-bold uppercase pb-2 border-b font-outfit"
              style={{ color: 'var(--text-heading)', borderBottomColor: 'var(--border-subtle)' }}
            >
              {t('dashboard.pending_verifications')}
            </h3>
            <div className="mt-4 flex-grow overflow-y-auto space-y-4 pr-1 max-h-80">
              {pendingDocs.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-center" style={{ color: 'var(--text-hint)' }}>
                  <Clock className="h-8 w-8 stroke-1" />
                  <span className="mt-1.5 text-xs">{t('dashboard.no_pending_verifications')}</span>
                </div>
              ) : (
                pendingDocs.map((doc) => {
                  let confBg = 'rgba(239, 68, 68, 0.1)';
                  let confText = '#ef4444';
                  let confLabel = t('docs.confidence.low');
                  if (doc.overall_confidence !== null) {
                    if (doc.overall_confidence >= 85) {
                      confBg = 'rgba(16, 185, 129, 0.1)';
                      confText = '#10b981';
                      confLabel = `${doc.overall_confidence}%`;
                    } else if (doc.overall_confidence >= 60) {
                      confBg = 'rgba(245, 158, 11, 0.1)';
                      confText = '#f59e0b';
                      confLabel = `${doc.overall_confidence}%`;
                    } else {
                      confLabel = `${doc.overall_confidence}%`;
                    }
                  } else {
                    confBg = 'rgba(107, 114, 128, 0.1)';
                    confText = '#6b7280';
                    confLabel = 'N/A';
                  }

                  return (
                    <div 
                      key={doc.document_id} 
                      className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0" 
                      style={{ borderBottomColor: 'var(--border-subtle)' }}
                    >
                      <div className="flex items-start space-x-3 min-w-0 flex-1">
                        <div className="mt-0.5 rounded-lg p-2 flex-shrink-0" style={{ backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-primary)' }}>
                          <FileText className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }} title={doc.file_name}>
                            {doc.file_name}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-[10px]" style={{ color: 'var(--text-hint)' }}>
                              {doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : ''}
                            </span>
                            <span 
                              className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase leading-none"
                              style={{ backgroundColor: confBg, color: confText }}
                            >
                              {confLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link
                        to={`/documents/${doc.document_id}/verify`}
                        className="ml-3 shrink-0 inline-flex items-center rounded-lg text-[11px] font-bold transition-all duration-300 px-3 py-1.5 border select-none cursor-pointer"
                        style={{
                          background: 'linear-gradient(135deg, #104225 0%, #0d2e1c 100%)',
                          color: 'var(--color-accent)',
                          border: '1px solid rgba(201, 168, 76, 0.35)',
                          boxShadow: '0 0 6px rgba(201, 168, 76, 0.1)'
                        }}
                      >
                        {t('dashboard.verify_action')}
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
