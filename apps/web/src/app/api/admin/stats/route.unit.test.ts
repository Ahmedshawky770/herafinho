import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRequireAdmin } = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
}));

vi.mock('@/app/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/auth/require-admin', () => ({
  requireAdmin: mockRequireAdmin,
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

vi.mock('@/lib/http/error-handler', () => ({
  createErrorResponse: vi.fn((error: unknown) => {
    if (error instanceof Error) {
      const err = error as any;
      const status = err.statusCode || 500;
      return { status, json: async () => ({ error: err.message, code: err.code || 'INTERNAL_ERROR' }) };
    }
    return { status: 500, json: async () => ({ error: 'Internal Server Error', code: 'INTERNAL_ERROR' }) };
  }),
}));

vi.mock('@herafino/shared/db', () => {
  const mockSelect = vi.fn();
  const mockFrom1 = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{ count: 5 }]) });
  const mockFrom2 = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{ count: 10 }]) });
  const mockFrom3 = vi.fn().mockResolvedValue([{ count: 100 }]);
  const mockFrom4 = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{ count: 50 }]) });
  mockSelect.mockReturnValueOnce({ from: mockFrom1 })
    .mockReturnValueOnce({ from: mockFrom2 })
    .mockReturnValueOnce({ from: mockFrom3 })
    .mockReturnValueOnce({ from: mockFrom4 });

  return {
    db: {
      select: mockSelect,
    },
  };
});

vi.mock('@herafino/shared/db/schema', () => ({
  users: {},
  craftsmanProfiles: {},
  orders: {},
  complaints: {},
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => ({ type: 'eq', field, value })),
  sql: vi.fn((template: string) => ({ type: 'sql', template })),
}));

import { auth } from '@/app/auth';
import { GET } from './route';

describe('GET /api/admin/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockReset();
  });

  it('should return stats for admin', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
    mockRequireAdmin.mockImplementation(() => {});

    const response = await GET();
    const data = await (response as Response).json();
    expect(data.data).toHaveProperty('pendingCraftsmen');
    expect(data.data).toHaveProperty('pendingComplaints');
    expect(data.data).toHaveProperty('totalOrders');
    expect(data.data).toHaveProperty('totalUsers');
  });

  it('should return 403 for non-admin', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1', role: 'client' } });
    mockRequireAdmin.mockImplementation(() => {
      const err = new Error('Admin access required') as any;
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    });

    const response = await GET();
    expect((response as Response).status).toBe(403);
  });

  it('should return 401 for unauthenticated', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    mockRequireAdmin.mockImplementation(() => {
      const err = new Error('Authentication required') as any;
      err.statusCode = 401;
      err.code = 'UNAUTHORIZED';
      throw err;
    });

    const response = await GET();
    expect((response as Response).status).toBe(401);
  });

  it('should return 500 on server error', async () => {
    (auth as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Database error'));

    const response = await GET();
    expect((response as Response).status).toBe(500);
  });
});
