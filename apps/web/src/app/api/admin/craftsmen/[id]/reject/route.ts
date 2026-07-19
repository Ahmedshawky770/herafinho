import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/http/error-handler";
import { requireAdmin } from "@/lib/auth/require-admin";
import { auth } from "@/app/auth";
import { CraftsmanRepository } from "@herafino/shared/repositories/craftsman.repository";
import { OutboxRepository } from "@herafino/shared/events/outbox-repository";
import { logger } from "@herafino/shared/logger/factory";

const craftsmanRepository = new CraftsmanRepository(new OutboxRepository());

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const session = await auth();
    requireAdmin(session);

    const { id } = await params;

    if (!body.reason || typeof body.reason !== "string") {
      return NextResponse.json({ error: "reason is required" }, { status: 400 });
    }

    await craftsmanRepository.reject(id, body.reason, session.user.id);

    return NextResponse.json({ data: { rejected: true } }, { status: 200 });
  } catch (error) {
    logger.error({ error }, "POST /api/admin/craftsmen/[id]/reject failed");
    return createErrorResponse(error);
  }
}
