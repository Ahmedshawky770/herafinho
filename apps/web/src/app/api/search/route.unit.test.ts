import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSearchNearbyCraftsmen, mockSearchByNameOrCraft, mockFindApprovedByCraftType } = vi.hoisted(() => {
  const mockSearchNearbyCraftsmen = vi.fn();
  const mockSearchByNameOrCraft = vi.fn();
  const mockFindApprovedByCraftType = vi.fn();
  return { mockSearchNearbyCraftsmen, mockSearchByNameOrCraft, mockFindApprovedByCraftType };
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

vi.mock('@herafino/shared/repositories/craftsman.repository', () => ({
  CraftsmanRepository: class {
    searchNearbyCraftsmen = mockSearchNearbyCraftsmen;
    searchByNameOrCraft = mockSearchByNameOrCraft;
    findApprovedByCraftType = mockFindApprovedByCraftType;
    constructor() {}
  },
}));

import { auth } from '@/app/auth';
import { GET } from './route';

describe('GET /api/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const request = new Request('http://localhost/api/search');
    const response = await GET(request);
    expect((response as Response).status).toBe(401);
  });

  it('should return 401 when no user id', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: {} });

    const request = new Request('http://localhost/api/search');
    const response = await GET(request);
    expect((response as Response).status).toBe(401);
  });

  it('should search nearby when craftType, lat, lng provided', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } });
    mockSearchNearbyCraftsmen.mockResolvedValue([
      { profile: { userId: 'prof-1' }, distanceKm: 5, name: 'Ahmed' },
    ]);

    const request = new Request('http://localhost/api/search?craftType=carpenter&lat=30&lng=31');
    const response = await GET(request);
    expect(mockSearchNearbyCraftsmen).toHaveBeenCalledWith('carpenter', '30', '31', 10);
  });

  it('should search by query when q provided', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } });
    mockSearchByNameOrCraft.mockResolvedValue([{ id: 'prof-1' }]);

    const request = new Request('http://localhost/api/search?q=Ahmed');
    const response = await GET(request);
    expect(mockSearchByNameOrCraft).toHaveBeenCalledWith('Ahmed', undefined);
  });

  it('should return approved by craft type as fallback', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } });
    mockFindApprovedByCraftType.mockResolvedValue([{ id: 'prof-1' }]);

    const request = new Request('http://localhost/api/search?craftType=carpenter');
    const response = await GET(request);
    expect(mockFindApprovedByCraftType).toHaveBeenCalledWith('carpenter', '0', '0', 50);
  });

  it('should return 500 on server error', async () => {
    (auth as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Auth failed'));

    const request = new Request('http://localhost/api/search');
    const response = await GET(request);
    expect((response as Response).status).toBe(500);
  });
});
