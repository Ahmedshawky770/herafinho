import { eq } from 'drizzle-orm';
import { logger } from '../logger/factory';
import { db } from '../db';
import { complaints } from '../db/schema';
function toDomain(complaint) {
    return {
        ...complaint,
        orderId: complaint.orderId ?? undefined,
        actionTaken: complaint.actionTaken ?? undefined,
        resolvedBy: complaint.resolvedBy ?? undefined,
        resolvedAt: complaint.resolvedAt ?? undefined,
        evidenceUrls: complaint.evidenceUrls ?? [],
    };
}
function buildEvent(event) {
    return { id: crypto.randomUUID(), ...event };
}
export class ComplaintsRepository {
    outbox;
    constructor(outbox) {
        this.outbox = outbox;
    }
    async appendOutbox(event) {
        if (this.outbox) {
            await this.outbox.append(event);
        }
    }
    async findById(id) {
        const complaint = await db.query.complaints.findFirst({
            where: eq(complaints.id, id),
        });
        return complaint ? toDomain(complaint) : null;
    }
    async findByReporterId(reporterId) {
        const result = await db.query.complaints.findMany({
            where: eq(complaints.reporterId, reporterId),
            orderBy: (c, { desc }) => [desc(c.createdAt)],
        });
        return result.map(toDomain);
    }
    async findByAgainstUserId(againstUserId) {
        const result = await db.query.complaints.findMany({
            where: eq(complaints.againstUserId, againstUserId),
            orderBy: (c, { desc }) => [desc(c.createdAt)],
        });
        return result.map(toDomain);
    }
    async findPending() {
        const result = await db.query.complaints.findMany({
            where: eq(complaints.status, 'pending'),
            orderBy: (c, { asc }) => [asc(c.createdAt)],
        });
        return result.map(toDomain);
    }
    async create(complaint) {
        const [created] = await db.insert(complaints).values(complaint).returning();
        logger.info({ complaintId: created.id, reporterId: created.reporterId }, 'Complaint filed');
        await this.appendOutbox({
            id: crypto.randomUUID(),
            name: 'complaint.filed',
            payload: { complaintId: created.id, reporterId: created.reporterId, againstUserId: created.againstUserId, reason: created.reason },
            metadata: { occurredAt: new Date() },
        });
        return toDomain(created);
    }
    async updateStatus(id, status) {
        const [updated] = await db.update(complaints).set({ status, updatedAt: new Date() }).where(eq(complaints.id, id)).returning();
        if (status !== 'pending') {
            await this.appendOutbox({
                id: crypto.randomUUID(),
                name: `complaint.${status}`,
                payload: { complaintId: updated.id, status },
                metadata: { occurredAt: new Date() },
            });
        }
        return toDomain(updated);
    }
    async resolve(id, action, resolvedById) {
        const [updated] = await db.update(complaints).set({
            status: 'resolved',
            actionTaken: action,
            resolvedBy: resolvedById,
            resolvedAt: new Date(),
            updatedAt: new Date(),
        }).where(eq(complaints.id, id)).returning();
        await this.appendOutbox({
            id: crypto.randomUUID(),
            name: 'complaint.resolved',
            payload: { complaintId: updated.id, action },
            metadata: { actorId: resolvedById, occurredAt: new Date() },
        });
        return toDomain(updated);
    }
    async findAll() {
        const result = await db.query.complaints.findMany({
            orderBy: (c, { desc }) => [desc(c.createdAt)],
        });
        return result.map(toDomain);
    }
}
export { ComplaintsRepository as ComplaintRepository };
