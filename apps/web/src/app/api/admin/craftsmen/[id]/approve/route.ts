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
    const session = await auth();
    requireAdmin(session);

    const { id } = await params;
    await craftsmanRepository.approve(id, session.user.id);

    return NextResponse.json({ data: { approved: true } }, { status: 200 });
  } catch (error) {
    logger.error({ error }, "POST /api/admin/craftsmen/[id]/approve failed");
    return createErrorResponse(error);
  }
}
