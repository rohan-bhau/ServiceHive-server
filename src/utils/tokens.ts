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
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearTokenCookies = (res: any) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};
