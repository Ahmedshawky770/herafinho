import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth/jwt', () => ({
  decode: vi.fn(),
}));

vi.mock('@herafino/shared/logger/factory', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
  },
}));

import { verifyToken, extractTokenFromHeader } from './verify-token';
import { decode } from 'next-auth/jwt';

describe('verifyToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should decode and return token on success', async () => {
    (decode as ReturnType<typeof vi.fn>).mockResolvedValue({ sub: 'user-1', role: 'client' });

    const result = await verifyToken('valid-token');
    expect(result).toEqual({ sub: 'user-1', role: 'client' });
  });

  it('should return null on decode error', async () => {
    (decode as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Invalid token'));

    const result = await verifyToken('invalid-token');
    expect(result).toBeNull();
  });

  it('should handle empty token', async () => {
    (decode as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await verifyToken('');
    expect(result).toBeNull();
  });

  it('should log error on decode failure', async () => {
    const { logger } = await import('@herafino/shared/logger/factory');
    (decode as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Invalid token'));

    await verifyToken('invalid-token');
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('extractTokenFromHeader', () => {
  it('should return null when header is null', () => {
    expect(extractTokenFromHeader(null)).toBeNull();
  });

  it('should return null when header is undefined', () => {
    expect(extractTokenFromHeader(undefined)).toBeNull();
  });

  it('should extract token from Bearer header', () => {
    expect(extractTokenFromHeader('Bearer abc.def.ghi')).toBe('abc.def.ghi');
  });

  it('should be case-insensitive for Bearer', () => {
    expect(extractTokenFromHeader('bearer abc.def.ghi')).toBe('abc.def.ghi');
  });

  it('should return null for invalid header format', () => {
    expect(extractTokenFromHeader('Token abc')).toBeNull();
  });

  it('should handle header with extra spaces', () => {
    expect(extractTokenFromHeader('Bearer   abc.def.ghi')).toBe('abc.def.ghi');
  });

  it('should return null for empty string header', () => {
    expect(extractTokenFromHeader('')).toBeNull();
  });
});
