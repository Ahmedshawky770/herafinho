import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFindByClientId, mockFindByCraftsmanId, mockOrderCreate, mockFindById, mockFindProfileById } = vi.hoisted(() => {
  const mockFindByClientId = vi.fn();
  const mockFindByCraftsmanId = vi.fn();
  const mockOrderCreate = vi.fn();
  const mockFindById = vi.fn();
  const mockFindProfileById = vi.fn();
  return { mockFindByClientId, mockFindByCraftsmanId, mockOrderCreate, mockFindById, mockFindProfileById };
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

vi.mock('@herafino/shared/repositories/order.repository', () => ({
  OrderRepository: class {
    findByClientId = mockFindByClientId;
    findByCraftsmanId = mockFindByCraftsmanId;
    create = mockOrderCreate;
    constructor() {}
  },
}));

vi.mock('@herafino/shared/repositories/user.repository', () => ({
  UserRepository: class {
    findById = mockFindById;
    constructor() {}
  },
}));

vi.mock('@herafino/shared/repositories/craftsman.repository', () => ({
  CraftsmanRepository: class {
    findProfileById = mockFindProfileById;
    constructor() {}
  },
}));

vi.mock('@herafino/shared/validation', () => ({
  OrderCreateSchema: {
    safeParse: vi.fn(),
  },
}));

vi.mock('@herafino/shared/services', () => ({
  enqueueOrderTimeoutCheck: vi.fn().mockResolvedValue(undefined),
}));

import { auth } from '@/app/auth';
import { GET, POST } from './route';

describe('GET /api/orders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return orders for client', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1', role: 'client' } });
    mockFindByClientId.mockResolvedValue([{ id: 'order-1' }]);

    const response = await GET();
    const data = await (response as Response).json();
    expect(data.data).toHaveLength(1);
  });

  it('should return orders for craftsman', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'prof-1', role: 'craftsman' } });
    mockFindByCraftsmanId.mockResolvedValue([{ id: 'order-1' }]);

    const response = await GET();
    const data = await (response as Response).json();
    expect(data.data).toHaveLength(1);
  });

  it('should return 401 when not authenticated', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const response = await GET();
    expect((response as Response).status).toBe(401);
  });

  it('should return 401 when no user id', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: {} });

    const response = await GET();
    expect((response as Response).status).toBe(401);
  });

  it('should return 500 on server error', async () => {
    (auth as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Auth failed'));

    const response = await GET();
    expect((response as Response).status).toBe(500);
  });
});

describe('POST /api/orders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create order for client', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1', role: 'client' } });
    const { OrderCreateSchema } = await import('@herafino/shared/validation');
    (OrderCreateSchema.safeParse as ReturnType<typeof vi.fn>).mockReturnValue({ success: true, data: { craftsmanId: 'prof-1', craftType: 'carpenter', description: 'Fix door', address: 'Cairo', latitude: '30', longitude: '31' } });

    mockFindProfileById.mockResolvedValue({ id: 'prof-1' });
    mockFindById.mockResolvedValue({ id: 'user-1' });
    mockOrderCreate.mockResolvedValue({ id: 'order-1' });

    const request = new Request('http://localhost', { method: 'POST', body: JSON.stringify({}) });
    const response = await POST(request);
    expect((response as Response).status).toBe(201);
  });

  it('should return 403 for non-client role', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1', role: 'craftsman' } });

    const request = new Request('http://localhost', { method: 'POST', body: JSON.stringify({}) });
    const response = await POST(request);
    expect((response as Response).status).toBe(403);
  });

  it('should return 400 for invalid body', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1', role: 'client' } });
    const { OrderCreateSchema } = await import('@herafino/shared/validation');
    (OrderCreateSchema.safeParse as ReturnType<typeof vi.fn>).mockReturnValue({ success: false, error: { issues: [{ message: 'Invalid' }] } });

    const request = new Request('http://localhost', { method: 'POST', body: JSON.stringify({}) });
    const response = await POST(request);
    expect((response as Response).status).toBe(400);
  });

  it('should return 404 when craftsman not found', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1', role: 'client' } });
    const { OrderCreateSchema } = await import('@herafino/shared/validation');
    (OrderCreateSchema.safeParse as ReturnType<typeof vi.fn>).mockReturnValue({ success: true, data: { craftsmanId: 'missing', craftType: 'carpenter', description: 'Fix door', address: 'Cairo', latitude: '30', longitude: '31' } });

    mockFindProfileById.mockResolvedValue(null);

    const request = new Request('http://localhost', { method: 'POST', body: JSON.stringify({}) });
    const response = await POST(request);
    expect((response as Response).status).toBe(404);
  });

  it('should return 404 when client user not found', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1', role: 'client' } });
    const { OrderCreateSchema } = await import('@herafino/shared/validation');
    (OrderCreateSchema.safeParse as ReturnType<typeof vi.fn>).mockReturnValue({ success: true, data: { craftsmanId: 'prof-1', craftType: 'carpenter', description: 'Fix door', address: 'Cairo', latitude: '30', longitude: '31' } });

    mockFindProfileById.mockResolvedValue({ id: 'prof-1' });
    mockFindById.mockResolvedValue(null);

    const request = new Request('http://localhost', { method: 'POST', body: JSON.stringify({}) });
    const response = await POST(request);
    expect((response as Response).status).toBe(404);
  });

  it('should return 401 when not authenticated', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const request = new Request('http://localhost', { method: 'POST', body: JSON.stringify({}) });
    const response = await POST(request);
    expect((response as Response).status).toBe(401);
  });
});
