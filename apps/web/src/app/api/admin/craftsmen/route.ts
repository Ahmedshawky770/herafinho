import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/http/error-handler";
import { requireAdmin } from "@/lib/auth/require-admin";
import { auth } from "@/app/auth";
import { CraftsmanRepository } from "@herafino/shared/repositories/craftsman.repository";
import { logger } from "@herafino/shared/logger/factory";
import type { CraftsmanStatus } from "@herafino/types";

const craftsmanRepository = new CraftsmanRepository();

export async function GET(request: Request) {
  try {
    const session = await auth();
    requireAdmin(session);

    const url = new URL(request.url);
    const status = url.searchParams.get("status") as CraftsmanStatus | null;

    const profiles = await craftsmanRepository.findAll(status ?? undefined);
    return NextResponse.json({ data: profiles });
  } catch (error) {
    logger.error({ error }, "GET /api/admin/craftsmen failed");
    return createErrorResponse(error);
  }
}
