import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, IUser } from '../models/User';
import { UserRole } from '../types/roles';

export interface AuthRequest extends Request {
  user?: IUser;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : req.cookies?.token;

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Invalid user' });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

export function signToken(userId: string, role: UserRole): string {
  return jwt.sign({ id: userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}
