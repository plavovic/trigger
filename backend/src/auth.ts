import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { RequestHandler, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { prisma } from './db';
import { ApiError } from './errors';
import { config, cookieName, cookieOptions } from './config';

export const publicUser = { id: true, email: true, firstName: true, lastName: true, role: true } as const;
export type SafeUser = { id: string; email: string; firstName: string; lastName: string; role: Role };
declare module 'express-serve-static-core' { interface Request { user?: SafeUser } }
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export async function createSession(userId: string, res: Response) {
  const token = randomBytes(32).toString('hex');
  const maxAge = config.SESSION_DAYS * 86400000;
  await prisma.session.deleteMany({ where: { userId, expiresAt: { lt: new Date() } } });
  await prisma.session.create({ data: { userId, tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + maxAge) } });
  res.cookie(cookieName, token, { ...cookieOptions, maxAge });
}
export async function revokeSession(req: Request) {
  const token = req.cookies?.[cookieName];
  if (typeof token === 'string') await prisma.session.deleteMany({ where: { tokenHash: tokenHash(token) } });
}
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = req.cookies?.[cookieName];
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw new ApiError(401, 'Authentication required');
  const session = await prisma.session.findUnique({ where: { tokenHash: tokenHash(token) }, include: { user: { select: publicUser } } });
  if (!session || session.expiresAt <= new Date()) throw new ApiError(401, 'Authentication required');
  req.user = session.user;
  next();
};
export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== 'ADMIN') throw new ApiError(403, 'Administrator access required');
  next();
};
// Same bcrypt cost for unknown accounts avoids a fast account-existence signal.
export const dummyPasswordHash = bcrypt.hashSync(randomBytes(32).toString('hex'), 12);
