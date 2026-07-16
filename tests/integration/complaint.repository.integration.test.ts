import { describe, it, expect } from 'vitest';
import { UserRepository } from '@herafino/shared/repositories/user.repository';
import { CraftsmanRepository } from '@herafino/shared/repositories/craftsman.repository';
import { OrderRepository } from '@herafino/shared/repositories/order.repository';
import { ComplaintsRepository } from '@herafino/shared/repositories/complaint.repository';
import { setupIntegrationDatabase, withCleanDatabase, randomId } from './helpers/db';
import { describeIntegration } from './helpers/db';
import { complaints } from '@herafino/shared/db/schema';

const ctx = setupIntegrationDatabase();
withCleanDatabase(ctx);

async function seedComplaint() {
  const reporter = await new UserRepository().create({
    email: `${randomId()}@example.com`,
    name: 'Reporter',
    image: 'i',
    role: 'client',
  });
  const against = await new UserRepository().create({
    email: `${randomId()}@example.com`,
    name: 'Against',
    image: 'i',
    role: 'craftsman',
  });
  const admin = await new UserRepository().create({
    email: `${randomId()}@example.com`,
    name: 'Admin',
    image: 'i',
    role: 'admin',
  });
  const order = await new OrderRepository().create({
    clientId: reporter.id,
    craftsmanId: against.id,
    craftType: 'painter',
    description: 'paint the wall',
    address: 'addr',
    latitude: '30',
    longitude: '31',
  });
  const complaint = await new ComplaintsRepository().create({
    orderId: order.id,
    reporterId: reporter.id,
    againstUserId: against.id,
    reason: 'bad_service',
    description: 'did a poor job',
  });
  return { reporter, against, admin, order, complaint };
}

describeIntegration('ComplaintsRepository (integration)', () => {
  it('creates a complaint', async () => {
    const { complaint } = await seedComplaint();
    expect(complaint.id).toBeTruthy();
    expect(complaint.status).toBe('pending');
  });

  it('finds a complaint by id', async () => {
    const { complaint } = await seedComplaint();
    const found = await new ComplaintsRepository().findById(complaint.id);
    expect(found?.reason).toBe('bad_service');
  });

  it('lists complaints by reporter and by the reported user', async () => {
    const { reporter, against } = await seedComplaint();
    expect((await new ComplaintsRepository().findByReporterId(reporter.id)).length).toBeGreaterThanOrEqual(1);
    expect((await new ComplaintsRepository().findByAgainstUserId(against.id)).length).toBeGreaterThanOrEqual(1);
  });

  it('lists pending complaints', async () => {
    await seedComplaint();
    const pending = await new ComplaintsRepository().findPending();
    expect(pending.some((c) => c.status === 'pending')).toBe(true);
  });

  it('updates a complaint status', async () => {
    const { complaint } = await seedComplaint();
    const updated = await new ComplaintsRepository().updateStatus(complaint.id, 'investigating');
    expect(updated.status).toBe('investigating');
  });

  it('resolves a complaint with an action', async () => {
    const { complaint, admin } = await seedComplaint();
    const resolved = await new ComplaintsRepository().resolve(complaint.id, 'warning', admin.id);
    expect(resolved.status).toBe('resolved');
    expect(resolved.actionTaken).toBe('warning');
    expect(resolved.resolvedBy).toBe(admin.id);
  });

  it('lists all complaints', async () => {
    await seedComplaint();
    expect((await new ComplaintsRepository().findAll()).length).toBeGreaterThanOrEqual(1);
  });

  it('isolation: complaints table is truncated between tests', async () => {
    expect((await ctx.db.select().from(complaints)).length).toBe(1);
  });
});
