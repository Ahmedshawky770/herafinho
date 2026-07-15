// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

vi.mock('@herafino/shared/db', () => ({
  db: {
    insert: vi.fn(() => ({ values: vi.fn(() => Promise.resolve()) })),
  },
}));

import { AuditLogService } from './audit-log-service';

describe('AuditLogService', () => {
  it('writes an audit log and resolves', async () => {
    const svc = new AuditLogService();
    await expect(
      svc.createAuditLog('LOGIN', 'user', 'user-1', { ip: '1.2.3.4' })
    ).resolves.toBeUndefined();
  });

  it('never rejects when the database write fails (non-blocking)', async () => {
    const { db } = await import('@herafino/shared/db');
    (db.insert as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new Error('connection refused');
    });
    const svc = new AuditLogService();
    await expect(
      svc.createAuditLog('LOGIN', 'user', 'user-2')
    ).resolves.toBeUndefined();
  });
});
