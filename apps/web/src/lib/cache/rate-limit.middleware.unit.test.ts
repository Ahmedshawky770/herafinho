import { describe, it, expect, vi, beforeEach } from 'vitest';

import { rateLimitMiddleware } from './rate-limit.middleware';

describe('rateLimitMiddleware', () => {
  let mockRateLimitService: any;
  let middleware: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimitService = {
      check: vi.fn(),
    };
  });

  it('should allow request when rate limit not exceeded', async () => {
    mockRateLimitService.check.mockResolvedValue({ allowed: true, remaining: 5, resetAt: Date.now() + 1000 });
    middleware = rateLimitMiddleware(mockRateLimitService, { windowMs: 1000, max: 10 });

    const request = {
      headers: new Headers({
        'x-forwarded-for': '192.168.1.1',
      }),
    };

    const response = await middleware(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('5');
  });

  it('should return 429 when rate limit exceeded', async () => {
    mockRateLimitService.check.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 1000 });
    middleware = rateLimitMiddleware(mockRateLimitService, { windowMs: 1000, max: 10 });

    const request = {
      headers: new Headers({
        'x-forwarded-for': '192.168.1.1',
      }),
    };

    const response = await middleware(request);
    expect(response.status).toBe(429);
  });

  it('should use x-real-ip when x-forwarded-for is missing', async () => {
    mockRateLimitService.check.mockResolvedValue({ allowed: true, remaining: 5, resetAt: Date.now() + 1000 });
    middleware = rateLimitMiddleware(mockRateLimitService, { windowMs: 1000, max: 10 });

    const request = {
      headers: new Headers({
        'x-real-ip': '10.0.0.1',
      }),
    };

    await middleware(request);
    expect(mockRateLimitService.check).toHaveBeenCalledWith(
      'rate_limit:10.0.0.1',
      { windowMs: 1000, max: 10 }
    );
  });

  it('should use anonymous when no ip headers', async () => {
    mockRateLimitService.check.mockResolvedValue({ allowed: true, remaining: 5, resetAt: Date.now() + 1000 });
    middleware = rateLimitMiddleware(mockRateLimitService, { windowMs: 1000, max: 10 });

    const request = {
      headers: new Headers(),
    };

    await middleware(request);
    expect(mockRateLimitService.check).toHaveBeenCalledWith(
      'rate_limit:anonymous',
      { windowMs: 1000, max: 10 }
    );
  });

  it('should set X-RateLimit-Reset header', async () => {
    const resetAt = Date.now() + 1000;
    mockRateLimitService.check.mockResolvedValue({ allowed: true, remaining: 5, resetAt });
    middleware = rateLimitMiddleware(mockRateLimitService, { windowMs: 1000, max: 10 });

    const request = {
      headers: new Headers({
        'x-forwarded-for': '192.168.1.1',
      }),
    };

    const response = await middleware(request);
    expect(response.headers.get('X-RateLimit-Reset')).toBe(String(resetAt));
  });
});
