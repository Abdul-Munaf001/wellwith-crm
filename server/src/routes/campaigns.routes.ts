import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireRoles, getScopedWorkspaceId } from '../middleware/auth.js';
import { normalizePhone, calculateHeatScore } from '../utils/crm-helpers.js';

const router = Router();

/**
 * GET /api/campaigns
 * Ad campaign monitoring, CPL, conversions, revenue, ROAS, and Ad Quality Score
 */
router.get('/', requireAuth, requireRoles('SUPER_ADMIN', 'CLIENT_ADMIN'), async (req: Request, res: Response) => {
  try {
    const scopedWs = getScopedWorkspaceId(req);
    const where: any = {};
    if (scopedWs) where.workspaceId = scopedWs;

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        ads: true,
        leads: {
          select: {
            id: true,
            status: true,
            heatScore: true,
            enrollments: { select: { amountPaid: true } },
          },
        },
      },
      orderBy: { spend: 'desc' },
    });

    const enrichedCampaigns = campaigns.map((c) => {
      const totalLeads = c.leads.length;
      const contacted = c.leads.filter((l) => l.status !== 'New Enquiry').length;
      const interested = c.leads.filter((l) =>
        ['Wellness Assessment Done', 'Consultation Booked', 'Trial/Demo Attended'].includes(l.status)
      ).length;
      const converted = c.leads.filter((l) =>
        ['Program Enrolled', 'Active Member', 'Renewal Due'].includes(l.status)
      ).length;

      let totalRevenue = 0;
      c.leads.forEach((l) => {
        l.enrollments.forEach((e) => {
          totalRevenue += e.amountPaid;
        });
      });

      const cpl = totalLeads > 0 ? Math.round(c.spend / totalLeads) : 0;
      const conversionRate = totalLeads > 0 ? parseFloat(((converted / totalLeads) * 100).toFixed(1)) : 0;
      const roas = c.spend > 0 ? parseFloat((totalRevenue / c.spend).toFixed(2)) : 0;

      // Ad Quality Score (0 to 10): Compares lead-to-conversion rate and contact rate, not just volume
      const adQualityScore = Math.min(
        10,
        parseFloat(((conversionRate * 0.5 + (contacted / (totalLeads || 1)) * 5)).toFixed(1))
      );

      return {
        id: c.id,
        name: c.name,
        source: c.source,
        platform: c.platform,
        utmCampaign: c.utmCampaign,
        budget: c.budget,
        spend: c.spend,
        status: c.status,
        startDate: c.startDate,
        totalLeads,
        contacted,
        contactedPct: totalLeads > 0 ? Math.round((contacted / totalLeads) * 100) : 0,
        interested,
        converted,
        conversionRate,
        revenue: totalRevenue,
        cpl,
        roas,
        adQualityScore,
        ads: c.ads,
      };
    });

    return res.json({ campaigns: enrichedCampaigns });
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return res.status(500).json({ error: 'Failed to retrieve campaigns.' });
  }
});

/**
 * POST /api/campaigns
 * Create or update campaign
 */
router.post('/', requireAuth, requireRoles('SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const { name, source, platform, utmCampaign, budget, spend, startDate } = req.body;
    const scopedWs = getScopedWorkspaceId(req);

    if (!name || !source) {
      return res.status(400).json({ error: 'Name and source are required.' });
    }

    const campaign = await prisma.campaign.create({
      data: {
        workspaceId: scopedWs || req.body.workspaceId,
        name,
        source,
        platform,
        utmCampaign,
        budget: parseFloat(budget || 0),
        spend: parseFloat(spend || 0),
        startDate: startDate ? new Date(startDate) : new Date(),
      },
    });

    return res.status(201).json({ campaign });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return res.status(500).json({ error: 'Failed to create campaign.' });
  }
});

/**
 * POST /api/campaigns/spend
 * Manual ad spend entry
 */
router.post('/spend', requireAuth, requireRoles('SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const { campaignId, amount, date, impressions, clicks } = req.body;

    if (!campaignId || amount === undefined) {
      return res.status(400).json({ error: 'campaignId and amount are required.' });
    }

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }

    const spendRecord = await prisma.adSpend.create({
      data: {
        campaignId,
        date: date ? new Date(date) : new Date(),
        amount: parseFloat(amount),
        impressions: parseInt(impressions || 0, 10),
        clicks: parseInt(clicks || 0, 10),
      },
    });

    // Update cumulative spend in campaign
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { spend: { increment: parseFloat(amount) } },
    });

    return res.status(201).json({ spendRecord });
  } catch (error: any) {
    console.error('Error recording spend:', error);
    return res.status(500).json({ error: 'Failed to record ad spend.' });
  }
});

