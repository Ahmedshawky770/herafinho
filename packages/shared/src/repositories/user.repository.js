import { eq } from 'drizzle-orm';
import { logger } from '../logger/factory';
import { db } from '../db';
import { users } from '../db/schema';
function toDomain(user) {
    return {
        ...user,
        googleId: user.googleId ?? '',
        phone: user.phone ?? undefined,
        age: user.age ?? undefined,
        bannedAt: undefined,
    };
}
export class UserRepository {
    async findById(id) {
        const user = await db.query.users.findFirst({
            where: eq(users.id, id),
        });
        return user ? toDomain(user) : null;
    }
    async findByGoogleId(googleId) {
        const user = await db.query.users.findFirst({
            where: eq(users.googleId, googleId),
        });
        return user ? toDomain(user) : null;
    }
    async findByEmail(email) {
        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });
        return user ? toDomain(user) : null;
    }
    async create(user) {
        const [created] = await db.insert(users).values(user).returning();
        logger.info({ userId: created.id, email: created.email }, 'User created');
        return toDomain(created);
    }
    async update(id, data) {
        const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
        logger.info({ userId: id, fields: Object.keys(data) }, 'User updated');
        return toDomain(updated);
    }
    async softDelete(id) {
        await db.update(users).set({ isDeleted: true }).where(eq(users.id, id));
        logger.info({ userId: id }, 'User soft deleted');
    }
    async exists(id) {
        const user = await this.findById(id);
        return user !== null;
    }
}
