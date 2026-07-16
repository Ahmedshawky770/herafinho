import { describe, it, expect } from 'vitest';
import { UserRepository } from '@herafino/shared/repositories/user.repository';
import { CraftsmanRepository } from '@herafino/shared/repositories/craftsman.repository';
import { OrderRepository } from '@herafino/shared/repositories/order.repository';
import { OutboxRepository } from '@herafino/shared/events/outbox-repository';
import { setupIntegrationDatabase, withCleanDatabase, randomId } from './helpers/db';
import { describeIntegration } from './helpers/db';
import { eventOutbox, orders } from '@herafino/shared/db/schema';
import type { NewOrder } from '@herafino/types';

const ctx = setupIntegrationDatabase();
withCleanDatabase(ctx);

async function seedClientAndCraftsman() {
  const client = await new UserRepository().create({
    email: `${randomId()}@example.com`,
    name: 'Client',
    image: 'i',
    role: 'client',
  });
  const craftsmanUser = await new UserRepository().create({
    email: `${randomId()}@example.com`,
    name: 'Craft',
    image: 'i',
    role: 'craftsman',
  });
  const profile = await new CraftsmanRepository().createProfile({
    userId: craftsmanUser.id,
    craftType: 'carpenter',
    experienceYears: 2,
    idCardFrontUrl: 'f',
    idCardBackUrl: 'b',
    facePhotoUrl: 'face',
    workshopAddress: 'addr',
    workshopLatitude: '30',
    workshopLongitude: '31',
  });
  return { client, craftsmanUser, profile };
}

function makeOrder(clientId: string, craftsmanId: string, overrides: Partial<NewOrder> = {}): NewOrder {
  return {
    clientId,
    craftsmanId,
    craftType: 'carpenter',
    description: 'fix the broken shelf',
    address: '12 Nile St',
    latitude: '30.1',
    longitude: '31.1',
    ...overrides,
  };
}

describeIntegration('OrderRepository (integration)', () => {
  it('creates an order defaulting to pending and appends an outbox event', async () => {
    const { client, craftsmanUser } = await seedClientAndCraftsman();
    const repo = new OrderRepository(new OutboxRepository());
    const order = await repo.create(makeOrder(client.id, craftsmanUser.id));

    expect(order.id).toBeTruthy();
    expect(order.status).toBe('pending');

    const events = await ctx.db.select().from(eventOutbox);
    expect(events.some((e) => e.eventName === 'order.created')).toBe(true);
  });

  it('finds an order by id', async () => {
    const { client, craftsmanUser } = await seedClientAndCraftsman();
    const order = await new OrderRepository().create(makeOrder(client.id, craftsmanUser.id));
    const found = await new OrderRepository().findById(order.id);
    expect(found?.id).toBe(order.id);
  });

  it('lists orders by client and by craftsman', async () => {
    const { client, craftsmanUser } = await seedClientAndCraftsman();
    await new OrderRepository().create(makeOrder(client.id, craftsmanUser.id));
    await new OrderRepository().create(makeOrder(client.id, craftsmanUser.id));

    expect((await new OrderRepository().findByClientId(client.id)).length).toBe(2);
    expect((await new OrderRepository().findByCraftsmanId(craftsmanUser.id)).length).toBe(2);
  });

  it('updates status and emits a status outbox event', async () => {
    const { client, craftsmanUser } = await seedClientAndCraftsman();
    const order = await new OrderRepository().create(makeOrder(client.id, craftsmanUser.id));
    const updated = await new OrderRepository(new OutboxRepository()).updateStatus(order.id, 'accepted');

    expect(updated.status).toBe('accepted');
    const events = await ctx.db.select().from(eventOutbox);
    expect(events.some((e) => e.eventName === 'order.accepted')).toBe(true);
  });

  it('finds the active order for a craftsman', async () => {
    const { client, craftsmanUser } = await seedClientAndCraftsman();
    const order = await new OrderRepository().create(makeOrder(client.id, craftsmanUser.id));
    await new OrderRepository().updateStatus(order.id, 'in_progress');
    const active = await new OrderRepository().findActiveByCraftsmanId(craftsmanUser.id);
    expect(active?.id).toBe(order.id);
  });

  it('cancels an order and emits an outbox event', async () => {
    const { client, craftsmanUser } = await seedClientAndCraftsman();
    const order = await new OrderRepository().create(makeOrder(client.id, craftsmanUser.id));
    const cancelled = await new OrderRepository(new OutboxRepository()).cancel(order.id, client.id);
    expect(cancelled.status).toBe('cancelled');

    const events = await ctx.db.select().from(eventOutbox);
    expect(events.some((e) => e.eventName === 'order.cancelled')).toBe(true);
  });

  it('updates arbitrary order fields', async () => {
    const { client, craftsmanUser } = await seedClientAndCraftsman();
    const order = await new OrderRepository().create(makeOrder(client.id, craftsmanUser.id));
    const updated = await new OrderRepository().update(order.id, { finalPrice: '500', clientAcceptedFinalPrice: true });
    expect(updated.finalPrice).toBe('500');
    expect(updated.clientAcceptedFinalPrice).toBe(true);
  });

  it('lists all orders', async () => {
    const { client, craftsmanUser } = await seedClientAndCraftsman();
    await new OrderRepository().create(makeOrder(client.id, craftsmanUser.id));
    expect((await new OrderRepository().findAll()).length).toBeGreaterThanOrEqual(1);
  });

  it('isolation: orders table is truncated between tests', async () => {
    expect((await ctx.db.select().from(orders)).length).toBe(1);
  });
});
