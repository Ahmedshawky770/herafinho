import { eq, and } from 'drizzle-orm';
import { logger } from '../logger/factory';
import { db } from '../db';
import { craftsmanProfiles } from '../db/schema';
const EARTH_RADIUS_KM = 6371;
function toDomain(profile) {
    return {
        ...profile,
        transportPhotos: profile.transportPhotos ?? [],
        vehicleNumber: profile.vehicleNumber ?? undefined,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        freezeUntil: profile.freezeUntil ?? undefined,
        freezeReason: profile.freezeReason ?? undefined,
        rejectionReason: profile.rejectionReason ?? undefined,
        reviewedBy: profile.reviewedBy ?? undefined,
        reviewedAt: profile.reviewedAt ?? undefined,
    };
}
function buildEvent(event) {
    return {
        id: crypto.randomUUID(),
        ...event,
    };
}
import { computeFreezeState } from '../moderation';
export function haversine(lat1, lng1, lat2, lng2) {
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
}
export class CraftsmanRepository {
    outbox;
    constructor(outbox) {
        this.outbox = outbox;
    }
    async appendOutbox(event) {
        if (this.outbox) {
            await this.outbox.append(event);
        }
    }
    async findProfileByUserId(userId) {
        const profile = await db.query.craftsmanProfiles.findFirst({
            where: eq(craftsmanProfiles.userId, userId),
        });
        return profile ? toDomain(profile) : null;
    }
    async findProfileById(id) {
        const profile = await db.query.craftsmanProfiles.findFirst({
            where: eq(craftsmanProfiles.id, id),
        });
        return profile ? toDomain(profile) : null;
    }
    async createProfile(profile) {
        const [created] = await db.insert(craftsmanProfiles).values({
            ...profile,
            transportPhotos: profile.transportPhotos ?? [],
        }).returning();
        logger.info({ profileId: created.id, userId: created.userId, craftType: created.craftType }, 'Craftsman profile created');
        await this.appendOutbox({
            id: crypto.randomUUID(),
            name: 'craftsman.registered',
            payload: { userId: created.userId, profileId: created.id, craftType: created.craftType },
            metadata: { occurredAt: new Date() },
        });
        return toDomain(created);
    }
    async updateProfile(userId, data) {
        const current = await this.findProfileByUserId(userId);
        if (!current)
            throw new Error('Craftsman profile not found');
        const changedFields = Object.keys(data).filter((key) => {
            if (key === 'updatedAt')
                return false;
            return JSON.stringify(current[key]) !== JSON.stringify(data[key]);
        });
        const [updated] = await db.update(craftsmanProfiles).set(data).where(eq(craftsmanProfiles.userId, userId)).returning();
        logger.info({ profileId: updated.id, userId, fields: Object.keys(data) }, 'Craftsman profile updated');
        if (changedFields.length > 0) {
            await this.appendOutbox({
                id: crypto.randomUUID(),
                name: 'craftsman.profile_updated',
                payload: { profileId: updated.id, userId: updated.userId, changedFields },
                metadata: { occurredAt: new Date() },
            });
        }
        return toDomain(updated);
    }
    async approve(id, adminId) {
        await db.update(craftsmanProfiles).set({ status: 'approved', reviewedBy: adminId, reviewedAt: new Date() }).where(eq(craftsmanProfiles.id, id));
        logger.info({ profileId: id, adminId }, 'Craftsman profile approved');
        const profile = await this.findProfileById(id);
        if (profile) {
            await this.appendOutbox({
                id: crypto.randomUUID(),
                name: 'craftsman.approved',
                payload: { profileId: profile.id, userId: profile.userId, adminId },
                metadata: { actorId: adminId, occurredAt: new Date() },
            });
        }
    }
    async reject(id, reason, adminId) {
        await db.update(craftsmanProfiles).set({ status: 'rejected', rejectionReason: reason, reviewedBy: adminId, reviewedAt: new Date() }).where(eq(craftsmanProfiles.id, id));
        logger.info({ profileId: id, adminId, reason }, 'Craftsman profile rejected');
        const profile = await this.findProfileById(id);
        if (profile) {
            await this.appendOutbox({
                id: crypto.randomUUID(),
                name: 'craftsman.rejected',
                payload: { profileId: profile.id, userId: profile.userId, reason, adminId },
                metadata: { actorId: adminId, occurredAt: new Date() },
            });
        }
    }
    async freeze(id, until, reason, adminId) {
        const current = await this.findProfileById(id);
        if (!current)
            throw new Error('Craftsman profile not found');
        const { freezeCount, status, banned } = computeFreezeState(current.freezeCount);
        const [updated] = await db.update(craftsmanProfiles).set({ status, freezeUntil: until, freezeReason: reason, freezeCount }).where(eq(craftsmanProfiles.id, id)).returning();
        logger.info({ profileId: id, adminId, freezeCount, until: until.toISOString(), banned }, 'Craftsman profile frozen');
        await this.appendOutbox({
            id: crypto.randomUUID(),
            name: banned ? 'craftsman.banned' : 'craftsman.frozen',
            payload: { profileId: updated.id, userId: updated.userId, freezeUntil: until, reason, freezeCount, adminId },
            metadata: { actorId: adminId, occurredAt: new Date() },
        });
        return toDomain(updated);
    }
    async unfreeze(id, adminId) {
        const [updated] = await db.update(craftsmanProfiles).set({ status: 'pending', freezeUntil: null, freezeReason: null }).where(eq(craftsmanProfiles.id, id)).returning();
        logger.info({ profileId: id, adminId }, 'Craftsman profile unfrozen');
        await this.appendOutbox({
            id: crypto.randomUUID(),
            name: 'craftsman.unfrozen',
            payload: { profileId: updated.id, userId: updated.userId, adminId },
            metadata: { actorId: adminId, occurredAt: new Date() },
        });
        return toDomain(updated);
    }
    async ban(id, adminId) {
        const profile = await this.findProfileById(id);
        await db.update(craftsmanProfiles).set({ status: 'rejected', freezeReason: 'permanent_ban' }).where(eq(craftsmanProfiles.id, id));
        logger.info({ profileId: id, adminId }, 'Craftsman profile banned');
        if (profile) {
            await this.appendOutbox({
                id: crypto.randomUUID(),
                name: 'craftsman.banned',
                payload: { profileId: profile.id, userId: profile.userId, reason: 'permanent_ban', adminId },
                metadata: { actorId: adminId, occurredAt: new Date() },
            });
        }
    }
    async incrementFreezeCount(id) {
        const current = await this.findProfileById(id);
        if (!current)
            throw new Error('Craftsman profile not found');
        const newCount = current.freezeCount + 1;
        const [updated] = await db.update(craftsmanProfiles).set({ freezeCount: newCount }).where(eq(craftsmanProfiles.id, id)).returning();
        logger.info({ profileId: id, freezeCount: newCount }, 'Freeze count incremented');
        await this.appendOutbox({
            id: crypto.randomUUID(),
            name: 'craftsman.freeze_count_incremented',
            payload: { profileId: updated.id, userId: updated.userId, freezeCount: newCount },
            metadata: { occurredAt: new Date() },
        });
        return updated.freezeCount;
    }
    async getPendingProfiles() {
        const profiles = await db.query.craftsmanProfiles.findMany({
            where: eq(craftsmanProfiles.status, 'pending'),
            orderBy: (profiles, { asc }) => [asc(profiles.createdAt)],
        });
        return profiles.map(toDomain);
    }
    async findApprovedByCraftType(craftType, _lat, _lng, _radiusKm) {
        const profiles = await db.query.craftsmanProfiles.findMany({
            where: and(eq(craftsmanProfiles.craftType, craftType), eq(craftsmanProfiles.status, 'approved'), eq(craftsmanProfiles.isAvailable, true)),
        });
        return profiles.map(toDomain);
    }
    async searchNearbyCraftsmen(craftType, clientLat, clientLng, radiusKm) {
        const lat = parseFloat(clientLat);
        const lng = parseFloat(clientLng);
        if (Number.isNaN(lat) || Number.isNaN(lng))
            throw new Error('Invalid latitude or longitude');
        if (radiusKm <= 0)
            throw new Error('Radius must be greater than 0');
        const profiles = await db.query.craftsmanProfiles.findMany({
            where: and(eq(craftsmanProfiles.craftType, craftType), eq(craftsmanProfiles.status, 'approved'), eq(craftsmanProfiles.isAvailable, true)),
            with: { user: { columns: { id: false, name: true } } },
        });
        const results = [];
        for (const profile of profiles) {
            const workshopLat = parseFloat(profile.workshopLatitude);
            const workshopLng = parseFloat(profile.workshopLongitude);
            if (Number.isNaN(workshopLat) || Number.isNaN(workshopLng))
                continue;
            const distanceKm = haversine(lat, lng, workshopLat, workshopLng);
            if (distanceKm <= radiusKm) {
                const user = profile.user;
                const userName = user?.name ?? 'حرفي بدون اسم';
                results.push({ profile: toDomain(profile), distanceKm: Math.round(distanceKm * 100) / 100, name: userName });
            }
        }
        return results.sort((a, b) => a.distanceKm - b.distanceKm);
    }
}
