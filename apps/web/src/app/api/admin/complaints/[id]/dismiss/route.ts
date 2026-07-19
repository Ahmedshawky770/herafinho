import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/http/error-handler";
import { requireAdmin } from "@/lib/auth/require-admin";
import { auth } from "@/app/auth";
import { ComplaintRepository } from "@herafino/shared/repositories/complaint.repository";
import { OutboxRepository } from "@herafino/shared/events/outbox-repository";
import { logger } from "@herafino/shared/logger/factory";

const complaintRepository = new ComplaintRepository(new OutboxRepository());

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    requireAdmin(session);

    const { id } = await params;
    const complaint = await complaintRepository.findById(id);
    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    const updated = await complaintRepository.updateStatus(id, "dismissed");
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    logger.error({ error }, "POST /api/admin/complaints/[id]/dismiss failed");
    return createErrorResponse(error);
  }
}
