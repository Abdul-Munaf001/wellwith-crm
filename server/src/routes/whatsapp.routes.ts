import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, buildLeadScopeFilter, getScopedWorkspaceId } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/whatsapp/templates
 */
router.get('/templates', requireAuth, async (req: Request, res: Response) => {
  try {
    const scopedWs = getScopedWorkspaceId(req);
    const templates = await prisma.whatsappTemplate.findMany({
      where: {
        workspaceId: scopedWs || undefined,
        isActive: true,
      },
      orderBy: { category: 'asc' },
    });

    return res.json({ templates });
  } catch (error: any) {
    console.error('Error fetching WhatsApp templates:', error);
    return res.status(500).json({ error: 'Failed to retrieve WhatsApp templates.' });
  }
});

/**
 * POST /api/whatsapp/preview
 * Generate prefilled message and direct wa.me link
 */
router.post('/preview', requireAuth, async (req: Request, res: Response) => {
  try {
    const { templateId, leadId } = req.body;
    if (!templateId || !leadId) {
      return res.status(400).json({ error: 'templateId and leadId are required.' });
    }

    const scopeFilter = buildLeadScopeFilter(req);
    const [template, lead] = await Promise.all([
      prisma.whatsappTemplate.findUnique({ where: { id: templateId } }),
      prisma.lead.findFirst({ where: { id: leadId, ...scopeFilter } }),
    ]);

    if (!template || !lead) {
      return res.status(404).json({ error: 'Template or lead not found.' });
    }

    // Replace placeholders
    let message = template.bodyTemplate
      .replace(/{{name}}/g, lead.name)
      .replace(/{{goal}}/g, lead.wellnessGoal || 'your health & vitality goals')
      .replace(/{{preferred_time}}/g, lead.preferredCallTime || '7:00 PM')
      .replace(/{{program}}/g, '30-Day Metabolic Reset')
      .replace(/{{scheduled_time}}/g, 'tomorrow at 11:00 AM')
      .replace(/{{link}}/g, 'https://wellwith.in/assessment/intake');

    // Phone number digits only for wa.me
    const waPhone = (lead.whatsappNumber || lead.phone).replace(/\D/g, '');
    const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;

    return res.json({
      message,
      phone: lead.whatsappNumber || lead.phone,
      waUrl,
      templateName: template.name,
    });
  } catch (error: any) {
    console.error('Error previewing WhatsApp message:', error);
    return res.status(500).json({ error: 'Failed to preview message.' });
  }
});

/**
 * POST /api/whatsapp/log
 * Log outbound WhatsApp message activity
 */
router.post('/log', requireAuth, async (req: Request, res: Response) => {
  try {
    const { leadId, templateName, messagePreview } = req.body;
    const scopeFilter = buildLeadScopeFilter(req);

    const lead = await prisma.lead.findFirst({
      where: { id: leadId, ...scopeFilter },
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        workspaceId: lead.workspaceId,
        userId: req.user!.id,
        type: 'WHATSAPP',
        title: `WhatsApp Sent: ${templateName || 'Quick Message'}`,
        description: messagePreview || 'Prefilled WhatsApp message initiated.',
      },
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Error logging WhatsApp message:', error);
    return res.status(500).json({ error: 'Failed to log message.' });
  }
});

export default router;
