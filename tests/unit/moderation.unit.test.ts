import { describe, it, expect } from 'vitest';
import { computeFreezeState, FREEZE_BAN_THRESHOLD } from '@herafino/shared/moderation';

describe('computeFreezeState (3-strike moderation policy)', () => {
  it('keeps the craftsman frozen below the ban threshold', () => {
    const state = computeFreezeState(0);
    expect(state).toEqual({ freezeCount: 1, status: 'frozen', banned: false });
  });

  it('increments the strike counter on each freeze', () => {
    expect(computeFreezeState(1).freezeCount).toBe(2);
    expect(computeFreezeState(2).freezeCount).toBe(3);
  });

  it('auto-bans exactly at the threshold', () => {
    const state = computeFreezeState(FREEZE_BAN_THRESHOLD - 1);
    expect(state.freezeCount).toBe(FREEZE_BAN_THRESHOLD);
    expect(state.banned).toBe(true);
    expect(state.status).toBe('rejected');
  });

  it('remains banned beyond the threshold', () => {
    const state = computeFreezeState(5);
    expect(state.banned).toBe(true);
    expect(state.status).toBe('rejected');
  });
});
