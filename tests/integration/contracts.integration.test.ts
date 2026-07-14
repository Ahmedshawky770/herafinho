import { describe, it, expect } from 'vitest';

describe('Contracts package barrel exports', () => {
  it('barrel file exists and is importable', async () => {
    const mod = await import('@herafino/contracts');
    expect(mod).toBeDefined();
    expect(typeof mod).toBe('object');
  });

  it('types package barrel exists and is importable', async () => {
    const mod = await import('@herafino/types');
    expect(mod).toBeDefined();
    expect(typeof mod).toBe('object');
  });
});
