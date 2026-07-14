import type { JWT } from 'next-auth/jwt';
import { decode } from 'next-auth/jwt';
import { logger } from '../logger/factory';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret';

export async function verifyToken(token: string): Promise<JWT | null> {
  try {
    const payload = await decode({ token, secret: JWT_SECRET });
    return payload as JWT;
  } catch (error) {
    logger.error({ error }, 'Token verification failed');
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | null | undefined): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}