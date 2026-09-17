import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetByUserId, mockGetUnread, mockMarkAllAsRead } = vi.hoisted(() => {
  const mockGetByUserId = vi.fn();
  const mockGetUnread = vi.fn();
  const mockMarkAllAsRead = vi.fn();
  return { mockGetByUserId, mockGetUnread, mockMarkAllAsRead };
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

vi.mock('@herafino/shared/repositories/notification.repository', () => ({
  NotificationRepository: class {
    getByUserId = mockGetByUserId;
    getUnread = mockGetUnread;
    markAllAsRead = mockMarkAllAsRead;
    constructor() {}
  },
}));

import { auth } from '@/app/auth';
import { GET, PATCH } from './route';

describe('GET /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return notifications for authenticated user', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } });
    mockGetByUserId.mockResolvedValue([{ id: 'notif-1' }]);

    const request = new Request('http://localhost/api/notifications');
    const response = await GET(request);
    const data = await (response as Response).json();
    expect(data.data).toHaveLength(1);
  });

  it('should return unread notifications when unread=true', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } });
    mockGetUnread.mockResolvedValue([{ id: 'notif-1', read: false }]);

    const request = new Request('http://localhost/api/notifications?unread=true');
    const response = await GET(request);
    expect(mockGetUnread).toHaveBeenCalledWith('user-1');
  });

  it('should respect limit parameter', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } });
    mockGetByUserId.mockResolvedValue([{ id: 'notif-1' }]);

    const request = new Request('http://localhost/api/notifications?limit=10');
    const response = await GET(request);
    expect(mockGetByUserId).toHaveBeenCalledWith('user-1', 10);
  });

  it('should cap limit at 100', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } });
    mockGetByUserId.mockResolvedValue([{ id: 'notif-1' }]);

    const request = new Request('http://localhost/api/notifications?limit=200');
    const response = await GET(request);
    expect(mockGetByUserId).toHaveBeenCalledWith('user-1', 100);
  });

  it('should return 401 when not authenticated', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const request = new Request('http://localhost/api/notifications');
    const response = await GET(request);
    expect((response as Response).status).toBe(401);
  });

  it('should return 500 on server error', async () => {
    (auth as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Auth failed'));

    const request = new Request('http://localhost/api/notifications');
    const response = await GET(request);
    expect((response as Response).status).toBe(500);
  });
});

describe('PATCH /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mark all as read', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } });
    mockMarkAllAsRead.mockResolvedValue(undefined);

    const request = new Request('http://localhost/api/notifications', { method: 'PATCH', body: JSON.stringify({ markAllRead: true }) });
    const response = await PATCH(request);
    const data = await (response as Response).json();
    expect(data.data.markedAllRead).toBe(true);
  });

  it('should return 400 for invalid request', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } });

    const request = new Request('http://localhost/api/notifications', { method: 'PATCH', body: JSON.stringify({}) });
    const response = await PATCH(request);
    expect((response as Response).status).toBe(400);
  });

  it('should return 401 when not authenticated', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const request = new Request('http://localhost/api/notifications', { method: 'PATCH', body: JSON.stringify({}) });
    const response = await PATCH(request);
    expect((response as Response).status).toBe(401);
  });
});
