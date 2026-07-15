import type { ID } from '@herafino/types';
import type { IUserRepository } from '@herafino/contracts';
import { dispatchWebhook } from './webhook-dispatcher.service';
import { logger } from '../logger/factory';

/**
 * Completes the permanent-ban cascade for a craftsman: marks the underlying
 * user as deleted/banned and notifies external systems via the
 * `craftsman.banned` webhook. Used by both manual bans and the automatic
 * 3-strike auto-ban.
 */
export async function applyBanCascade(
  userRepository: IUserRepository,
  userId: ID,
  profileId: ID,
  freezeCount: number,
  reason: string,
  adminId?: ID,
): Promise<void> {
  await userRepository.update(userId, { isDeleted: true, bannedAt: new Date() });

  await dispatchWebhook('craftsman.banned', {
    userId,
    profileId,
    reason: reason || 'permanent_ban',
    freezeCount,
    adminId,
  });

  logger.info({ userId, profileId }, 'Craftsman permanently banned (cascade applied)');
}
