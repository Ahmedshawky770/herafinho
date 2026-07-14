import { describe, it, expect } from 'vitest';
import { OrderStatus, CraftType } from '@herafino/types';

describe('Order domain types', () => {
  it('allows valid order statuses', () => {
    const statuses: OrderStatus[] = [
      'pending',
      'accepted',
      'rejected',
      'in_progress',
      'completed',
      'cancelled',
    ];
    expect(statuses).toHaveLength(6);
  });

  it('exposes craft type union', () => {
    const type: CraftType = 'plumber';
    expect(['plumber', 'electrician', 'carpenter']).toContain(type);
  });
});
