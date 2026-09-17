import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyBanCascade } from './moderation.service';
import { dispatchWebhook } from './webhook-dispatcher.service';

vi.mock('@herafino/shared/logger/factory', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
  },
}));

vi.mock('./webhook-dispatcher.service', () => ({
  dispatchWebhook: vi.fn().mockResolvedValue(undefined),
}));

describe('applyBanCascade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update user and dispatch webhook', async () => {
    const mockUserRepository = {
      update: vi.fn().mockResolvedValue(undefined),
    };

    await applyBanCascade(mockUserRepository as any, 'user-1', 'profile-1', 3, 'Spam', 'admin-1');

    expect(mockUserRepository.update).toHaveBeenCalledWith('user-1', { isDeleted: true, bannedAt: expect.any(Date) });
    expect(dispatchWebhook).toHaveBeenCalledWith('craftsman.banned', {
      userId: 'user-1',
      profileId: 'profile-1',
      reason: 'Spam',
      freezeCount: 3,
      adminId: 'admin-1',
    });
  });

  it('should use default reason when reason is empty', async () => {
    const mockUserRepository = {
      update: vi.fn().mockResolvedValue(undefined),
    };

    await applyBanCascade(mockUserRepository as any, 'user-1', 'profile-1', 3, '', 'admin-1');

    expect(dispatchWebhook).toHaveBeenCalledWith('craftsman.banned', expect.objectContaining({
      reason: 'permanent_ban',
    }));
  });

  it('should use default reason when reason is undefined', async () => {
    const mockUserRepository = {
      update: vi.fn().mockResolvedValue(undefined),
    };

    await applyBanCascade(mockUserRepository as any, 'user-1', 'profile-1', 3, undefined as any, 'admin-1');

    expect(dispatchWebhook).toHaveBeenCalledWith('craftsman.banned', expect.objectContaining({
      reason: 'permanent_ban',
    }));
  });

  it('should work without adminId', async () => {
    const mockUserRepository = {
      update: vi.fn().mockResolvedValue(undefined),
    };

    await applyBanCascade(mockUserRepository as any, 'user-1', 'profile-1', 2, 'Violation');

    expect(mockUserRepository.update).toHaveBeenCalled();
    expect(dispatchWebhook).toHaveBeenCalled();
  });

  it('should log ban cascade', async () => {
    const { logger } = await import('@herafino/shared/logger/factory');
    const mockUserRepository = {
      update: vi.fn().mockResolvedValue(undefined),
    };

    await applyBanCascade(mockUserRepository as any, 'user-1', 'profile-1', 3, 'Spam', 'admin-1');

    expect(logger.info).toHaveBeenCalledWith({ userId: 'user-1', profileId: 'profile-1' }, 'Craftsman permanently banned (cascade applied)');
  });
});
