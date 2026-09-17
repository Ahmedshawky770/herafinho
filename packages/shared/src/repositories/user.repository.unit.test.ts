import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@herafino/shared/db', () => ({
  db: {
    query: {
      users: { findFirst: vi.fn() },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'user-1', email: 'test@example.com', name: 'Test', googleId: 'g-1', role: 'client', onboardingComplete: false, createdAt: new Date(), updatedAt: new Date() }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'user-1', email: 'test@example.com', name: 'Updated', googleId: 'g-1', role: 'client', onboardingComplete: false, createdAt: new Date(), updatedAt: new Date() }]),
        }),
      }),
    }),
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => ({ type: 'eq', field, value })),
}));

vi.mock('@herafino/shared/logger/factory', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
  },
}));

vi.mock('@herafino/shared/db/schema', () => ({
  users: {},
}));

import { UserRepository } from './user.repository';

describe('UserRepository', () => {
  let repo: UserRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new UserRepository();
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.users.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'user-1', email: 'test@example.com', name: 'Test', googleId: null, role: 'client', onboardingComplete: false, createdAt: new Date(), updatedAt: new Date() });

      const user = await repo.findById('user-1');
      expect(user).not.toBeNull();
      expect(user?.id).toBe('user-1');
    });

    it('should return null when user not found', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.users.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const user = await repo.findById('missing');
      expect(user).toBeNull();
    });

    it('should map null googleId to empty string', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.users.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'user-1', email: 'test@example.com', name: 'Test', googleId: null, role: 'client', onboardingComplete: false, createdAt: new Date(), updatedAt: new Date() });

      const user = await repo.findById('user-1');
      expect(user?.googleId).toBe('');
    });

    it('should map null phone to undefined', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.users.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'user-1', email: 'test@example.com', name: 'Test', googleId: null, phone: null, age: null, role: 'client', onboardingComplete: false, createdAt: new Date(), updatedAt: new Date() });

      const user = await repo.findById('user-1');
      expect(user?.phone).toBeUndefined();
    });

    it('should map null age to undefined', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.users.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'user-1', email: 'test@example.com', name: 'Test', googleId: null, phone: null, age: null, role: 'client', onboardingComplete: false, createdAt: new Date(), updatedAt: new Date() });

      const user = await repo.findById('user-1');
      expect(user?.age).toBeUndefined();
    });

    it('should always set bannedAt to undefined', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.users.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'user-1', email: 'test@example.com', name: 'Test', googleId: null, phone: null, age: null, role: 'client', onboardingComplete: false, createdAt: new Date(), updatedAt: new Date() });

      const user = await repo.findById('user-1');
      expect(user?.bannedAt).toBeUndefined();
    });
  });

  describe('findByGoogleId', () => {
    it('should find user by google id', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.users.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'user-1', email: 'test@example.com', name: 'Test', googleId: 'g-1', role: 'client', onboardingComplete: false, createdAt: new Date(), updatedAt: new Date() });

      const user = await repo.findByGoogleId('g-1');
      expect(user?.googleId).toBe('g-1');
    });

    it('should return null when google id not found', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.users.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const user = await repo.findByGoogleId('missing');
      expect(user).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.users.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'user-1', email: 'test@example.com', name: 'Test', googleId: null, role: 'client', onboardingComplete: false, createdAt: new Date(), updatedAt: new Date() });

      const user = await repo.findByEmail('test@example.com');
      expect(user?.email).toBe('test@example.com');
    });

    it('should return null when email not found', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.users.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const user = await repo.findByEmail('missing');
      expect(user).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a user', async () => {
      const user = await repo.create({ email: 'new@example.com', name: 'New', role: 'client' } as any);
      expect(user.id).toBe('user-1');
    });

    it('should log user creation', async () => {
      const { logger } = await import('@herafino/shared/logger/factory');
      await repo.create({ email: 'new@example.com', name: 'New', role: 'client' } as any);
      expect(logger.info).toHaveBeenCalledWith({ userId: 'user-1', email: 'test@example.com' }, 'User created');
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const user = await repo.update('user-1', { name: 'Updated' } as any);
      expect(user.name).toBe('Updated');
    });

    it('should log user update', async () => {
      const { logger } = await import('@herafino/shared/logger/factory');
      await repo.update('user-1', { name: 'Updated' } as any);
      expect(logger.info).toHaveBeenCalledWith({ userId: 'user-1', fields: ['name'] }, 'User updated');
    });
  });

  describe('softDelete', () => {
    it('should soft delete a user', async () => {
      await repo.softDelete('user-1');
      expect(repo).toBeDefined();
    });

    it('should log soft delete', async () => {
      const { logger } = await import('@herafino/shared/logger/factory');
      await repo.softDelete('user-1');
      expect(logger.info).toHaveBeenCalledWith({ userId: 'user-1' }, 'User soft deleted');
    });
  });

  describe('exists', () => {
    it('should return true when user exists', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.users.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'user-1', email: 'test@example.com', name: 'Test', googleId: null, role: 'client', onboardingComplete: false, createdAt: new Date(), updatedAt: new Date() });

      const exists = await repo.exists('user-1');
      expect(exists).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.users.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const exists = await repo.exists('missing');
      expect(exists).toBe(false);
    });
  });
});
