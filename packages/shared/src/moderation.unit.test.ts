import { describe, it, expect, vi } from 'vitest';
import { computeFreezeState } from './moderation';

describe('computeFreezeState', () => {
  it('should increment freeze count', () => {
    const result = computeFreezeState(0);
    expect(result.freezeCount).toBe(1);
  });

  it('should return frozen status below threshold', () => {
    const result = computeFreezeState(1);
    expect(result.status).toBe('frozen');
    expect(result.banned).toBe(false);
  });

  it('should return rejected status at threshold', () => {
    const result = computeFreezeState(2);
    expect(result.status).toBe('rejected');
    expect(result.banned).toBe(true);
  });

  it('should return rejected status above threshold', () => {
    const result = computeFreezeState(5);
    expect(result.status).toBe('rejected');
    expect(result.banned).toBe(true);
  });

  it('should correctly identify banned state at threshold', () => {
    const result = computeFreezeState(2);
    expect(result.banned).toBe(true);
  });

  it('should correctly identify not banned below threshold', () => {
    const result = computeFreezeState(1);
    expect(result.banned).toBe(false);
  });
});
