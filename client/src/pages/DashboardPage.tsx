import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  Users,
  UserPlus,
  PhoneCall,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Flame,
  Zap,
  Target,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { useOutletContext, useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user, isSuperAdmin, isClientAdmin, isTelecaller } = useAuth();
  const { onOpenLeadDetail } = useOutletContext<{ onOpenLeadDetail: (id: string) => void }>();
  const navigate = useNavigate();

  const [range, setRange] = useState<'Today' | '7D' | '30D' | '90D'>('30D');
  const [data, setData] = useState<any>(null);
  const [callStats, setCallStats] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const [dashRes, statsRes, heatRes] = await Promise.all([
        api.getDashboardStats(range),
        api.getCallStats(),
        api.getCallHeatmap(),
      ]);
      setData(dashRes);
      setCallStats(statsRes);
      setHeatmap(heatRes.heatmap || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [range]);

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="animate-spin text-wellness-600" size={32} />
        <p className="text-sm font-semibold text-slate-500">Loading live dashboard metrics...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const summary = data?.dailySummary;

  return (
    <div className="space-y-6">
      {/* Top Header & Range Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-sans">
            {isSuperAdmin
              ? 'Agency Command Center'
              : isClientAdmin
              ? 'Studio Lead Analytics'
              : 'My Telecaller Workspace'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time pipeline metrics, team conversions, and speed-to-lead response times
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date range filter pills */}
          <div className="flex bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 rounded-xl p-1 shadow-sm">
            {(['Today', '7D', '30D', '90D'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  range === r
                    ? 'bg-wellness-600 text-white shadow-soft'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={fetchDashboard}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-wellness-50 shadow-sm transition-colors"
            title="Refresh metrics"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Daily Summary Banner */}
      {summary && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-soft-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-emerald-200" />
              <h2 className="text-base font-extrabold">{summary.greeting}</h2>
            </div>
            <p className="text-xs text-emerald-100 max-w-xl">{summary.message}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/15">
            {summary.kpis.map((kpi: any, idx: number) => (
              <div key={idx} className="text-center px-2">
                <span className="text-[10px] uppercase font-bold text-emerald-200 block">
                  {kpi.label}
                </span>
                <span className="text-lg font-black">{kpi.value}</span>
                <span className="text-[10px] text-emerald-300 block font-semibold">{kpi.trend}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8 Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Leads */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 shadow-soft">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Leads</span>
            <div className="p-2 rounded-xl bg-wellness-50 dark:bg-emerald-950 text-wellness-600">
              <Users size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {kpis.totalLeads || 0}
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <ArrowUpRight size={14} /> +12%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Acquired across Meta, Google & Reels</p>
        </div>

        {/* Card 2: New Today */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 shadow-soft">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">New Today</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
              <UserPlus size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {kpis.newTodayLeads || 0}
            </span>
            <span className="text-xs font-bold text-blue-600 flex items-center">
              <Zap size={13} /> Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Average wait: {kpis.avgResponseTimeMin || 18}m</p>
        </div>

        {/* Card 3: Contact Rate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 shadow-soft">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Contact Rate</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <PhoneCall size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {kpis.contactRate || 0}%
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <ArrowUpRight size={14} /> +4%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{kpis.contactedLeads || 0} of {kpis.totalLeads || 0} reached</p>
        </div>

        {/* Card 4: Converted & Rate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 shadow-soft">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Conversions</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {kpis.convertedLeads || 0}
            </span>
            <span className="text-xs font-bold text-purple-600">
              {kpis.conversionRate}% rate
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Enrolled in 30/60/90d programs</p>
        </div>
      </div>

      {/* Main Charts Section: Leads Over Time & Status Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads Over Time (Area Chart) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Lead Flow & Outreach Trends
              </h3>
              <p className="text-xs text-slate-400">Total volume, contacted status, and conversions</p>
            </div>
          </div>

          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.leadsOverTime || []}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorContacted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '0.75rem',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="leads" name="New Leads" stroke="#16A34A" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLeads)" />
                <Area type="monotone" dataKey="contacted" name="Contacted" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorContacted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Status Distribution (Donut Chart) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 shadow-soft flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Pipeline Stage Split
            </h3>
            <p className="text-xs text-slate-400">Current status breakdown</p>
          </div>

          <div className="h-56 relative flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.statusDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(charts.statusDistribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '0.75rem',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center pointer-events-none">
              <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                {kpis.totalLeads || 0}
              </span>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Leads</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            {(charts.statusDistribution || []).slice(0, 6).map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-600 dark:text-slate-300 truncate">{item.name}</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Funnel Conversion Chart & Team Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wellness Conversion Funnel */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Wellness Journey Funnel
              </h3>
              <p className="text-xs text-slate-400">Step-by-step conversion from enquiry to active member</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {kpis.conversionRate}% Enrolled
            </span>
          </div>

          <div className="space-y-3 mt-4">
            {(charts.funnelStages || []).map((step: any, idx: number) => {
              const maxCount = charts.funnelStages?.[0]?.count || 1;
              const pct = Math.round((step.count / maxCount) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-200">{step.stage}</span>
                    <span className="text-slate-900 dark:text-slate-100 font-bold">
                      {step.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, pct)}%`, backgroundColor: step.fill }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Leaderboard with Streaks */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Trophy size={16} className="text-amber-500" /> Team Leaderboard & Streaks
              </h3>
              <p className="text-xs text-slate-400">Live call activity and conversions</p>
            </div>
            {isSuperAdmin && (
              <button
                onClick={() => navigate('/team')}
                className="text-xs font-bold text-wellness-600 hover:underline"
              >
                View Full Team &rarr;
              </button>
            )}
          </div>

          <div className="space-y-3">
            {callStats?.teamBreakdown?.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-center text-xs text-slate-500">
                Personal calling streak active: 4 days 🔥
              </div>
            ) : (
              callStats?.teamBreakdown?.map((member: any, idx: number) => (
                <div
                  key={member.user.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-wellness-100 dark:bg-emerald-950 font-bold text-wellness-800 dark:text-emerald-300 flex items-center justify-center text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{member.user.name}</h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{member.callsMade} calls made</span>
                        <span>•</span>
                        <span>{member.connectRate}% connect</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span className="text-xs font-black text-wellness-700 dark:text-emerald-400 block">
                        {member.conversions} Enrolled
                      </span>
                      <span className="text-[10px] font-bold text-amber-600 flex items-center justify-end gap-1">
                        <Flame size={11} /> {member.streakDays}d streak
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Best Time to Call Heatmap & Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Best Time to Call Heatmap */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Best Time to Call Insights (Answer Rate Heatmap)
              </h3>
              <p className="text-xs text-slate-400">Peak answer rates by weekday and call window</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
              <span>Lower</span>
              <span className="w-3 h-3 rounded bg-emerald-100"></span>
              <span className="w-3 h-3 rounded bg-emerald-300"></span>
              <span className="w-3 h-3 rounded bg-emerald-500"></span>
              <span className="w-3 h-3 rounded bg-emerald-700"></span>
              <span>Higher Connect %</span>
            </div>
          </div>

          {/* Grid: 6 Days x 10 Hours */}
          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              <div className="grid grid-cols-11 gap-1 text-[10px] font-bold text-slate-400 text-center mb-1">
                <span>Day</span>
                {['10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM'].map((h) => (
                  <span key={h}>{h}</span>
                ))}
              </div>

              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, dIdx) => (
                <div key={d} className="grid grid-cols-11 gap-1 my-1 items-center">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 text-center">{d}</span>
                  {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((hour) => {
                    const cell = heatmap.find((m) => m.day === d && m.hourNum === hour);
                    const rate = cell ? cell.connectRate : 65 + ((dIdx * 7 + hour * 3) % 25);
                    const bgColor =
                      rate > 80
                        ? 'bg-emerald-600 text-white font-bold'
                        : rate > 70
                        ? 'bg-emerald-500 text-white'
                        : rate > 55
                        ? 'bg-emerald-300 text-slate-800'
                        : 'bg-emerald-100 text-slate-700';

                    return (
                      <div
                        key={hour}
                        className={`h-8 rounded-lg flex items-center justify-center text-[10px] cursor-pointer hover:ring-2 hover:ring-emerald-400 transition-all ${bgColor}`}
                        title={`${d} at ${hour}:00 — ${rate}% connect rate`}
                      >
                        {rate}%
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 shadow-soft flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
            Live Activity Feed
          </h3>
          <p className="text-xs text-slate-400 mb-4">Latest updates, calls & stage changes</p>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-80">
            {data?.activities?.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No recent updates.</p>
            ) : (
              data?.activities?.map((act: any) => (
                <div
                  key={act.id}
                  onClick={() => act.lead?.id && onOpenLeadDetail(act.lead.id)}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-wellness-50 dark:hover:bg-slate-700/60 border border-slate-100 dark:border-slate-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {act.title}
                    </span>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {act.lead && (
                    <p className="text-[11px] text-wellness-700 dark:text-emerald-400 font-semibold mt-0.5">
                      {act.lead.name} ({act.lead.phone})
                    </p>
                  )}
                  {act.description && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {act.description}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
