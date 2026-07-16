import { describe, it, expect } from 'vitest';
import { UserRepository } from '@herafino/shared/repositories/user.repository';
import { NotificationRepository } from '@herafino/shared/repositories/notification.repository';
import { setupIntegrationDatabase, withCleanDatabase, randomId } from './helpers/db';
import { describeIntegration } from './helpers/db';
import { notifications } from '@herafino/shared/db/schema';

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

describeIntegration('NotificationRepository (integration)', () => {
  it('sends a notification', async () => {
    const user = await seedUser();
    const notif = await new NotificationRepository().send({
      userId: user.id,
      type: 'in_app',
      title: 'Welcome',
      body: 'Hello',
    });
    expect(notif.id).toBeTruthy();
    expect(notif.read).toBe(false);
  });

  it('finds a notification by id scoped to the owner', async () => {
    const user = await seedUser();
    const notif = await new NotificationRepository().send({
      userId: user.id,
      type: 'in_app',
      title: 'T',
      body: 'B',
    });
    expect((await new NotificationRepository().findById(notif.id, user.id))?.id).toBe(notif.id);
    // a different user cannot read it
    const other = await seedUser();
    expect(await new NotificationRepository().findById(notif.id, other.id)).toBeNull();
  });

  it('lists notifications for a user', async () => {
    const user = await seedUser();
    await new NotificationRepository().send({ userId: user.id, type: 'in_app', title: 'A', body: 'a' });
    await new NotificationRepository().send({ userId: user.id, type: 'email', title: 'B', body: 'b' });
    expect((await new NotificationRepository().getByUserId(user.id)).length).toBe(2);
  });

  it('returns unread notifications only', async () => {
    const user = await seedUser();
    const notif = await new NotificationRepository().send({ userId: user.id, type: 'in_app', title: 'A', body: 'a' });
    await new NotificationRepository().markAsRead(notif.id, user.id);
    await new NotificationRepository().send({ userId: user.id, type: 'in_app', title: 'B', body: 'b' });
    expect((await new NotificationRepository().getUnread(user.id)).length).toBe(1);
  });

  it('marks a single notification as read', async () => {
    const user = await seedUser();
    const notif = await new NotificationRepository().send({ userId: user.id, type: 'in_app', title: 'A', body: 'a' });
    await new NotificationRepository().markAsRead(notif.id, user.id);
    const fetched = await new NotificationRepository().findById(notif.id, user.id);
    expect(fetched?.read).toBe(true);
    expect(fetched?.readAt).toBeTruthy();
  });

  it('marks all notifications as read', async () => {
    const user = await seedUser();
    await new NotificationRepository().send({ userId: user.id, type: 'in_app', title: 'A', body: 'a' });
    await new NotificationRepository().send({ userId: user.id, type: 'in_app', title: 'B', body: 'b' });
    await new NotificationRepository().markAllAsRead(user.id);
    expect((await new NotificationRepository().getUnread(user.id)).length).toBe(0);
  });

  it('deletes a notification', async () => {
    const user = await seedUser();
    const notif = await new NotificationRepository().send({ userId: user.id, type: 'in_app', title: 'A', body: 'a' });
    await new NotificationRepository().delete(notif.id);
    expect(await new NotificationRepository().findById(notif.id, user.id)).toBeNull();
  });

  it('isolation: notifications table is truncated between tests', async () => {
    expect((await ctx.db.select().from(notifications)).length).toBe(1);
  });
});
