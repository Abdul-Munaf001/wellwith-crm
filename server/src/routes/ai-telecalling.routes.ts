import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireSuperAdmin, getScopedWorkspaceId } from '../middleware/auth.js';

const router = Router();

/**
 * Middleware: Verify Super Admin AND workspace feature flag 'ai_telecalling_enabled'
 */
const requireAiTelecallingPermission = async (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      error: 'Access denied. AI Telecalling is an internal module reserved for Super Admin.',
    });
  }

  const workspaceId = getScopedWorkspaceId(req) || req.user.workspaceId;
  if (!workspaceId) {
    return res.status(400).json({ error: 'Workspace ID required.' });
  }

  // Check feature flag
  const flag = await prisma.featureFlag.findUnique({
    where: {
      workspaceId_key: {
        workspaceId,
        key: 'ai_telecalling_enabled',
      },
    },
  });

  if (!flag || !flag.enabled) {
    return res.status(403).json({
      error: 'Feature flag "ai_telecalling_enabled" is disabled for this workspace.',
    });
  }

  next();
};

router.use(requireAuth);
router.use(requireAiTelecallingPermission);

/**
 * GET /api/ai-telecalling/campaigns
 */
router.get('/campaigns', async (req: Request, res: Response) => {
  try {
    const workspaceId = getScopedWorkspaceId(req) || req.user!.workspaceId!;
    const campaigns = await prisma.aiCallCampaign.findMany({
      where: { workspaceId },
      include: {
        script: true,
        _count: { select: { results: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ campaigns });
  } catch (error: any) {
    console.error('Error fetching AI campaigns:', error);
    return res.status(500).json({ error: 'Failed to retrieve AI campaigns.' });
  }
});

/**
 * POST /api/ai-telecalling/campaigns
 * Build new AI campaign and queue leads
 */
router.post('/campaigns', async (req: Request, res: Response) => {
  try {
    const workspaceId = getScopedWorkspaceId(req) || req.user!.workspaceId!;
    const { name, scriptId, callingHours = '10:00 - 18:30', segmentFilter = {} } = req.body;

    if (!name || !scriptId) {
      return res.status(400).json({ error: 'Campaign name and scriptId are required.' });
    }

    // Find eligible leads based on segment
    const filterWhere: any = { workspaceId };
    if (segmentFilter.status) filterWhere.status = segmentFilter.status;
    if (segmentFilter.source) filterWhere.source = segmentFilter.source;
    if (segmentFilter.wellnessGoal) filterWhere.wellnessGoal = segmentFilter.wellnessGoal;

    const leadsToQueue = await prisma.lead.findMany({
      where: filterWhere,
      take: 20,
    });

    const campaign = await prisma.aiCallCampaign.create({
      data: {
        workspaceId,
        name,
        scriptId,
        callingHours,
        segmentFilter: JSON.stringify(segmentFilter),
        status: 'QUEUED',
        totalQueued: leadsToQueue.length,
        totalCalled: 0,
      },
    });

    // Populate AI Call Results queue
    for (const lead of leadsToQueue) {
      await prisma.aiCallResult.create({
        data: {
          campaignId: campaign.id,
          leadId: lead.id,
          workspaceId,
          status: 'QUEUED',
        },
      });
    }

    return res.status(201).json({ campaign, queuedLeadsCount: leadsToQueue.length });
  } catch (error: any) {
    console.error('Error creating AI campaign:', error);
    return res.status(500).json({ error: 'Failed to create AI campaign.' });
  }
});

/**
 * GET /api/ai-telecalling/scripts
 */
router.get('/scripts', async (req: Request, res: Response) => {
  try {
    const workspaceId = getScopedWorkspaceId(req) || req.user!.workspaceId!;
    const scripts = await prisma.aiCallScript.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ scripts });
  } catch (error: any) {
    console.error('Error fetching AI scripts:', error);
    return res.status(500).json({ error: 'Failed to retrieve AI scripts.' });
  }
});

/**
 * POST /api/ai-telecalling/scripts
 */
router.post('/scripts', async (req: Request, res: Response) => {
  try {
    const workspaceId = getScopedWorkspaceId(req) || req.user!.workspaceId!;
    const { name, language = 'English', greeting, qualificationQuestions, objectionHandling, closing } = req.body;

    if (!name || !greeting || !closing) {
      return res.status(400).json({ error: 'Name, greeting, and closing are required.' });
    }

    const script = await prisma.aiCallScript.create({
      data: {
        workspaceId,
        name,
        language,
        greeting,
        qualificationQuestions: typeof qualificationQuestions === 'string' ? qualificationQuestions : JSON.stringify(qualificationQuestions || []),
        objectionHandling: typeof objectionHandling === 'string' ? objectionHandling : JSON.stringify(objectionHandling || {}),
        closing,
      },
    });

    return res.status(201).json({ script });
  } catch (error: any) {
    console.error('Error creating script:', error);
    return res.status(500).json({ error: 'Failed to create AI script.' });
  }
});

/**
 * GET /api/ai-telecalling/queue
 */
router.get('/queue', async (req: Request, res: Response) => {
  try {
    const workspaceId = getScopedWorkspaceId(req) || req.user!.workspaceId!;
    const { campaignId } = req.query;

    const where: any = { workspaceId };
    if (campaignId) where.campaignId = campaignId;

    const results = await prisma.aiCallResult.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,
            wellnessGoal: true,
            status: true,
            city: true,
          },
        },
        campaign: { select: { id: true, name: true } },
      },
      orderBy: { calledAt: 'desc' },
      take: 50,
    });

    return res.json({ results });
  } catch (error: any) {
    console.error('Error fetching AI queue:', error);
    return res.status(500).json({ error: 'Failed to retrieve AI call queue.' });
  }
});

