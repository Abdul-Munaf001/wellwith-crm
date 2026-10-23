import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireRoles, requireSuperAdmin, getScopedWorkspaceId } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/settings/programs
 */
router.get('/programs', requireAuth, async (req: Request, res: Response) => {
  try {
    const scopedWs = getScopedWorkspaceId(req);
    const programs = await prisma.program.findMany({
      where: {
        workspaceId: scopedWs || undefined,
        isActive: true,
      },
      orderBy: { price: 'desc' },
    });

    return res.json({ programs });
  } catch (error: any) {
    console.error('Error fetching programs:', error);
    return res.status(500).json({ error: 'Failed to retrieve programs.' });
  }
});

/**
 * POST /api/settings/programs
 */
router.post('/programs', requireAuth, requireRoles('SUPER_ADMIN', 'CLIENT_ADMIN'), async (req: Request, res: Response) => {
  try {
    const scopedWs = getScopedWorkspaceId(req);
    const { name, category, price, durationDays, description, talkingPoints } = req.body;

    if (!name || !price || !durationDays) {
      return res.status(400).json({ error: 'Name, price, and durationDays are required.' });
    }

    const program = await prisma.program.create({
      data: {
        workspaceId: scopedWs || req.user!.workspaceId!,
        name,
        category: category || 'General Wellness',
        price: parseFloat(price),
        durationDays: parseInt(durationDays, 10),
        description,
        talkingPoints,
      },
    });

    return res.status(201).json({ program });
  } catch (error: any) {
    console.error('Error creating program:', error);
    return res.status(500).json({ error: 'Failed to create program.' });
  }
});

/**
 * GET /api/settings/feature-flags
 */
router.get('/feature-flags', requireAuth, async (req: Request, res: Response) => {
  try {
    const scopedWs = getScopedWorkspaceId(req);
    const flags = await prisma.featureFlag.findMany({
      where: { workspaceId: scopedWs || undefined },
    });

    return res.json({ flags });
  } catch (error: any) {
    console.error('Error fetching feature flags:', error);
    return res.status(500).json({ error: 'Failed to retrieve feature flags.' });
  }
});

/**
 * POST /api/settings/feature-flags/toggle (Super Admin only)
 */
router.post('/feature-flags/toggle', requireAuth, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { workspaceId, key, enabled } = req.body;
    if (!workspaceId || !key) {
      return res.status(400).json({ error: 'workspaceId and key are required.' });
    }

    const flag = await prisma.featureFlag.upsert({
      where: {
        workspaceId_key: {
          workspaceId,
          key,
        },
      },
      update: { enabled: !!enabled },
      create: {
        workspaceId,
        key,
        enabled: !!enabled,
        description: `Feature flag for ${key}`,
      },
    });

    // Log in audit trail
    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: req.user!.id,
        action: 'FEATURE_FLAG_TOGGLE',
        entity: 'FeatureFlag',
        details: `Toggled flag ${key} to ${enabled} in workspace ${workspaceId}`,
      },
    });

    return res.json({ flag });
  } catch (error: any) {
    console.error('Error toggling feature flag:', error);
    return res.status(500).json({ error: 'Failed to toggle feature flag.' });
  }
});

/**
 * GET /api/settings/audit-logs
 */
router.get('/audit-logs', requireAuth, requireRoles('SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const scopedWs = getScopedWorkspaceId(req);
    const logs = await prisma.auditLog.findMany({
      where: { workspaceId: scopedWs || undefined },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.json({ logs });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
});

/**
 * GET /api/settings/notifications
 */
router.get('/notifications', requireAuth, async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return res.json({ notifications, unreadCount });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

/**
 * PUT /api/settings/notifications/mark-read
 */
router.put('/notifications/mark-read', requireAuth, async (req: Request, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Error marking notifications as read:', error);
    return res.status(500).json({ error: 'Failed to update notifications.' });
  }
});

export default router;
