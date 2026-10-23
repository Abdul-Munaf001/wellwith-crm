import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'TEAM_MEMBER' | 'CLIENT_ADMIN';
  workspaceId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      viewAsUserId?: string;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'wellwith_super_secret_jwt_key_2026_wellness_crm';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        workspaceId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User account not found or deactivated.' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      workspaceId: user.workspaceId,
    };

    // Support Admin "View as user" mode
    if (user.role === 'SUPER_ADMIN' && req.headers['x-view-as-user']) {
      req.viewAsUserId = req.headers['x-view-as-user'] as string;
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const requireRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
      });
    }
    next();
  };
};

export const requireSuperAdmin = requireRoles('SUPER_ADMIN');

/**
 * Builds the strict query filter for Leads, CallLogs, etc.
 * Enforces server-side RBAC and data isolation.
 */
export const getScopedWorkspaceId = (req: Request): string | null => {
  if (!req.user) return null;
  if (req.user.role === 'SUPER_ADMIN') {
    // If super admin specified a workspace in query or header, use it; otherwise null means all
    const reqWs = (req.query.workspaceId as string) || (req.headers['x-workspace-id'] as string);
    return reqWs && reqWs !== 'all' ? reqWs : null;
  }
  // Client admin and Team members are STRICTLY locked to their assigned workspace
  return req.user.workspaceId;
};

/**
 * Lead query scoping helper:
 * - Super admin: sees all or filtered by workspace / viewAsUserId
 * - Client admin: sees all leads within their workspace
 * - Team member: sees ONLY leads where assignedToId = user.id within their workspace
 */
export const buildLeadScopeFilter = (req: Request) => {
  const user = req.user!;
  const filter: any = {};

  const scopedWs = getScopedWorkspaceId(req);
  if (scopedWs) {
    filter.workspaceId = scopedWs;
  }

  if (user.role === 'TEAM_MEMBER') {
    // STRICT: Telecallers can only see their own assigned leads
    filter.assignedToId = user.id;
  } else if (user.role === 'SUPER_ADMIN' && req.viewAsUserId) {
    // Super admin viewing as user
    filter.assignedToId = req.viewAsUserId;
  }

  return filter;
};
