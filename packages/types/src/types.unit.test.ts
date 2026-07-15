import { describe, it, expect } from 'vitest';

describe('@herafino/types barrel', () => {
  it('is importable as a module', async () => {
    const mod = await import('@herafino/types');
    expect(mod).toBeDefined();
    expect(typeof mod).toBe('object');
  });
});
