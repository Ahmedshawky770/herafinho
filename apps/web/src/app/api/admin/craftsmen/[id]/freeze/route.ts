import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/http/error-handler";
import { requireAdmin } from "@/lib/auth/require-admin";
import { auth } from "@/app/auth";
import { CraftsmanRepository } from "@herafino/shared/repositories/craftsman.repository";
import { UserRepository } from "@herafino/shared/repositories/user.repository";
import { OutboxRepository } from "@herafino/shared/events/outbox-repository";
import { applyBanCascade } from "@herafino/shared/services/moderation.service";
import { FREEZE_BAN_THRESHOLD } from "@herafino/shared/moderation";
import { logger } from "@herafino/shared/logger/factory";

const craftsmanRepository = new CraftsmanRepository(new OutboxRepository());
const userRepository = new UserRepository();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const session = await auth();
    requireAdmin(session);

    const { id } = await params;

    if (!body.reason || typeof body.reason !== "string") {
      return NextResponse.json({ error: "reason is required" }, { status: 400 });
    }

    const freezeUntil = body.freezeUntil
      ? new Date(body.freezeUntil)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const updated = await craftsmanRepository.freeze(id, freezeUntil, body.reason, session.user.id);

    if (updated.freezeCount >= FREEZE_BAN_THRESHOLD) {
      await applyBanCascade(
        userRepository,
        updated.userId,
        updated.id,
        updated.freezeCount,
        body.reason,
        session.user.id
      );
    }

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    logger.error({ error }, "POST /api/admin/craftsmen/[id]/freeze failed");
    return createErrorResponse(error);
  }
}
