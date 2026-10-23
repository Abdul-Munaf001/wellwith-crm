import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireRoles, requireSuperAdmin, buildLeadScopeFilter, getScopedWorkspaceId } from '../middleware/auth.js';
import { normalizePhone, calculateHeatScore, getSpeedToLeadMetrics, getSmartProgramMatch } from '../utils/crm-helpers.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * GET /api/leads
 * Filtered, sorted, paginated leads list with strict RBAC scoping
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const scopeFilter = buildLeadScopeFilter(req);

    const {
      status,
      source,
      campaignId,
      wellnessGoal,
      assignedToId,
      temperature,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = '1',
      limit = '50',
    } = req.query;

    const where: any = { ...scopeFilter };

    if (status && status !== 'all') {
      where.status = status;
    }
    if (source && source !== 'all') {
      where.source = source;
    }
    if (campaignId && campaignId !== 'all') {
      where.campaignId = campaignId;
    }
    if (wellnessGoal && wellnessGoal !== 'all') {
      where.wellnessGoal = wellnessGoal;
    }
    if (temperature && temperature !== 'all') {
      where.temperature = temperature;
    }

    // If super admin / client admin filters by assigned user
    if (assignedToId && assignedToId !== 'all' && req.user!.role !== 'TEAM_MEMBER') {
      if (assignedToId === 'unassigned') {
        where.assignedToId = null;
      } else {
        where.assignedToId = assignedToId;
      }
    }

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { name: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } },
        { city: { contains: q } },
        { wellnessGoal: { contains: q } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * pageSize;

    const [total, leads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc' },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          campaign: {
            select: { id: true, name: true, source: true },
          },
          _count: {
            select: { callLogs: true, followUps: true },
          },
        },
      }),
    ]);

    // Enhance leads with speed-to-lead status
    const enhancedLeads = leads.map((lead) => {
      const speedMetrics = getSpeedToLeadMetrics(lead.createdAt, lead.lastContactedAt);
      const programMatch = getSmartProgramMatch(lead.wellnessGoal);
      return {
        ...lead,
        speedToLead: speedMetrics,
        programRecommendation: programMatch,
      };
    });

    return res.json({
      leads: enhancedLeads,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return res.status(500).json({ error: 'Failed to retrieve leads.' });
  }
});

/**
 * GET /api/leads/focus (Today's Focus - Smart Call Queue)
 * Ranked list based on:
 * 1. Overdue or due today follow-ups
 * 2. High Heat Score (> 80)
 * 3. Speed-to-lead pending untouched leads
 */
router.get('/focus', requireAuth, async (req: Request, res: Response) => {
  try {
    const scopeFilter = buildLeadScopeFilter(req);

    // Fetch leads needing attention
    const leads = await prisma.lead.findMany({
      where: {
        ...scopeFilter,
        status: { notIn: ['Program Enrolled', 'Lost'] },
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        campaign: { select: { id: true, name: true } },
        followUps: {
          where: { status: 'PENDING' },
          orderBy: { dueDate: 'asc' },
          take: 1,
        },
      },
      take: 40,
    });

    // Score and rank for Today's Focus
    const now = Date.now();
    const ranked = leads
      .map((lead) => {
        let focusScore = lead.heatScore;
        let reason = 'High engagement heat score';

        // Check overdue follow up
        if (lead.nextFollowupAt) {
          const due = new Date(lead.nextFollowupAt).getTime();
          if (due < now) {
            focusScore += 50;
            reason = '⚠️ Overdue scheduled follow-up';
          } else if (due - now < 86400000) {
            focusScore += 30;
            reason = '📅 Follow-up scheduled today';
          }
        }

        // Untouched speed-to-lead
        if (lead.status === 'New Enquiry' && !lead.lastContactedAt) {
          focusScore += 40;
          reason = '🔥 New lead waiting for initial call';
        }

        const programMatch = getSmartProgramMatch(lead.wellnessGoal);
        const speed = getSpeedToLeadMetrics(lead.createdAt, lead.lastContactedAt);

        return {
          ...lead,
          focusScore,
          focusReason: reason,
          programRecommendation: programMatch,
          speedToLead: speed,
        };
      })
      .sort((a, b) => b.focusScore - a.focusScore);

    return res.json({ queue: ranked.slice(0, 15) });
  } catch (error: any) {
    console.error('Error fetching smart queue:', error);
    return res.status(500).json({ error: 'Failed to retrieve smart call queue.' });
  }
});

/**
 * GET /api/leads/warnings (Lead Health Warnings)
 */
