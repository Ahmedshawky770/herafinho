import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/http/error-handler";
import { requireAdmin } from "@/lib/auth/require-admin";
import { auth } from "@/app/auth";
import { ComplaintRepository } from "@herafino/shared/repositories/complaint.repository";
import { OutboxRepository } from "@herafino/shared/events/outbox-repository";
import { logger } from "@herafino/shared/logger/factory";

const complaintRepository = new ComplaintRepository(new OutboxRepository());

export async function GET() {
  try {
    const session = await auth();
    requireAdmin(session);

    const complaints = await complaintRepository.findPending();
    return NextResponse.json({ data: complaints });
  } catch (error) {
    logger.error({ error }, "GET /api/admin/complaints/pending failed");
    return createErrorResponse(error);
  }
}
