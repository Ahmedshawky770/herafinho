import { NextResponse } from 'next/server';
import type { RateLimitConfig, RateLimitService } from './rate-limit.service';

export function rateLimitMiddleware(rateLimitService: RateLimitService, config: RateLimitConfig) {
  return async (request: { headers: Headers }) => {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    const key = `rate_limit:${ip}`;
    const result = await rateLimitService.check(key, config);

    if (!result.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(result.resetAt));
    return response;
  };
}