router.get('/warnings', requireAuth, async (req: Request, res: Response) => {
  try {
    const scopeFilter = buildLeadScopeFilter(req);
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 3600000);

    const [untouched48hCount, overdueFollowupsCount, unassignedCount] = await Promise.all([
      prisma.lead.count({
        where: {
          ...scopeFilter,
          status: 'New Enquiry',
          lastContactedAt: null,
          createdAt: { lt: fortyEightHoursAgo },
        },
      }),
      prisma.followUp.count({
        where: {
          status: 'PENDING',
          dueDate: { lt: new Date() },
          lead: scopeFilter,
        },
      }),
      req.user!.role !== 'TEAM_MEMBER'
        ? prisma.lead.count({
            where: {
              ...scopeFilter,
              assignedToId: null,
              status: 'New Enquiry',
            },
          })
        : 0,
    ]);

    const warnings: any[] = [];
    if (untouched48hCount > 0) {
      warnings.push({
        type: 'UNTOUCHED_LEADS',
        severity: 'danger',
        title: 'Untouched Leads Alert',
        message: `${untouched48hCount} leads have been untouched for over 48 hours. Risk of losing interest!`,
      });
    }
    if (overdueFollowupsCount > 0) {
      warnings.push({
        type: 'OVERDUE_FOLLOWUPS',
        severity: 'warning',
        title: 'Overdue Follow-ups',
        message: `${overdueFollowupsCount} scheduled follow-up tasks are past their due time.`,
      });
    }
    if (unassignedCount > 0) {
      warnings.push({
        type: 'UNASSIGNED_LEADS',
        severity: 'info',
        title: 'Unassigned Leads in Queue',
        message: `${unassignedCount} new leads need to be distributed to telecallers.`,
      });
    }

    return res.json({ warnings });
  } catch (error: any) {
    console.error('Error fetching warnings:', error);
    return res.status(500).json({ error: 'Failed to retrieve warnings.' });
  }
});

