import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (class merge)', () => {
  it('joins simple class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('ignores falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('merges conflicting tailwind classes (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('handles conditional objects', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
  });
});
