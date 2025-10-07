// api/src/utils/jwt.ts
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return secret;
}

export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: ACCESS_TOKEN_EXPIRY });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: REFRESH_TOKEN_EXPIRY });
};

export const verifyRefreshToken = (token: string): string => {
  const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };
  return decoded.userId;
};
