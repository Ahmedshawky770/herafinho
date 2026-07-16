import { describe, it, expect } from 'vitest';
import { mockAuth, setSession, clientSession } from './helpers/auth';
import { setupIntegrationDatabase, withCleanDatabase, randomId } from './helpers/db';
import { UserRepository } from '@herafino/shared/repositories/user.repository';
import { NotificationRepository } from '@herafino/shared/repositories/notification.repository';

mockAuth();

const ctx = setupIntegrationDatabase();
withCleanDatabase(ctx);

async function seedUser() {
  return new UserRepository().create({
    email: `${randomId()}@example.com`,
    name: 'User',
    image: 'i',
    role: 'client',
  });
}

describe('GET /api/notifications (integration)', () => {
  it('returns the user notifications', async () => {
    const user = await seedUser();
    await new NotificationRepository().send({ userId: user.id, type: 'in_app', title: 'A', body: 'a' });
    await new NotificationRepository().send({ userId: user.id, type: 'in_app', title: 'B', body: 'b' });
    setSession(clientSession(user.id));

    const route = await import('@/app/api/notifications/route');
    const res = await route.GET(new Request('http://localhost/api/notifications'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBe(2);
  });

  it('filters unread only when requested', async () => {
    const user = await seedUser();
    const n = await new NotificationRepository().send({ userId: user.id, type: 'in_app', title: 'A', body: 'a' });
    await new NotificationRepository().send({ userId: user.id, type: 'in_app', title: 'B', body: 'b' });
    await new NotificationRepository().markAsRead(n.id, user.id);
    setSession(clientSession(user.id));

    const route = await import('@/app/api/notifications/route');
    const res = await route.GET(new Request('http://localhost/api/notifications?unread=true'));
    const body = await res.json();
    expect(body.data.length).toBe(1);
  });

  it('requires authentication', async () => {
    setSession(null);
    const route = await import('@/app/api/notifications/route');
    const res = await route.GET(new Request('http://localhost/api/notifications'));
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/notifications (integration)', () => {
  it('marks all notifications as read', async () => {
    const user = await seedUser();
    await new NotificationRepository().send({ userId: user.id, type: 'in_app', title: 'A', body: 'a' });
    await new NotificationRepository().send({ userId: user.id, type: 'in_app', title: 'B', body: 'b' });
    setSession(clientSession(user.id));

    const route = await import('@/app/api/notifications/route');
    const res = await route.PATCH(new Request('http://localhost/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ markAllRead: true }),
      headers: { 'content-type': 'application/json' },
    }));
    expect(res.status).toBe(200);
    const unread = await new NotificationRepository().getUnread(user.id);
    expect(unread.length).toBe(0);
  });

  it('rejects an invalid body', async () => {
    const user = await seedUser();
    setSession(clientSession(user.id));
    const route = await import('@/app/api/notifications/route');
    const res = await route.PATCH(new Request('http://localhost/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    }));
    expect(res.status).toBe(400);
  });
});
