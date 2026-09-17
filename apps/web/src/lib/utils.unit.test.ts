import { describe, it, expect, vi, beforeEach } from 'vitest';

import { cn } from './utils';

describe('cn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    const active = true;
    const inactive = false;
    expect(cn('base', active && 'active', inactive && 'inactive')).toBe('base active');
  });

  it('should handle empty input', () => {
    expect(cn()).toBe('');
  });

  it('should handle single class', () => {
    expect(cn('single')).toBe('single');
  });

  it('should merge conflicting tailwind classes', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });
});
