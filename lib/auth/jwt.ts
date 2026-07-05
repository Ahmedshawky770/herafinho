import { jwtVerify, SignJWT } from 'jose';
import { logger } from '../logger/factory';

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'development-secret');

export async function signToken(payload: Record<string, unknown>, expiresIn = '24h'): Promise<string> {
  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(secret);
    return token;
  } catch (error) {
    logger.error({ error }, 'Failed to sign JWT');
    throw error;
  }
}

export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as Record<string, unknown>;
  } catch (error) {
    logger.warn({ error }, 'JWT verification failed');
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}