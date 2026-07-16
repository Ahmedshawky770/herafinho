import { describe, it, expect, beforeEach } from 'vitest';
import { mockAuth, setSession, clientSession, craftsmanSession } from './helpers/auth';
import { setupIntegrationDatabase, withCleanDatabase, randomId } from './helpers/db';
import { describeIntegration } from './helpers/db';
import { UserRepository } from '@herafino/shared/repositories/user.repository';
import { CraftsmanRepository } from '@herafino/shared/repositories/craftsman.repository';
import { OrderRepository } from '@herafino/shared/repositories/order.repository';

mockAuth();

const ctx = setupIntegrationDatabase();
withCleanDatabase(ctx);

async function seedOrder() {
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
  await new CraftsmanRepository().createProfile({
    userId: craftsmanUser.id,
    craftType: 'plumber',
    experienceYears: 1,
    idCardFrontUrl: 'f',
    idCardBackUrl: 'b',
    facePhotoUrl: 'x',
    workshopAddress: 'a',
    workshopLatitude: '30',
    workshopLongitude: '31',
  });
  const order = await new OrderRepository().create({
    clientId: client.id,
    craftsmanId: craftsmanUser.id,
    craftType: 'plumber',
    description: 'fix the sink please',
    address: '123',
    latitude: '30',
    longitude: '31',
  });
  return { client, craftsmanUser, order };
}

async function importRoute() {
  return import('@/app/api/orders/[id]/route');
}

describeIntegration('GET /api/orders/[id] (integration)', () => {
  it('returns 401 when unauthenticated', async () => {
    setSession(null);
    const { client, order } = await seedOrder();
    const route = await importRoute();
    const res = await route.GET(new Request('http://localhost'), { params: Promise.resolve({ id: order.id }) });
    expect(res.status).toBe(401);
  });

  it('returns the order to its owner client', async () => {
    const { client, order } = await seedOrder();
    setSession(clientSession(client.id));
    const route = await importRoute();
    const res = await route.GET(new Request('http://localhost'), { params: Promise.resolve({ id: order.id }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe(order.id);
  });

  it('forbids a different client from viewing the order', async () => {
    const { order } = await seedOrder();
    const stranger = await new UserRepository().create({
      email: `${randomId()}@example.com`,
      name: 'Stranger',
      image: 'i',
      role: 'client',
    });
    setSession(clientSession(stranger.id));
    const route = await importRoute();
    const res = await route.GET(new Request('http://localhost'), { params: Promise.resolve({ id: order.id }) });
    expect(res.status).toBe(403);
  });

  it('returns 404 for a missing order', async () => {
    const client = await new UserRepository().create({
      email: `${randomId()}@example.com`,
      name: 'C',
      image: 'i',
      role: 'client',
    });
    setSession(clientSession(client.id));
    const route = await importRoute();
    const res = await route.GET(new Request('http://localhost'), { params: Promise.resolve({ id: 'missing' }) });
    expect(res.status).toBe(404);
  });
});

describeIntegration('PATCH /api/orders/[id]/cancel (integration)', () => {
  it('allows the owner client to cancel a pending order', async () => {
    const { client, order } = await seedOrder();
    setSession(clientSession(client.id));
    const route = await import('@/app/api/orders/[id]/cancel/route');
    const res = await route.PATCH(new Request('http://localhost'), { params: Promise.resolve({ id: order.id }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('cancelled');
  });

  it('forbids a craftsman who is not assigned', async () => {
    const { order } = await seedOrder();
    const strangerCraft = await new UserRepository().create({
      email: `${randomId()}@example.com`,
      name: 'SC',
      image: 'i',
      role: 'craftsman',
    });
    setSession(craftsmanSession(strangerCraft.id));
    const route = await import('@/app/api/orders/[id]/cancel/route');
    const res = await route.PATCH(new Request('http://localhost'), { params: Promise.resolve({ id: order.id }) });
    expect(res.status).toBe(403);
  });
});
