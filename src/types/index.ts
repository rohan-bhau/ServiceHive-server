import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  role: 'customer' | 'provider' | 'admin';
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}