/**
 * PUBLIC WEBHOOK: Meta Lead Ads / Google Lead Forms
 * POST /api/webhooks/leads/:workspaceToken
 */
router.post('/webhooks/leads/:workspaceToken', async (req: Request, res: Response) => {
  try {
    const workspaceToken = String(req.params.workspaceToken);

    const workspace = await prisma.workspace.findUnique({
      where: { secretWebhookToken: workspaceToken },
    });

    if (!workspace) {
      return res.status(403).json({ error: 'Invalid webhook security token.' });
    }

    const {
      name,
      phone,
      email,
      wellness_goal,
      wellnessGoal,
      city,
      source = 'Meta',
      utm_campaign,
      utm_source,
      ad_set_name,
      ad_name,
    } = req.body;

    const rawName = name || 'Web Enquiry';
    const rawPhone = phone || req.body.phone_number || '';

    const { phone: normalizedPhone, isValid } = normalizePhone(rawPhone);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid phone format in webhook payload.' });
    }

    // Check duplicate
    const existing = await prisma.lead.findFirst({
      where: { workspaceId: workspace.id, phone: normalizedPhone },
    });

    if (existing) {
      // Create activity note about repeat submission
      await prisma.leadActivity.create({
        data: {
          leadId: existing.id,
          workspaceId: workspace.id,
          type: 'NOTE',
          title: 'Repeat Ad Submission',
          description: `Lead re-submitted form via ${source}. UTM: ${utm_campaign || 'N/A'}`,
        },
      });
      return res.json({ message: 'Lead already exists. Re-engagement logged.', leadId: existing.id });
    }

    // Match campaign if utm_campaign provided
    let matchedCampaign = null;
    if (utm_campaign) {
      matchedCampaign = await prisma.campaign.findFirst({
        where: { workspaceId: workspace.id, utmCampaign: utm_campaign },
      });
    }

    const goal = wellness_goal || wellnessGoal || 'General Wellness';
    const heatScore = calculateHeatScore({
      source,
      status: 'New Enquiry',
      createdAt: new Date(),
    });

    const newLead = await prisma.lead.create({
      data: {
        workspaceId: workspace.id,
        name: rawName,
        phone: normalizedPhone,
        whatsappNumber: normalizedPhone,
        email: email || null,
        city: city || null,
        wellnessGoal: goal,
        source: source || 'Meta',
        campaignId: matchedCampaign?.id || null,
        adSetName: ad_set_name || null,
        adName: ad_name || null,
        utmCampaign: utm_campaign || null,
        utmSource: utm_source || source.toLowerCase(),
        status: 'New Enquiry',
        temperature: heatScore > 80 ? 'Hot' : 'Warm',
        heatScore,
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: newLead.id,
        workspaceId: workspace.id,
        type: 'NOTE',
        title: 'Lead Ingested via Webhook',
        description: `Captured from ${source} Ad Form. Goal: ${goal}`,
      },
    });

    return res.status(201).json({ success: true, leadId: newLead.id });
  } catch (error: any) {
    console.error('Webhook ingestion error:', error);
    return res.status(500).json({ error: 'Webhook processing failed.' });
  }
});

/**
 * PUBLIC WEBSITE EMBED ENDPOINT
 * POST /api/leads/public/embed/:workspaceToken
 */
router.post('/public/embed/:workspaceToken', async (req: Request, res: Response) => {
  try {
    const workspaceToken = String(req.params.workspaceToken);
    const workspace = await prisma.workspace.findUnique({
      where: { secretWebhookToken: workspaceToken },
    });

    if (!workspace) {
      return res.status(403).json({ error: 'Invalid embed token.' });
    }

    const { name, phone, email, wellnessGoal, healthConcerns, preferredCallTime, city } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required.' });
    }

    const { phone: normalizedPhone, isValid } = normalizePhone(phone);
    if (!isValid) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
    }

    const lead = await prisma.lead.create({
      data: {
        workspaceId: workspace.id,
        name: name.trim(),
        phone: normalizedPhone,
        whatsappNumber: normalizedPhone,
        email: email ? email.trim() : null,
        wellnessGoal: wellnessGoal || 'Weight Loss',
        healthConcerns,
        preferredCallTime,
        city,
        source: 'Website',
        status: 'New Enquiry',
        temperature: 'Hot',
        heatScore: 88,
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        workspaceId: workspace.id,
        type: 'NOTE',
        title: 'Website Enquiry Form Submission',
        description: `Submitted consultation form on website. Goal: ${lead.wellnessGoal}`,
      },
    });

    return res.status(201).json({ success: true, message: 'Thank you! A wellness coach will reach out shortly.' });
  } catch (error: any) {
    console.error('Website embed lead error:', error);
    return res.status(500).json({ error: 'Failed to process lead.' });
  }
});

export default router;
