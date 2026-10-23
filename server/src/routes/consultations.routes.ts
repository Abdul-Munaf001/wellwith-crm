import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, buildLeadScopeFilter, getScopedWorkspaceId } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/consultations
 * List upcoming and past consultations
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const scopeFilter = buildLeadScopeFilter(req);
    const consultations = await prisma.consultation.findMany({
      where: {
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
            city: true,
          },
        },
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    const now = new Date();
    const scheduled = consultations.filter((c) => c.status === 'SCHEDULED' && new Date(c.scheduledAt) >= now);
    const past = consultations.filter((c) => c.status !== 'SCHEDULED' || new Date(c.scheduledAt) < now);

    return res.json({ consultations, scheduled, past });
  } catch (error: any) {
    console.error('Error fetching consultations:', error);
    return res.status(500).json({ error: 'Failed to retrieve consultations.' });
  }
});

/**
 * POST /api/consultations
 * Book a new consultation session
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { leadId, scheduledAt, notes, meetingLink } = req.body;
    if (!leadId || !scheduledAt) {
      return res.status(400).json({ error: 'leadId and scheduledAt are required.' });
    }

    const scopeFilter = buildLeadScopeFilter(req);
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, ...scopeFilter },
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found or permission denied.' });
    }

    const consultation = await prisma.consultation.create({
      data: {
        leadId: lead.id,
        workspaceId: lead.workspaceId,
        userId: req.user!.id,
        scheduledAt: new Date(scheduledAt),
        notes,
        meetingLink: meetingLink || 'https://meet.google.com/wel-with-doc',
        status: 'SCHEDULED',
      },
      include: {
        lead: true,
      },
    });

    // Update lead status to Consultation Booked
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: 'Consultation Booked',
        nextFollowupAt: new Date(scheduledAt),
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        workspaceId: lead.workspaceId,
        userId: req.user!.id,
        type: 'CONSULTATION',
        title: 'Consultation Booked',
        description: `Scheduled doctor consultation for ${new Date(scheduledAt).toLocaleString()}`,
      },
    });

    return res.status(201).json({ consultation });
  } catch (error: any) {
    console.error('Error booking consultation:', error);
    return res.status(500).json({ error: 'Failed to book consultation.' });
  }
});

/**
 * PUT /api/consultations/:id
 * Update status (COMPLETED, NO_SHOW, CANCELLED)
 */
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { status, notes } = req.body;
    const consultation = await prisma.consultation.findUnique({
      where: { id },
      include: { lead: true },
    });

    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found.' });
    }

    const updated = await prisma.consultation.update({
      where: { id },
      data: {
        status: status || consultation.status,
        notes: notes !== undefined ? notes : consultation.notes,
      },
    });

    if (status === 'COMPLETED') {
      await prisma.lead.update({
        where: { id: consultation.leadId },
        data: { status: 'Trial/Demo Attended' },
      });
    }

    return res.json({ consultation: updated });
  } catch (error: any) {
    console.error('Error updating consultation:', error);
    return res.status(500).json({ error: 'Failed to update consultation.' });
  }
});

export default router;