/**
 * GET /api/leads/:id
 * Single Lead Details with strict RBAC security
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const scopeFilter = buildLeadScopeFilter(req);
    const lead = await prisma.lead.findFirst({
      where: {
        id: req.params.id,
        ...scopeFilter, // Ensures user can only access what they have permission to see
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, phone: true, avatar: true },
        },
        campaign: true,
        callLogs: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        followUps: {
          orderBy: { dueDate: 'asc' },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        consultations: {
          orderBy: { scheduledAt: 'desc' },
        },
        enrollments: {
          include: { program: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found or you do not have permission to access it.' });
    }

    const programMatch = getSmartProgramMatch(lead.wellnessGoal);
    const speed = getSpeedToLeadMetrics(lead.createdAt, lead.lastContactedAt);

    return res.json({
      lead: {
        ...lead,
        programRecommendation: programMatch,
        speedToLead: speed,
      },
    });
  } catch (error: any) {
    console.error('Error fetching lead details:', error);
    return res.status(500).json({ error: 'Failed to retrieve lead details.' });
  }
});

/**
 * POST /api/leads
 * Create new lead with phone normalization & duplicate check
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const targetWorkspaceId = getScopedWorkspaceId(req) || req.body.workspaceId;
    if (!targetWorkspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required.' });
    }

    const {
      name,
      phone,
      whatsappNumber,
      email,
      age,
      gender,
      city,
      wellnessGoal,
      healthConcerns,
      budgetRange,
      preferredCallTime,
      language,
      source = 'Website',
      campaignId,
      notes,
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone number are required.' });
    }

    const { phone: normalizedPhone, isValid } = normalizePhone(phone);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid phone number format. Please provide a valid 10-digit number.' });
    }

    // Duplicate detection by phone in workspace
    const existing = await prisma.lead.findFirst({
      where: {
        workspaceId: targetWorkspaceId,
        phone: normalizedPhone,
      },
    });

    if (existing) {
      return res.status(409).json({
        error: `Duplicate lead detected. A lead already exists for phone ${normalizedPhone} (${existing.name}, status: ${existing.status}).`,
        existingLeadId: existing.id,
      });
    }

    const heatScore = calculateHeatScore({
      source,
      status: 'New Enquiry',
      budgetRange,
      createdAt: new Date(),
    });

    // Determine initial assignment
    let assignedToId = req.body.assignedToId || null;
    if (req.user!.role === 'TEAM_MEMBER') {
      assignedToId = req.user!.id;
    }

    const lead = await prisma.lead.create({
      data: {
        workspaceId: targetWorkspaceId,
        name: name.trim(),
        phone: normalizedPhone,
        whatsappNumber: whatsappNumber ? normalizePhone(whatsappNumber).phone : normalizedPhone,
        email: email ? email.trim().toLowerCase() : null,
        age: age ? parseInt(age, 10) : null,
        gender,
        city,
        wellnessGoal,
        healthConcerns,
        budgetRange,
        preferredCallTime,
        language,
        source,
        campaignId: campaignId || null,
        assignedToId,
        status: 'New Enquiry',
        temperature: heatScore > 80 ? 'Hot' : heatScore > 50 ? 'Warm' : 'Cold',
        heatScore,
        notes,
      },
    });

    // Create Activity
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        workspaceId: targetWorkspaceId,
        userId: req.user!.id,
        type: 'NOTE',
        title: 'Lead Created',
        description: `Lead added manually via CRM by ${req.user!.name}`,
      },
    });

    return res.status(201).json({ lead });
  } catch (error: any) {
    console.error('Error creating lead:', error);
    return res.status(500).json({ error: 'Failed to create lead.' });
  }
});

/**
 * PUT /api/leads/:id
 * Update lead details & status
 */
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const scopeFilter = buildLeadScopeFilter(req);
    const existing = await prisma.lead.findFirst({
      where: { id: req.params.id, ...scopeFilter },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Lead not found or you do not have permission to update it.' });
    }

    const {
      name,
      email,
      age,
      gender,
      city,
      wellnessGoal,
      healthConcerns,
      budgetRange,
      preferredCallTime,
      language,
      status,
      temperature,
      assignedToId,
      notes,
    } = req.body;

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (email !== undefined) dataToUpdate.email = email;
    if (age !== undefined) dataToUpdate.age = age ? parseInt(age, 10) : null;
    if (gender !== undefined) dataToUpdate.gender = gender;
    if (city !== undefined) dataToUpdate.city = city;
    if (wellnessGoal !== undefined) dataToUpdate.wellnessGoal = wellnessGoal;
    if (healthConcerns !== undefined) dataToUpdate.healthConcerns = healthConcerns;
    if (budgetRange !== undefined) dataToUpdate.budgetRange = budgetRange;
    if (preferredCallTime !== undefined) dataToUpdate.preferredCallTime = preferredCallTime;
    if (language !== undefined) dataToUpdate.language = language;
    if (notes !== undefined) dataToUpdate.notes = notes;

    // Only Admins can reassign
    if (assignedToId !== undefined && req.user!.role !== 'TEAM_MEMBER') {
      dataToUpdate.assignedToId = assignedToId === 'unassigned' ? null : assignedToId;
      if (assignedToId !== existing.assignedToId) {
        await prisma.leadActivity.create({
          data: {
            leadId: existing.id,
            workspaceId: existing.workspaceId,
            userId: req.user!.id,
            type: 'ASSIGNMENT',
            title: 'Lead Reassigned',
            description: `Lead reassigned by ${req.user!.name}`,
          },
        });
      }
    }

    // Status changes
    if (status && status !== existing.status) {
      dataToUpdate.status = status;
      await prisma.leadActivity.create({
        data: {
          leadId: existing.id,
          workspaceId: existing.workspaceId,
          userId: req.user!.id,
          type: 'STATUS_CHANGE',
          title: 'Status Updated',
          description: `Stage moved from "${existing.status}" → "${status}" by ${req.user!.name}`,
        },
      });
    }

    if (temperature) {
      dataToUpdate.temperature = temperature;
    }

    // Recalculate heat score on update
    dataToUpdate.heatScore = calculateHeatScore({
      source: existing.source,
      status: dataToUpdate.status || existing.status,
      budgetRange: dataToUpdate.budgetRange || existing.budgetRange,
      createdAt: existing.createdAt,
      intakeCompleted: existing.intakeCompleted,
    });

    const updated = await prisma.lead.update({
      where: { id: existing.id },
      data: dataToUpdate,
      include: {
        assignedTo: { select: { id: true, name: true, avatar: true } },
      },
    });

    return res.json({ lead: updated });
  } catch (error: any) {
    console.error('Error updating lead:', error);
    return res.status(500).json({ error: 'Failed to update lead.' });
  }
});

/**
 * POST /api/leads/:id/intake
 * Save Wellness Intake Mini-Form
 */
