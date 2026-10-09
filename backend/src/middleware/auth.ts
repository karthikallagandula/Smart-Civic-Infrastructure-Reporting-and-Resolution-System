import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import { getRepo } from '../repo';
import { forbidden, unauthorized } from '../utils/errors';
import { Role } from '../types';

export interface AuthUser {
  id: string;
  role: Role;
  name: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: { id: string; role: Role }): string {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw unauthorized('Authentication required');

    let payload: { sub?: string };
    try {
      payload = jwt.verify(token, env.jwtSecret) as { sub?: string };
    } catch {
      throw unauthorized('Your session is invalid or has expired. Please log in again.');
    }
    if (!payload.sub) throw unauthorized('Invalid session');

    // Always re-read the user from the database: never trust role claims from the client.
    const user = await getRepo().findUserById(payload.sub);
    if (!user) throw unauthorized('Account no longer exists');

    req.user = { id: user.id, role: user.role, name: user.name, email: user.email };
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(forbidden('Administrator access is required for this action'));
    }
    next();
  };
}
