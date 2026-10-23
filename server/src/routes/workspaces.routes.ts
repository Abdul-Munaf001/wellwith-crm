import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/workspaces
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (req.user!.role === 'SUPER_ADMIN') {
      const workspaces = await prisma.workspace.findMany({
        include: {
          featureFlags: true,
          _count: { select: { leads: true, users: true, campaigns: true } },
        },
        orderBy: { name: 'asc' },
      });
      return res.json({ workspaces });
    }

    // Client Admin or Team Member gets only their assigned workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.user!.workspaceId || '' },
      include: {
        featureFlags: true,
        _count: { select: { leads: true, users: true } },
      },
    });

    return res.json({ workspaces: workspace ? [workspace] : [] });
  } catch (error: any) {
    console.error('Error fetching workspaces:', error);
    return res.status(500).json({ error: 'Failed to retrieve workspaces.' });
  }
});

/**
 * POST /api/workspaces (Super Admin only)
 */
router.post('/', requireAuth, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { name, slug, logoUrl, customTheme = '#16A34A', enableAiTelecalling = false } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ error: 'Workspace name and slug are required.' });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug: cleanSlug,
        logoUrl,
        customTheme,
        featureFlags: {
          create: [
            {
              key: 'ai_telecalling_enabled',
              enabled: !!enableAiTelecalling,
              description: 'AI Telecalling module access',
            },
          ],
        },
      },
      include: { featureFlags: true },
    });

    return res.status(201).json({ workspace });
  } catch (error: any) {
    console.error('Error creating workspace:', error);
    return res.status(500).json({ error: 'Failed to create workspace. Slug may already be taken.' });
  }
});

/**
 * PUT /api/workspaces/:id
 */
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    // Client Admin can only update their own workspace
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.workspaceId !== id) {
      return res.status(403).json({ error: 'Permission denied.' });
    }

    const { name, logoUrl, customTheme } = req.body;
    const updated = await prisma.workspace.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(logoUrl !== undefined ? { logoUrl } : {}),
        ...(customTheme ? { customTheme } : {}),
      },
    });

    return res.json({ workspace: updated });
  } catch (error: any) {
    console.error('Error updating workspace:', error);
    return res.status(500).json({ error: 'Failed to update workspace.' });
  }
});

export default router;