router.post('/:id/intake', requireAuth, async (req: Request, res: Response) => {
  try {
    const scopeFilter = buildLeadScopeFilter(req);
    const existing = await prisma.lead.findFirst({
      where: { id: req.params.id, ...scopeFilter },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Lead not found or permission denied.' });
    }

    const { intakeSleep, intakeStress, intakeDiet, intakeExercise, intakeMedicalFlags } = req.body;

    const newHeatScore = Math.min(100, existing.heatScore + 10);

    const updated = await prisma.lead.update({
      where: { id: existing.id },
      data: {
        intakeCompleted: true,
        intakeSleep,
        intakeStress,
        intakeDiet,
        intakeExercise,
        intakeMedicalFlags,
        status: existing.status === 'New Enquiry' || existing.status === 'Contacted' ? 'Wellness Assessment Done' : existing.status,
        heatScore: newHeatScore,
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: existing.id,
        workspaceId: existing.workspaceId,
        userId: req.user!.id,
        type: 'INTAKE',
        title: 'Wellness Intake Completed',
        description: `Assessment logged: Sleep (${intakeSleep || 'N/A'}), Stress (${intakeStress || 'N/A'}), Diet (${intakeDiet || 'N/A'})`,
      },
    });

    return res.json({ lead: updated, message: 'Wellness intake saved successfully.' });
  } catch (error: any) {
    console.error('Error saving wellness intake:', error);
    return res.status(500).json({ error: 'Failed to save intake assessment.' });
  }
});

/**
 * POST /api/leads/bulk-assign (Admin Only)
 */
router.post('/bulk-assign', requireAuth, requireRoles('SUPER_ADMIN', 'CLIENT_ADMIN'), async (req: Request, res: Response) => {
  try {
    const { leadIds, userId } = req.body;
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ error: 'leadIds array is required.' });
    }

    const scopedWs = getScopedWorkspaceId(req);
    const where: any = { id: { in: leadIds } };
    if (scopedWs) where.workspaceId = scopedWs;

    const assignTarget = userId === 'unassigned' ? null : userId;

    await prisma.lead.updateMany({
      where,
      data: { assignedToId: assignTarget },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId: scopedWs,
        userId: req.user!.id,
        action: 'LEAD_BULK_ASSIGN',
        entity: 'Lead',
        details: `Assigned ${leadIds.length} leads to user: ${assignTarget || 'Unassigned'}`,
      },
    });

    return res.json({ success: true, count: leadIds.length });
  } catch (error: any) {
    console.error('Error bulk assigning leads:', error);
    return res.status(500).json({ error: 'Failed to bulk assign leads.' });
  }
});

/**
 * POST /api/leads/bulk-status
 */
router.post('/bulk-status', requireAuth, async (req: Request, res: Response) => {
  try {
    const { leadIds, status } = req.body;
    if (!Array.isArray(leadIds) || !status) {
      return res.status(400).json({ error: 'leadIds array and status are required.' });
    }

    const scopeFilter = buildLeadScopeFilter(req);
    const where: any = { id: { in: leadIds }, ...scopeFilter };

    await prisma.lead.updateMany({
      where,
      data: { status },
    });

    return res.json({ success: true, count: leadIds.length, newStatus: status });
  } catch (error: any) {
    console.error('Error bulk updating status:', error);
    return res.status(500).json({ error: 'Failed to update status in bulk.' });
  }
});

/**
 * POST /api/leads/bulk-delete (Admin Only)
 */
router.post('/bulk-delete', requireAuth, requireRoles('SUPER_ADMIN', 'CLIENT_ADMIN'), async (req: Request, res: Response) => {
  try {
    const { leadIds } = req.body;
    if (!Array.isArray(leadIds)) {
      return res.status(400).json({ error: 'leadIds array required.' });
    }

    const scopedWs = getScopedWorkspaceId(req);
    const where: any = { id: { in: leadIds } };
    if (scopedWs) where.workspaceId = scopedWs;

    const count = await prisma.lead.deleteMany({ where });

    return res.json({ success: true, count: count.count });
  } catch (error: any) {
    console.error('Error bulk deleting leads:', error);
    return res.status(500).json({ error: 'Failed to bulk delete leads.' });
  }
});

/**
 * POST /api/leads/merge (Admin Only)
 */
