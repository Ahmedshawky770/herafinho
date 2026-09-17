import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFindProfileById, mockCreateProfile, mockFindApprovedByCraftType, mockGetPendingProfiles } = vi.hoisted(() => {
  const mockFindProfileById = vi.fn();
  const mockCreateProfile = vi.fn();
  const mockFindApprovedByCraftType = vi.fn();
  const mockGetPendingProfiles = vi.fn();
  return { mockFindProfileById, mockCreateProfile, mockFindApprovedByCraftType, mockGetPendingProfiles };
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
    findProfileByUserId = mockFindProfileById;
    createProfile = mockCreateProfile;
    findApprovedByCraftType = mockFindApprovedByCraftType;
    getPendingProfiles = mockGetPendingProfiles;
    constructor() {}
  },
}));

import { auth } from '@/app/auth';
import { GET, POST } from './route';

describe('GET /api/craftsmen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const request = new Request('http://localhost/api/craftsmen');
    const response = await GET(request);
    expect((response as Response).status).toBe(401);
  });

  it('should return pending profiles when no craftType', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } });
    mockGetPendingProfiles.mockResolvedValue([{ id: 'prof-1' }]);

    const request = new Request('http://localhost/api/craftsmen');
    const response = await GET(request);
    const data = await (response as Response).json();
    expect(data.data).toHaveLength(1);
  });

  it('should return approved by craft type', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } });
    mockFindApprovedByCraftType.mockResolvedValue([{ id: 'prof-1' }]);

    const request = new Request('http://localhost/api/craftsmen?craftType=carpenter');
    const response = await GET(request);
    expect(mockFindApprovedByCraftType).toHaveBeenCalledWith('carpenter', '0', '0', 50);
  });

  it('should return 500 on server error', async () => {
    (auth as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Auth failed'));

    const request = new Request('http://localhost/api/craftsmen');
    const response = await GET(request);
    expect((response as Response).status).toBe(500);
  });
});

describe('POST /api/craftsmen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when no user id', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: {} });

    const request = new Request('http://localhost/api/craftsmen', { method: 'POST', body: JSON.stringify({}) });
    const response = await POST(request);
    expect((response as Response).status).toBe(401);
  });

  it('should return 409 when profile already exists', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } });
    mockFindProfileById.mockResolvedValue({ id: 'prof-1' });

    const request = new Request('http://localhost/api/craftsmen', { method: 'POST', body: JSON.stringify({}) });
    const response = await POST(request);
    expect((response as Response).status).toBe(409);
  });

  it('should create profile', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } });
    mockFindProfileById.mockResolvedValue(null);
    mockCreateProfile.mockResolvedValue({ id: 'prof-1' });

    const body = { craftType: 'carpenter', experienceYears: 5, idCardFrontUrl: 'http://front.jpg', idCardBackUrl: 'http://back.jpg', facePhotoUrl: 'http://face.jpg', workshopAddress: 'Cairo', workshopLatitude: '30', workshopLongitude: '31' };
    const request = new Request('http://localhost/api/craftsmen', { method: 'POST', body: JSON.stringify(body) });
    const response = await POST(request);
    expect((response as Response).status).toBe(201);
  });

  it('should return 500 on server error', async () => {
    (auth as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Auth failed'));

    const request = new Request('http://localhost/api/craftsmen', { method: 'POST', body: JSON.stringify({}) });
    const response = await POST(request);
    expect((response as Response).status).toBe(500);
  });
});
