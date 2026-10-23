import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, buildLeadScopeFilter, getScopedWorkspaceId } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/enrollments
 * Active member enrollments, renewal due alerts, and win-back list
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const scopeFilter = buildLeadScopeFilter(req);
    const enrollments = await prisma.enrollment.findMany({
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
            email: true,
            wellnessGoal: true,
            status: true,
            assignedTo: { select: { id: true, name: true } },
          },
        },
        program: true,
      },
      orderBy: { endDate: 'asc' },
    });

    const now = new Date();
    const sevenDaysFromNow = new Date(Date.now() + 7 * 86400000);

    const activeMembers = enrollments.filter((e) => e.status === 'ACTIVE' && new Date(e.endDate) > sevenDaysFromNow);
    const renewalDue = enrollments.filter(
      (e) => e.status === 'RENEWAL_DUE' || (new Date(e.endDate) <= sevenDaysFromNow && new Date(e.endDate) >= now)
    );
    const winBackLapsed = enrollments.filter(
      (e) => e.status === 'LAPSED' || (new Date(e.endDate) < now && e.status !== 'RENEWAL_DUE')
    );

    return res.json({
      all: enrollments,
      activeMembers,
      renewalDue,
      winBackLapsed,
      counts: {
        totalActive: activeMembers.length,
        renewalDue: renewalDue.length,
        winBack: winBackLapsed.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching enrollments:', error);
    return res.status(500).json({ error: 'Failed to retrieve enrollments.' });
  }
});

/**
 * POST /api/enrollments
 * Enroll a lead into a wellness program
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { leadId, programId, amountPaid, startDate } = req.body;
    if (!leadId || !programId) {
      return res.status(400).json({ error: 'leadId and programId are required.' });
    }

    const scopeFilter = buildLeadScopeFilter(req);
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, ...scopeFilter },
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found or permission denied.' });
    }

    const program = await prisma.program.findUnique({ where: { id: programId } });
    if (!program) {
      return res.status(404).json({ error: 'Program not found.' });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start.getTime() + program.durationDays * 86400000);

    const enrollment = await prisma.enrollment.create({
      data: {
        leadId: lead.id,
        workspaceId: lead.workspaceId,
        programId: program.id,
        amountPaid: parseFloat(amountPaid || program.price),
        startDate: start,
        endDate: end,
        status: 'ACTIVE',
      },
      include: {
        program: true,
        lead: true,
      },
    });

    // Update lead status to Program Enrolled and Hot 95+
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: 'Program Enrolled',
        temperature: 'Hot',
        heatScore: 95,
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        workspaceId: lead.workspaceId,
        userId: req.user!.id,
        type: 'ENROLLMENT',
        title: 'Program Enrollment Confirmed',
        description: `Enrolled into "${program.name}" for ₹${enrollment.amountPaid}. Valid until ${end.toLocaleDateString()}.`,
      },
    });

    return res.status(201).json({ enrollment });
  } catch (error: any) {
    console.error('Error creating enrollment:', error);
    return res.status(500).json({ error: 'Failed to create enrollment.' });
  }
});

/**
 * POST /api/enrollments/:id/renew
 * Process renewal for a member
 */
router.post('/:id/renew', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { additionalDays = 30, amountPaid } = req.body;
    const existing: any = await prisma.enrollment.findUnique({
      where: { id },
      include: { program: true, lead: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Enrollment not found.' });
    }

    const newEnd = new Date(existing.endDate.getTime() + additionalDays * 86400000);

    const updated = await prisma.enrollment.update({
      where: { id: existing.id },
      data: {
        endDate: newEnd,
        status: 'ACTIVE',
        amountPaid: { increment: parseFloat(amountPaid || String(existing.program?.price || 0)) },
      },
    });

    await prisma.lead.update({
      where: { id: existing.leadId },
      data: { status: 'Active Member', heatScore: 98 },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: existing.leadId,
        workspaceId: existing.workspaceId,
        userId: req.user!.id,
        type: 'ENROLLMENT',
        title: 'Membership Renewed 🎉',
        description: `Extended program "${existing.program.name}" by ${additionalDays} days. New end date: ${newEnd.toLocaleDateString()}`,
      },
    });

    return res.json({ enrollment: updated, message: 'Membership renewed successfully!' });
  } catch (error: any) {
    console.error('Error renewing enrollment:', error);
    return res.status(500).json({ error: 'Failed to renew enrollment.' });
  }
});

export default router;
