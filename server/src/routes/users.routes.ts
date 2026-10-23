import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { requireAuth, requireRoles, getScopedWorkspaceId } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/users
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const scopedWs = getScopedWorkspaceId(req);
    const where: any = {};
    if (scopedWs) where.workspaceId = scopedWs;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        workspaceId: true,
        workspace: { select: { id: true, name: true } },
        _count: { select: { leads: true, callLogs: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ users });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

/**
 * POST /api/users (Create new user)
 */
router.post('/', requireAuth, requireRoles('SUPER_ADMIN', 'CLIENT_ADMIN'), async (req: Request, res: Response) => {
  try {
    const { email, password, name, role = 'TEAM_MEMBER', phone, workspaceId } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    const targetWs = req.user!.role === 'SUPER_ADMIN' ? workspaceId || req.user!.workspaceId : req.user!.workspaceId;

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name,
        role,
        phone,
        workspaceId: targetWs,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        workspaceId: true,
      },
    });

    return res.status(201).json({ user });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Failed to create user.' });
  }
});

/**
 * PUT /api/users/:id (Edit user / Deactivate / Reset Password)
 */
router.put('/:id', requireAuth, requireRoles('SUPER_ADMIN', 'CLIENT_ADMIN'), async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { name, phone, role, isActive, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Client Admin can only edit users within their workspace
    if (req.user!.role === 'CLIENT_ADMIN' && existing.workspaceId !== req.user!.workspaceId) {
      return res.status(403).json({ error: 'Permission denied.' });
    }

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name;
    if (phone !== undefined) dataToUpdate.phone = phone;
    if (role && req.user!.role === 'SUPER_ADMIN') dataToUpdate.role = role;
    if (isActive !== undefined) dataToUpdate.isActive = !!isActive;
    if (password) dataToUpdate.passwordHash = await bcrypt.hash(password, 10);

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
      },
    });

    return res.json({ user: updated });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Failed to update user.' });
  }
});

export default router;
