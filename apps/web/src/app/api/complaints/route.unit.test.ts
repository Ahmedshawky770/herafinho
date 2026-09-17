import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFindByReporterId, mockCreate } = vi.hoisted(() => {
  const mockFindByReporterId = vi.fn();
  const mockCreate = vi.fn();
  return { mockFindByReporterId, mockCreate };
});

vi.mock('@/app/auth', () => ({
  auth: vi.fn(),
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

vi.mock('@herafino/shared/events/outbox-repository', () => ({
  OutboxRepository: class {
    append = vi.fn().mockResolvedValue(undefined);
    constructor() {}
  },
}));

vi.mock('@herafino/shared/repositories/complaint.repository', () => ({
  ComplaintRepository: class {
    findByReporterId = mockFindByReporterId;
    create = mockCreate;
    constructor() {}
  },
}));

vi.mock('@herafino/shared/validation/complaint.schema', () => ({
  ComplaintCreateSchema: {
    safeParse: vi.fn(),
  },
}));

import { auth } from '@/app/auth';
import { GET, POST } from './route';

describe('GET /api/complaints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return complaints for authenticated user', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } });
    mockFindByReporterId.mockResolvedValue([{ id: 'comp-1' }]);

    const response = await GET();
    const data = await (response as Response).json();
    expect(data.data).toHaveLength(1);
  });

  it('should return 401 when not authenticated', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const response = await GET();
    expect((response as Response).status).toBe(401);
  });

  it('should return 500 on server error', async () => {
    (auth as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Auth failed'));

    const response = await GET();
    expect((response as Response).status).toBe(500);
  });
});

describe('POST /api/complaints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create complaint', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } });
    const { ComplaintCreateSchema } = await import('@herafino/shared/validation/complaint.schema');
    (ComplaintCreateSchema.safeParse as ReturnType<typeof vi.fn>).mockReturnValue({ success: true, data: { againstUserId: 'user-2', reason: 'spam', description: 'Spam', orderId: 'order-1', evidenceUrls: [] } });

    mockCreate.mockResolvedValue({ id: 'comp-1' });

    const request = new Request('http://localhost/api/complaints', { method: 'POST', body: JSON.stringify({}) });
    const response = await POST(request);
    expect((response as Response).status).toBe(201);
  });

  it('should return 400 for invalid body', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } });
    const { ComplaintCreateSchema } = await import('@herafino/shared/validation/complaint.schema');
    (ComplaintCreateSchema.safeParse as ReturnType<typeof vi.fn>).mockReturnValue({ success: false, error: { issues: [{ message: 'Invalid' }] } });

    const request = new Request('http://localhost/api/complaints', { method: 'POST', body: JSON.stringify({}) });
    const response = await POST(request);
    expect((response as Response).status).toBe(400);
  });

  it('should return 401 when not authenticated', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const request = new Request('http://localhost/api/complaints', { method: 'POST', body: JSON.stringify({}) });
    const response = await POST(request);
    expect((response as Response).status).toBe(401);
  });
});
