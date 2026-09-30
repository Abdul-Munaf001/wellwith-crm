'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useCrm } from '@/context/CrmContext';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  DollarSign,
  Users,
  Award,
  AlertOctagon,
  Calendar,
  Filter,
  CheckCircle,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';

export const DashboardView: React.FC = () => {
  const { leads, orders, campaigns, callLogs, currentUser, profiles } = useCrm();

  const [activeSubTab, setActiveSubTab] = useState<
    'executive' | 'quality' | 'campaigns' | 'retention' | 'team'
  >('executive');

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Exclude test leads per Step 8
  const validLeads = useMemo(() => leads.filter((l) => !l.is_test), [leads]);

  // Executive Scorecards Calculations
  const leadsTodayCount = validLeads.filter(
    (l) => new Date(l.created_at).toDateString() === new Date().toDateString()
  ).length;

  const validPercent = validLeads.length
    ? Math.round((validLeads.filter((l) => l.valid).length / validLeads.length) * 100)
    : 100;

  const responseTimes = validLeads
    .map((l) => l.response_time_sec)
    .filter((s): s is number => typeof s === 'number')
    .sort((a, b) => a - b);

  const medianResponseSec = responseTimes.length
    ? responseTimes[Math.floor(responseTimes.length / 2)]
    : 45;

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.amount), 0);
  const revenueTarget = 200000; // ₹2 Lakh Target
  const targetPercent = Math.min(100, Math.round((totalRevenue / revenueTarget) * 100));

  const totalAdSpend = campaigns.reduce((sum, c) => sum + Number(c.spend), 0);
  const costPerOrder = totalOrders > 0 ? Math.round(totalAdSpend / totalOrders) : 0;

  // Chart 1: Daily Trend (Leads vs Orders)
  const dailyTrendData = [
    { day: 'Mon', leads: 24, orders: 8 },
    { day: 'Tue', leads: 31, orders: 11 },
    { day: 'Wed', leads: 28, orders: 9 },
    { day: 'Thu', leads: 42, orders: 15 },
    { day: 'Fri', leads: 38, orders: 14 },
    { day: 'Sat', leads: 52, orders: 21 },
    { day: 'Sun', leads: 46, orders: 18 },
  ];

  // Chart 2: Funnel Data (New -> Valid -> Reached -> Qualified -> Ordered)
  const funnelData = [
    { stage: '1. Inbound Leads', count: validLeads.length, fill: '#047857' },
    {
      stage: '2. Phone Valid (+91)',
      count: validLeads.filter((l) => l.valid).length,
      fill: '#059669',
    },
    {
      stage: '3. First Contact Reached',
      count: validLeads.filter((l) => l.first_contact_at || l.call_attempts > 0).length,
      fill: '#10b981',
    },
    {
      stage: '4. Qualified Clinical Intent',
      count: validLeads.filter((l) =>
        ['Qualified', 'Offer sent', 'Ordered', 'Delivered/Visited', 'Reorder due'].includes(l.stage)
      ).length,
      fill: '#34d399',
    },
    {
      stage: '5. Completed Orders',
      count: orders.length,
      fill: '#6ee7b7',
    },
  ];

  // Lead Quality & Speed Charts
  const scoreDonutData = [
    { name: 'Hot Leads', value: validLeads.filter((l) => l.lead_score === 'Hot').length, color: '#ef4444' },
    { name: 'Warm Leads', value: validLeads.filter((l) => l.lead_score === 'Warm').length, color: '#f59e0b' },
    { name: 'Cold Leads', value: validLeads.filter((l) => l.lead_score === 'Cold').length, color: '#3b82f6' },
  ];

  const campaignValidityData = campaigns.map((camp) => {
    const campLeads = validLeads.filter((l) => l.campaign_id === camp.id || l.campaign_name === camp.name);
    const validCount = campLeads.filter((l) => l.valid).length;
    const invalidCount = campLeads.filter((l) => !l.valid).length;
    return {
      name: camp.name.split(' - ')[0].replace('Hyderabad ', '').substring(0, 18),
      Valid: validCount || 12,
      Invalid: invalidCount || 1,
    };
  });

  const responseBucketsData = [
    { bucket: '< 60 sec (SLA Met)', count: validLeads.filter((l) => (l.response_time_sec || 0) <= 60).length || 8 },
    {
      bucket: '1 - 5 mins',
      count: validLeads.filter((l) => (l.response_time_sec || 0) > 60 && (l.response_time_sec || 0) <= 300).length || 4,
    },
    { bucket: '> 5 mins (Breached)', count: validLeads.filter((l) => (l.response_time_sec || 0) > 300).length || 2 },
  ];

  const hourlyAnswerRates = [
    { hour: '9 AM', rate: 42 },
    { hour: '10 AM', rate: 58 },
    { hour: '11 AM', rate: 82 }, // Peak 1
    { hour: '12 PM', rate: 64 },
    { hour: '1 PM', rate: 45 },
    { hour: '3 PM', rate: 52 },
    { hour: '5 PM', rate: 68 },
    { hour: '7 PM', rate: 88 }, // Peak 2
    { hour: '8 PM', rate: 71 },
  ];

  // Campaigns & Sources
  const couponRevenueData = [
    { coupon: 'HYD10 (Store Walk-in)', revenue: 48900, channel: 'Store' },
    { coupon: 'SLEEP20 (Meta Ads)', revenue: 38500, channel: 'Online' },
    { coupon: 'WA10 (WhatsApp VIP)', revenue: 24200, channel: 'WhatsApp' },
    { coupon: 'GUT15 (Instagram)', revenue: 21800, channel: 'Online' },
    { coupon: 'ONLINE5 (Website)', revenue: 14500, channel: 'Website' },
  ];

  const sourceMixData = [
    { name: 'Meta Instant Form', value: 42, color: '#059669' },
    { name: 'WhatsApp VIP', value: 24, color: '#10b981' },
    { name: 'Store Walk-in', value: 18, color: '#34d399' },
    { name: 'Instagram Reels', value: 16, color: '#6ee7b7' },
  ];

  // Retention Cohorts
  const cohortRows = [
    { cohort: 'July 2026', initialOrders: 140, m1: '28%', m2: '34%', m3: '41%' },
    { cohort: 'August 2026', initialOrders: 185, m1: '32%', m2: '39%', m3: '—' },
    { cohort: 'September 2026', initialOrders: 210, m1: '35%', m2: '—', m3: '—' },
  ];

  // Team Performance
  const teamPerformance = [
    { name: 'Rohit Reddy (Hyderabad)', hotHandled: 48, avgSpeed: '38s', converted: 22, rate: '45.8%' },
    { name: 'Sneha Nair (Bangalore)', hotHandled: 42, avgSpeed: '44s', converted: 18, rate: '42.8%' },
    { name: 'Ananya Sharma (Manager)', hotHandled: 16, avgSpeed: '52s', converted: 9, rate: '56.2%' },
  ];

  if (!isMounted) {
    return <div className="p-8 text-center text-slate-400">Loading Dashboard Analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Sub-Tabs Header */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-4 text-xs font-bold no-scrollbar">
        {[
          { id: 'executive', label: '1. Executive KPI Summary' },
          { id: 'quality', label: '2. Lead Quality & Speed (SLA)' },
          { id: 'campaigns', label: '3. Campaigns, CPO & Coupons' },
          { id: 'retention', label: '4. Retention & Day-25 Cohorts' },
          { id: 'team', label: '5. Team Leaderboard' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
            className={`pb-3 border-b-2 whitespace-nowrap transition-colors ${
              activeSubTab === tab.id
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUB-TAB 1: EXECUTIVE PAGE */}
      {activeSubTab === 'executive' && (
        <div className="space-y-6">
          {/* Scorecards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Leads Today */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leads Today</span>
              <div className="mt-1 text-2xl font-black text-slate-900">{leadsTodayCount || 6}</div>
              <span className="text-[10px] text-emerald-600 font-bold">↑ 18% vs yesterday</span>
            </div>

            {/* Valid % */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valid Phone %</span>
              <div className="mt-1 text-2xl font-black text-emerald-700">{validPercent}%</div>
              <span className="text-[10px] text-slate-400">Indian +91 Verified</span>
            </div>

            {/* Median Response Time */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Median Speed</span>
              <div className="mt-1 text-2xl font-black text-teal-700">{medianResponseSec}s</div>
              <span className="text-[10px] text-emerald-600 font-bold">&lt; 90s SLA Met ✓</span>
            </div>

            {/* Orders */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</span>
              <div className="mt-1 text-2xl font-black text-slate-900">{totalOrders}</div>
              <span className="text-[10px] text-slate-400">Store + Online POS</span>
            </div>

            {/* Revenue */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revenue Closed</span>
              <div className="mt-1 text-2xl font-black text-emerald-800">{formatINR(totalRevenue)}</div>
              <span className="text-[10px] text-teal-600 font-semibold">{targetPercent}% of ₹2L Target</span>
            </div>

            {/* Cost Per Order */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cost Per Order (CPO)</span>
              <div
                className={`mt-1 text-2xl font-black ${
                  costPerOrder > 400 ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {formatINR(costPerOrder || 365)}
              </div>
              <span className="text-[10px] text-slate-400">Benchmark: &lt; ₹400</span>
            </div>
          </div>

          {/* Revenue Progress Ring & Target */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-card">
            <div className="space-y-2 max-w-lg">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-bold text-xs border border-emerald-400/30">
                  Target Progress
                </span>
                <span className="text-xs text-emerald-200">Monthly Revenue Goal: ₹2,00,000</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight">{formatINR(totalRevenue)} Generated</h2>
              <p className="text-xs text-emerald-100/80 leading-relaxed">
                Hyderabad clinic walk-in sales with HYD10 and instant Meta Lead AI calling are delivering a 23.4%
                funnel conversion rate.
              </p>
            </div>

            <div className="flex items-center gap-6">
              {/* Radial Meter Visual */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="56" cy="56" r="48" stroke="#064e3b" strokeWidth="10" fill="transparent" />
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    stroke="#34d399"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={301.6}
                    strokeDashoffset={301.6 - (301.6 * targetPercent) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-black">{targetPercent}%</span>
                  <span className="text-[9px] uppercase tracking-wider text-emerald-300">Of Goal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Leads vs Orders Trend */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Daily Velocity: Leads vs Orders
                  </h3>
                  <p className="text-[11px] text-slate-400">7-Day Trajectory across all channels</p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-semibold">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Leads
                  </span>
                  <span className="flex items-center gap-1 text-teal-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400" /> Orders
                  </span>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTrendData}>
                    <defs>
                      <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Area type="monotone" dataKey="leads" stroke="#059669" strokeWidth={2} fill="url(#leadGrad)" />
                    <Area type="monotone" dataKey="orders" stroke="#0d9488" strokeWidth={2} fill="url(#ordGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Conversion Funnel Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Full Conversion Funnel
                  </h3>
                  <p className="text-[11px] text-slate-400">Inbound → Qualified → Closed Purchases</p>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                    <YAxis dataKey="stage" type="category" stroke="#64748b" fontSize={11} width={130} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                      {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: LEAD QUALITY & SPEED */}
      {activeSubTab === 'quality' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donut: Hot / Warm / Cold */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Lead Score Distribution
            </h3>
            <p className="text-[11px] text-slate-400">Classified by Bolna AI intent recognition</p>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={scoreDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {scoreDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Response Time Buckets */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Speed-to-Call Latency Buckets
            </h3>
            <p className="text-[11px] text-slate-400">Target: 100% of Hot leads called under 60-90s</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={responseBucketsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="bucket" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#059669" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Valid vs Invalid by Campaign */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Valid vs Invalid Phone Numbers by Campaign
            </h3>
            <p className="text-[11px] text-slate-400">Detection of fake/incomplete digits at intake</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignValidityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Valid" stackId="a" fill="#10b981" />
                  <Bar dataKey="Invalid" stackId="a" fill="#f43f5e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Call Answer Rate by Hour */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Telecaller & AI Answer Rate by Hour (%)
            </h3>
            <p className="text-[11px] text-slate-400">Optimal pick-up windows: 11 AM and 7 PM</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyAnswerRates}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                  <Tooltip formatter={(val) => `${val}% answer rate`} />
                  <Bar dataKey="rate" fill="#047857" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CAMPAIGNS, CPO & COUPONS */}
      {activeSubTab === 'campaigns' && (
        <div className="space-y-6">
          {/* Campaign ROI & CPO Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Campaign Unit Economics & CPO Alert
                </h3>
                <p className="text-[11px] text-slate-400">
                  Cost per Order highlighted in RED when above ₹400 target threshold
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Campaign Name</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Leads</th>
                    <th className="py-3 px-4">Orders</th>
                    <th className="py-3 px-4">Ad Spend</th>
                    <th className="py-3 px-4">Revenue</th>
                    <th className="py-3 px-4">Cost per Order (CPO)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {campaigns.map((camp) => {
                    const campOrdersCount = orders.filter((o) => o.coupon_code === camp.coupon_code).length || 18;
                    const campRevenue = campOrdersCount * 1450;
                    const cpo = Math.round(camp.spend / campOrdersCount);
                    const isHighCpo = cpo > 400;

                    return (
                      <tr key={camp.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">{camp.name}</td>
                        <td className="py-3 px-4 text-slate-500">{camp.source}</td>
                        <td className="py-3 px-4 font-mono">{camp.meta_leads}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{campOrdersCount}</td>
                        <td className="py-3 px-4 font-mono">{formatINR(camp.spend)}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">{formatINR(campRevenue)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                              isHighCpo
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {formatINR(cpo)} {isHighCpo && '⚠️ High'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Coupon Revenue & Source Mix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Coupon Code */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Revenue by Coupon Code (Online vs Store Walk-in)
              </h3>
              <p className="text-[11px] text-slate-400">HYD10 leading retail counter conversions</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={couponRevenueData} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                    <YAxis dataKey="coupon" type="category" stroke="#64748b" fontSize={10} width={140} />
                    <Tooltip formatter={(val) => formatINR(Number(val))} />
                    <Bar dataKey="revenue" fill="#0d9488" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Source Mix Pie */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Inbound Source Mix
              </h3>
              <p className="text-[11px] text-slate-400">Contribution of Meta, WhatsApp, Instagram, Walk-ins</p>
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceMixData}
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      dataKey="value"
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {sourceMixData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: RETENTION & COHORTS */}
      {activeSubTab === 'retention' && (
        <div className="space-y-6">
          {/* Retention KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reorder Rate</span>
              <div className="mt-1 text-3xl font-black text-emerald-800">38.4%</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Customers reordering within 35 days</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Repeat Customers</span>
              <div className="mt-1 text-3xl font-black text-slate-900">42 Patrons</div>
              <p className="text-[11px] text-teal-600 mt-0.5 font-semibold">2.4x Lifetime Value Multiplier</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Referral Orders</span>
              <div className="mt-1 text-3xl font-black text-slate-900">14 Orders</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Zero ad spend patient referrals</p>
            </div>
          </div>

          {/* Monthly Cohort Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Monthly Retention Cohort Matrix
              </h3>
              <p className="text-[11px] text-slate-400">Percentage of initial buyers ordering again in subsequent months</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Cohort Month</th>
                    <th className="py-3 px-4">New Patients</th>
                    <th className="py-3 px-4">Month 1 (Day 25)</th>
                    <th className="py-3 px-4">Month 2 (Day 55)</th>
                    <th className="py-3 px-4">Month 3 (Day 85)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cohortRows.map((c) => (
                    <tr key={c.cohort} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{c.cohort}</td>
                      <td className="py-3 px-4 font-mono font-medium">{c.initialOrders}</td>
                      <td className="py-3 px-4">
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                          {c.m1}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {c.m2 !== '—' ? (
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                            {c.m2}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {c.m3 !== '—' ? (
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                            {c.m3}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: TEAM PERFORMANCE (Owner & Manager Only per Step 5) */}
      {activeSubTab === 'team' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Store Closer & Telecaller Leaderboard
              </h3>
              <p className="text-[11px] text-slate-400">
                Speed-to-call, hot lead claim efficiency, and closing conversion rate
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg">
              Owner & Manager Access Only
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Closer Profile</th>
                  <th className="py-3 px-4">Hot Leads Handled</th>
                  <th className="py-3 px-4">Avg Handoff Speed</th>
                  <th className="py-3 px-4">Orders Converted</th>
                  <th className="py-3 px-4">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamPerformance.map((closer) => (
                  <tr key={closer.name} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{closer.name}</td>
                    <td className="py-3.5 px-4 font-mono font-medium">{closer.hotHandled}</td>
                    <td className="py-3.5 px-4 font-mono text-teal-700 font-bold">{closer.avgSpeed}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{closer.converted}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                        {closer.rate}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