router.post('/merge', requireAuth, requireRoles('SUPER_ADMIN', 'CLIENT_ADMIN'), async (req: Request, res: Response) => {
  try {
    const { primaryLeadId, secondaryLeadId } = req.body;
    if (!primaryLeadId || !secondaryLeadId) {
      return res.status(400).json({ error: 'Primary and secondary lead IDs required.' });
    }

    const scopedWs = getScopedWorkspaceId(req);
    const [primary, secondary] = await Promise.all([
      prisma.lead.findFirst({ where: { id: primaryLeadId, ...(scopedWs ? { workspaceId: scopedWs } : {}) } }),
      prisma.lead.findFirst({ where: { id: secondaryLeadId, ...(scopedWs ? { workspaceId: scopedWs } : {}) } }),
    ]);

    if (!primary || !secondary) {
      return res.status(404).json({ error: 'Both primary and secondary leads must exist in the workspace.' });
    }

    // Re-link activities, call logs, follow-ups
    await prisma.$transaction([
      prisma.leadActivity.updateMany({
        where: { leadId: secondary.id },
        data: { leadId: primary.id },
      }),
      prisma.callLog.updateMany({
        where: { leadId: secondary.id },
        data: { leadId: primary.id },
      }),
      prisma.followUp.updateMany({
        where: { leadId: secondary.id },
        data: { leadId: primary.id },
      }),
      prisma.lead.delete({
        where: { id: secondary.id },
      }),
      prisma.leadActivity.create({
        data: {
          leadId: primary.id,
          workspaceId: primary.workspaceId,
          userId: req.user!.id,
          type: 'NOTE',
          title: 'Duplicate Lead Merged',
          description: `Merged duplicate lead (${secondary.name}, phone: ${secondary.phone}) into primary lead.`,
        },
      }),
    ]);

    return res.json({ success: true, message: 'Leads merged successfully.' });
  } catch (error: any) {
    console.error('Error merging leads:', error);
    return res.status(500).json({ error: 'Failed to merge leads.' });
  }
});

/**
 * GET /api/leads/export/csv
 */
router.get('/export/csv', requireAuth, async (req: Request, res: Response) => {
  try {
    const scopeFilter = buildLeadScopeFilter(req);
    const leads = await prisma.lead.findMany({
      where: scopeFilter,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: { select: { name: true, email: true } },
        campaign: { select: { name: true } },
      },
    });

    const headers = [
      'ID',
      'Name',
      'Phone',
      'Email',
      'City',
      'Wellness Goal',
      'Status',
      'Temperature',
      'Heat Score',
      'Source',
      'Campaign',
      'Assigned To',
      'Created At',
      'Last Contacted',
    ];

    const rows = leads.map((l) => [
      `"${l.id}"`,
      `"${l.name}"`,
      `"${l.phone}"`,
      `"${l.email || ''}"`,
      `"${l.city || ''}"`,
      `"${l.wellnessGoal || ''}"`,
      `"${l.status}"`,
      `"${l.temperature}"`,
      l.heatScore,
      `"${l.source}"`,
      `"${l.campaign?.name || ''}"`,
      `"${l.assignedTo?.name || 'Unassigned'}"`,
      `"${l.createdAt.toISOString()}"`,
      `"${l.lastContactedAt ? l.lastContactedAt.toISOString() : ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="wellwith_leads_${Date.now()}.csv"`);
    return res.send(csvContent);
  } catch (error: any) {
    console.error('Error exporting CSV:', error);
    return res.status(500).json({ error: 'Failed to export leads.' });
  }
});

/**
 * POST /api/leads/auto-assign (Auto assignment rules: Round-Robin or Load-based)
 */
router.post('/auto-assign', requireAuth, requireRoles('SUPER_ADMIN', 'CLIENT_ADMIN'), async (req: Request, res: Response) => {
  try {
    const scopedWs = getScopedWorkspaceId(req);
    const { rule = 'round-robin' } = req.body;

    // Get unassigned leads in workspace
    const unassignedLeads = await prisma.lead.findMany({
      where: {
        workspaceId: scopedWs || undefined,
        assignedToId: null,
      },
      take: 100,
    });

    if (unassignedLeads.length === 0) {
      return res.json({ message: 'No unassigned leads found.', assignedCount: 0 });
    }

    // Get active team members in workspace
    const teamMembers = await prisma.user.findMany({
      where: {
        workspaceId: scopedWs || undefined,
        role: 'TEAM_MEMBER',
        isActive: true,
      },
    });

    if (teamMembers.length === 0) {
      return res.status(400).json({ error: 'No active team members available in this workspace for assignment.' });
    }

    let assignedCount = 0;
    for (let i = 0; i < unassignedLeads.length; i++) {
      const targetUser = teamMembers[i % teamMembers.length];
      await prisma.lead.update({
        where: { id: unassignedLeads[i].id },
        data: { assignedToId: targetUser.id },
      });
      assignedCount++;
    }

    return res.json({
      success: true,
      rule,
      assignedCount,
      teamMembersCount: teamMembers.length,
    });
  } catch (error: any) {
    console.error('Error running auto-assign:', error);
    return res.status(500).json({ error: 'Failed to execute auto-assignment.' });
  }
});

export default router;
