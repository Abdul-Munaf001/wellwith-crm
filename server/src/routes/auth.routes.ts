import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'wellwith_super_secret_jwt_key_2026_wellness_crm';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        workspace: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        workspaceId: user.workspaceId,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    // If Super Admin, fetch all workspaces for switcher
    let workspaces: any[] = [];
    if (user.role === 'SUPER_ADMIN') {
      workspaces = await prisma.workspace.findMany({
        orderBy: { name: 'asc' },
        include: {
          featureFlags: true,
        },
      });
    } else if (user.workspace) {
      workspaces = [user.workspace];
    }

    // Log login activity
    await prisma.auditLog.create({
      data: {
        workspaceId: user.workspaceId,
        userId: user.id,
        action: 'USER_LOGIN',
        entity: 'User',
        entityId: user.id,
        details: `Successful login by ${user.email} (${user.role})`,
        ipAddress: req.ip || '127.0.0.1',
      },
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        workspaceId: user.workspaceId,
        workspace: user.workspace,
      },
      workspaces,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        workspace: {
          include: {
            featureFlags: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let workspaces: any[] = [];
    if (user.role === 'SUPER_ADMIN') {
      workspaces = await prisma.workspace.findMany({
        orderBy: { name: 'asc' },
        include: {
          featureFlags: true,
        },
      });
    } else if (user.workspace) {
      workspaces = [user.workspace];
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        workspaceId: user.workspaceId,
        workspace: user.workspace,
      },
      workspaces,
    });
  } catch (error: any) {
    console.error('Auth check error:', error);
    return res.status(500).json({ error: 'Failed to fetch current user.' });
  }
});

export default router;
