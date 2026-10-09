import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { getRepo } from '../repo';
import { loginSchema, registerSchema } from '../validators/schemas';
import { badRequest, conflict, unauthorized } from '../utils/errors';
import { signToken } from '../middleware/auth';
import { UserRecord } from '../types';

export function publicUser(user: UserRecord) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const input = registerSchema.parse(req.body);
    const repo = getRepo();

    const existing = await repo.findUserByEmail(input.email);
    if (existing) throw conflict('An account with this email already exists. Please log in instead.');

    const passwordHash = await bcrypt.hash(input.password, 10);
    // Role is always "citizen": public registration can never create an administrator.
    const user = await repo.createUser({ ...input, passwordHash, role: 'citizen' });

    const token = signToken({ id: user.id, role: user.role });
    res.status(201).json({ token, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const repo = getRepo();

    const user = await repo.findUserByEmail(input.email);
    if (!user) throw unauthorized('Invalid email or password');

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw unauthorized('Invalid email or password');

    const token = signToken({ id: user.id, role: user.role });
    res.json({ token, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw unauthorized();
    const user = await getRepo().findUserById(req.user.id);
    if (!user) throw unauthorized('Account no longer exists');
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
}

export function badRequestBody(error: unknown): never {
  throw badRequest('Invalid request body', error);
}
