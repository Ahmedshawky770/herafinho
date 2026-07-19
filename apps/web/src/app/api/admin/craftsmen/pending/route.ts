import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/http/error-handler";
import { requireAdmin } from "@/lib/auth/require-admin";
import { auth } from "@/app/auth";
import { CraftsmanRepository } from "@herafino/shared/repositories/craftsman.repository";
import { OutboxRepository } from "@herafino/shared/events/outbox-repository";
import { logger } from "@herafino/shared/logger/factory";

const craftsmanRepository = new CraftsmanRepository(new OutboxRepository());

export async function GET() {
  try {
    const session = await auth();
    requireAdmin(session);

    const profiles = await craftsmanRepository.getPendingProfiles();
    return NextResponse.json({ data: profiles });
  } catch (error) {
    logger.error({ error }, "GET /api/admin/craftsmen/pending failed");
    return createErrorResponse(error);
  }
}
