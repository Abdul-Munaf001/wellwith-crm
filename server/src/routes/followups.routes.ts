import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, buildLeadScopeFilter, getScopedWorkspaceId } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/followups
 * List follow-ups grouped by overdue, due today, and upcoming
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const scopeFilter = buildLeadScopeFilter(req);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const followUps = await prisma.followUp.findMany({
      where: {
        status: { in: ['PENDING', 'SNOOZED'] },
        lead: scopeFilter,
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,
            whatsappNumber: true,
            wellnessGoal: true,
            status: true,
            temperature: true,
            heatScore: true,
          },
        },
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const overdue = followUps.filter((f) => new Date(f.dueDate) < startOfToday);
    const dueToday = followUps.filter((f) => {
      const d = new Date(f.dueDate);
      return d >= startOfToday && d <= endOfToday;
    });
    const upcoming = followUps.filter((f) => new Date(f.dueDate) > endOfToday);

    return res.json({
      all: followUps,
      overdue,
      dueToday,
      upcoming,
      counts: {
        totalPending: followUps.length,
        overdue: overdue.length,
        dueToday: dueToday.length,
        upcoming: upcoming.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching follow-ups:', error);
    return res.status(500).json({ error: 'Failed to retrieve follow-ups.' });
  }
});

/**
 * POST /api/followups
 * Create a new follow-up task
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { leadId, title, notes, dueDate, priority = 'MEDIUM' } = req.body;
    if (!leadId || !dueDate) {
      return res.status(400).json({ error: 'leadId and dueDate are required.' });
    }

    const scopeFilter = buildLeadScopeFilter(req);
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, ...scopeFilter },
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found or permission denied.' });
    }

    const followUp = await prisma.followUp.create({
      data: {
        leadId: lead.id,
        workspaceId: lead.workspaceId,
        userId: req.user!.id,
        title: title || `Follow up with ${lead.name}`,
        notes,
        dueDate: new Date(dueDate),
        priority,
      },
      include: {
        lead: { select: { id: true, name: true, phone: true } },
      },
    });

    // Update lead's nextFollowupAt
    await prisma.lead.update({
      where: { id: lead.id },
      data: { nextFollowupAt: new Date(dueDate) },
    });

    return res.status(201).json({ followUp });
  } catch (error: any) {
    console.error('Error creating follow-up:', error);
    return res.status(500).json({ error: 'Failed to create follow-up.' });
  }
});

/**
 * PUT /api/followups/:id/status
 * Complete or cancel follow-up
 */
router.put('/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { status } = req.body; // "COMPLETED" | "CANCELLED"
    const followUp = await prisma.followUp.findUnique({
      where: { id },
      include: { lead: true },
    });

    if (!followUp) {
      return res.status(404).json({ error: 'Follow-up not found.' });
    }

    const updated = await prisma.followUp.update({
      where: { id },
      data: { status },
    });

    return res.json({ followUp: updated });
  } catch (error: any) {
    console.error('Error updating follow-up status:', error);
    return res.status(500).json({ error: 'Failed to update follow-up.' });
  }
});

/**
 * PUT /api/followups/:id/snooze
 * Reschedule/snooze follow-up
 */
router.put('/:id/snooze', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { newDueDate } = req.body;
    if (!newDueDate) {
      return res.status(400).json({ error: 'newDueDate is required.' });
    }

    const updated = await prisma.followUp.update({
      where: { id },
      data: {
        dueDate: new Date(newDueDate),
        status: 'SNOOZED',
      },
    });

    await prisma.lead.update({
      where: { id: updated.leadId },
      data: { nextFollowupAt: new Date(newDueDate) },
    });

    return res.json({ followUp: updated, message: 'Follow-up rescheduled.' });
  } catch (error: any) {
    console.error('Error snoozing follow-up:', error);
    return res.status(500).json({ error: 'Failed to snooze follow-up.' });
  }
});

export default router;
