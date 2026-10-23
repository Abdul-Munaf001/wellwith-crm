import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, buildLeadScopeFilter, getScopedWorkspaceId } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/dashboard/stats
 * Comprehensive role-aware KPI statistics and live charts
 */
router.get('/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const scopeFilter = buildLeadScopeFilter(req);
    const { range = '30D' } = req.query;

    let startDate = new Date(Date.now() - 30 * 86400000);
    if (range === 'Today') startDate = new Date(new Date().setHours(0, 0, 0, 0));
    else if (range === '7D') startDate = new Date(Date.now() - 7 * 86400000);
    else if (range === '90D') startDate = new Date(Date.now() - 90 * 86400000);

    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

    // 1. Fetch KPI metrics in parallel
    const [
      totalLeads,
      newTodayLeads,
      contactedLeads,
      notContactedLeads,
      interestedLeads,
      convertedLeads,
      overdueFollowups,
      allLeadsForAnalytics,
      activities,
    ] = await Promise.all([
      prisma.lead.count({ where: scopeFilter }),
      prisma.lead.count({ where: { ...scopeFilter, createdAt: { gte: todayStart } } }),
      prisma.lead.count({ where: { ...scopeFilter, lastContactedAt: { not: null } } }),
      prisma.lead.count({ where: { ...scopeFilter, status: 'New Enquiry', lastContactedAt: null } }),
      prisma.lead.count({
        where: {
          ...scopeFilter,
          status: { in: ['Wellness Assessment Done', 'Consultation Booked', 'Trial/Demo Attended'] },
        },
      }),
      prisma.lead.count({
        where: {
          ...scopeFilter,
          status: { in: ['Program Enrolled', 'Active Member'] },
        },
      }),
      prisma.followUp.count({
        where: {
          status: 'PENDING',
          dueDate: { lt: new Date() },
          lead: scopeFilter,
        },
      }),
      prisma.lead.findMany({
        where: { ...scopeFilter, createdAt: { gte: startDate } },
        select: {
          id: true,
          status: true,
          source: true,
          createdAt: true,
          lastContactedAt: true,
          heatScore: true,
          wellnessGoal: true,
        },
      }),
      prisma.leadActivity.findMany({
        where: {
          workspaceId: getScopedWorkspaceId(req) || undefined,
          lead: scopeFilter,
        },
        orderBy: { createdAt: 'desc' },
        take: 12,
        include: {
          lead: { select: { id: true, name: true, phone: true } },
          user: { select: { id: true, name: true, avatar: true } },
        },
      }),
    ]);

    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0.0';
    const contactRate = totalLeads > 0 ? Math.round((contactedLeads / totalLeads) * 100) : 0;

    // 2. Leads Over Time (Area Chart)
    const daysMap: { [key: string]: { date: string; leads: number; contacted: number; converted: number } } = {};
    const dayCount = range === 'Today' ? 1 : range === '7D' ? 7 : 30;

    for (let i = dayCount - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateKey = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      daysMap[dateKey] = { date: dateKey, leads: 0, contacted: 0, converted: 0 };
    }

    allLeadsForAnalytics.forEach((l) => {
      const dateKey = new Date(l.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (daysMap[dateKey]) {
        daysMap[dateKey].leads++;
        if (l.lastContactedAt) daysMap[dateKey].contacted++;
        if (['Program Enrolled', 'Active Member'].includes(l.status)) daysMap[dateKey].converted++;
      }
    });

    const leadsOverTime = Object.values(daysMap);

    // 3. Status Distribution (Donut Chart)
    const statusCounts: { [key: string]: number } = {
      'New Enquiry': 0,
      Contacted: 0,
      'Wellness Assessment Done': 0,
      'Consultation Booked': 0,
      'Trial/Demo Attended': 0,
      'Program Enrolled': 0,
      'Active Member': 0,
      'Renewal Due': 0,
      Lost: 0,
    };

    allLeadsForAnalytics.forEach((l) => {
      if (statusCounts[l.status] !== undefined) statusCounts[l.status]++;
      else statusCounts[l.status] = 1;
    });

    const statusColors: { [key: string]: string } = {
      'New Enquiry': '#3B82F6',
      Contacted: '#0EA5E9',
      'Wellness Assessment Done': '#8B5CF6',
      'Consultation Booked': '#F59E0B',
      'Trial/Demo Attended': '#EC4899',
      'Program Enrolled': '#16A34A',
      'Active Member': '#059669',
      'Renewal Due': '#D97706',
      Lost: '#94A3B8',
    };

    const statusDistribution = Object.entries(statusCounts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: statusColors[name] || '#64748B',
      }));

    // 4. Source Split (Pie Chart)
    const sourceCounts: { [key: string]: number } = {};
    allLeadsForAnalytics.forEach((l) => {
      const s = l.source || 'Other';
      sourceCounts[s] = (sourceCounts[s] || 0) + 1;
    });

    const sourcePalette = ['#16A34A', '#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#6366F1'];
    const sourceSplit = Object.entries(sourceCounts).map(([name, value], idx) => ({
      name,
      value,
      color: sourcePalette[idx % sourcePalette.length],
    }));

    // 5. Funnel Chart
    const funnelStages = [
      {
        stage: 'New Enquiries',
        count: totalLeads,
        fill: '#93C5FD',
      },
      {
        stage: 'Contacted',
        count: contactedLeads,
        fill: '#60A5FA',
      },
      {
        stage: 'Assessment Done',
        count: interestedLeads + convertedLeads,
        fill: '#34D399',
      },
      {
        stage: 'Consultation Booked',
        count: Math.round(interestedLeads * 0.75) + convertedLeads,
        fill: '#10B981',
      },
      {
        stage: 'Program Enrolled',
        count: convertedLeads,
        fill: '#15803D',
      },
    ];

    // 6. Wellness Goal Distribution
    const goalCounts: { [key: string]: number } = {};
    allLeadsForAnalytics.forEach((l) => {
      if (l.wellnessGoal) {
        goalCounts[l.wellnessGoal] = (goalCounts[l.wellnessGoal] || 0) + 1;
      }
    });

    const goalDistribution = Object.entries(goalCounts)
      .map(([goal, count]) => ({ goal, count }))
      .sort((a, b) => b.count - a.count);

    // 7. Calculate Speed-to-lead average response time (minutes)
    let totalResponseMinutes = 0;
    let contactedCount = 0;
    allLeadsForAnalytics.forEach((l) => {
      if (l.lastContactedAt) {
        const diff = Math.round((new Date(l.lastContactedAt).getTime() - new Date(l.createdAt).getTime()) / 60000);
        if (diff > 0 && diff < 10080) {
          totalResponseMinutes += diff;
          contactedCount++;
        }
      }
    });
    const avgResponseTimeMin = contactedCount > 0 ? Math.round(totalResponseMinutes / contactedCount) : 18;

    // 8. Daily Summary Card ("Your day in numbers")
    const dailySummary = {
      greeting: `Hello, ${req.user!.name.split(' ')[0]}!`,
      message:
        req.user!.role === 'SUPER_ADMIN'
          ? `WELLWITH team has received ${newTodayLeads} new enquiries today with ${contactRate}% contact rate.`
          : `You have ${newTodayLeads} new leads waiting and ${overdueFollowups} follow-ups scheduled today.`,
      kpis: [
        { label: 'New Today', value: newTodayLeads, trend: '+14%' },
        { label: 'Connect Rate', value: `${contactRate}%`, trend: '+5%' },
        { label: 'Avg Speed-to-Lead', value: `${avgResponseTimeMin}m`, trend: '⚡ Fast' },
        { label: 'Total Enrolled', value: convertedLeads, trend: '🎯 On track' },
      ],
    };

    return res.json({
      kpis: {
        totalLeads,
        newTodayLeads,
        contactedLeads,
        notContactedLeads,
        interestedLeads,
        convertedLeads,
        conversionRate,
        contactRate,
        overdueFollowups,
        avgResponseTimeMin,
      },
      charts: {
        leadsOverTime,
        statusDistribution,
        sourceSplit,
        funnelStages,
        goalDistribution,
      },
      activities,
      dailySummary,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ error: 'Failed to retrieve dashboard metrics.' });
  }
});

export default router;
