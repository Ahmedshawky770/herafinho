export const FREEZE_BAN_THRESHOLD = 3;
export const FREEZE_DURATION_DAYS = 30;

export type FreezeState = {
  freezeCount: number;
  status: 'frozen' | 'rejected';
  banned: boolean;
};

/**
 * Pure decision function for the 3-strike moderation policy.
 * Each freeze increments the strike counter; on reaching the threshold the
 * craftsman is auto-banned (status `rejected` with `freezeReason: 'permanent_ban'`).
 */
export function computeFreezeState(currentFreezeCount: number): FreezeState {
  const freezeCount = currentFreezeCount + 1;
  const banned = freezeCount >= FREEZE_BAN_THRESHOLD;
  return {
    freezeCount,
    status: banned ? 'rejected' : 'frozen',
    banned,
  };
}
