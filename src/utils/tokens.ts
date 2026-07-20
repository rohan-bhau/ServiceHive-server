import jwt, { SignOptions } from 'jsonwebtoken';
import { JwtPayload } from '../types';

export const generateAccessToken = (payload: JwtPayload): string => {
  const options: SignOptions = { expiresIn: (process.env.JWT_ACCESS_EXPIRY || '15m') as any };
  return jwt.sign(payload, process.env.JWT_SECRET!, options);
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  const options: SignOptions = { expiresIn: (process.env.JWT_REFRESH_EXPIRY || '7d') as any };
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, options);
};

export const setTokenCookies = (res: any, accessToken: string, refreshToken: string) => {
  const accessMaxAge = parseDuration(process.env.JWT_ACCESS_EXPIRY || '10d');
  const refreshMaxAge = parseDuration(process.env.JWT_REFRESH_EXPIRY || '30d');
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: accessMaxAge,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: refreshMaxAge,
  });
};

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([dhms])$/);
  if (!match) return 10 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1]);
  switch (match[2]) {
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'm': return value * 60 * 1000;
    case 's': return value * 1000;
    default: return 10 * 24 * 60 * 60 * 1000;
  }
}

export const clearTokenCookies = (res: any) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};