/**
 * POST /api/ai-telecalling/simulate-run
 * Provider adapter interface execution
 * Runs mock AI calls for queued items and updates lead status & timeline
 */
router.post('/simulate-run', async (req: Request, res: Response) => {
  try {
    const workspaceId = getScopedWorkspaceId(req) || req.user!.workspaceId!;
    const { campaignId } = req.body;

    const queuedItems = await prisma.aiCallResult.findMany({
      where: {
        workspaceId,
        status: 'QUEUED',
        ...(campaignId ? { campaignId } : {}),
      },
      include: { lead: true, campaign: { include: { script: true } } },
      take: 5,
    });

    if (queuedItems.length === 0) {
      return res.json({ message: 'No queued items found to call.', completedCount: 0 });
    }

    const intents = ['Interested', 'Call Back Later', 'Interested', 'Not Interested'];
    const sentiments = ['Positive', 'Neutral', 'Positive', 'Hesitant'];

    let completed = 0;
    for (let i = 0; i < queuedItems.length; i++) {
      const item = queuedItems[i];
      const detectedIntent = intents[i % intents.length];
      const sentiment = sentiments[i % sentiments.length];
      const duration = 45 + Math.floor(Math.random() * 90);

      const transcript = `Maya (AI): Hi, am I speaking with ${item.lead.name}? This is Maya from WELLWITH following up on your ${item.lead.wellnessGoal} enquiry.\nLead: Yes, hello! Tell me more.\nMaya (AI): Would you be interested in our doctor-supervised 30-day program?\nLead: ${detectedIntent === 'Interested' ? 'Yes, definitely interested. Let us book a consultation.' : 'I am busy right now, please call me tomorrow.'}\nMaya (AI): Thank you so much! We have noted your preference.`;

      // Update AI Result
      await prisma.aiCallResult.update({
        where: { id: item.id },
        data: {
          status: 'COMPLETED',
          transcript,
          detectedIntent,
          sentiment,
          durationSeconds: duration,
          calledAt: new Date(),
        },
      });

      // Update Lead Status
      const nextStatus = detectedIntent === 'Interested' ? 'Wellness Assessment Done' : 'Contacted';
      await prisma.lead.update({
        where: { id: item.lead.id },
        data: {
          status: nextStatus,
          lastContactedAt: new Date(),
          heatScore: detectedIntent === 'Interested' ? 88 : 55,
        },
      });

      // Add to Lead Activity Timeline
      await prisma.leadActivity.create({
        data: {
          leadId: item.lead.id,
          workspaceId,
          type: 'CALL',
          title: `AI Outreach Completed (${detectedIntent})`,
          description: `AI Telecaller Maya completed call. Sentiment: ${sentiment}, Intent: ${detectedIntent}. Duration: ${duration}s.`,
        },
      });

      completed++;
    }

    // Update campaign progress
    if (campaignId) {
      await prisma.aiCallCampaign.update({
        where: { id: campaignId },
        data: { totalCalled: { increment: completed }, status: 'IN_PROGRESS' },
      });
    }

    return res.json({ success: true, processedCount: completed });
  } catch (error: any) {
    console.error('Error simulating AI call run:', error);
    return res.status(500).json({ error: 'Failed to run AI call simulator.' });
  }
});

export default router;
