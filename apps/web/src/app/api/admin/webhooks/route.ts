import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/http/error-handler";
import { requireAdmin } from "@/lib/auth/require-admin";
import { auth } from "@/app/auth";
import { db } from "@herafino/shared/db";
import { webhooks } from "@herafino/shared/db/schema";
import { eq, desc } from "drizzle-orm";
import { logger } from "@herafino/shared/logger/factory";

export async function GET() {
  try {
    const session = await auth();
    requireAdmin(session);

    const all = await db.select().from(webhooks).orderBy(desc(webhooks.createdAt));
    return NextResponse.json({ data: all });
  } catch (error) {
    logger.error({ error }, "GET /api/admin/webhooks failed");
    return createErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    requireAdmin(session);

    const body = await request.json();
    const { event, url, secret } = body as { event?: string; url?: string; secret?: string };

    if (!event || !url || !secret) {
      return NextResponse.json({ error: "event, url, and secret are required" }, { status: 400 });
    }

    const [created] = await db
      .insert(webhooks)
      .values({
        id: crypto.randomUUID(),
        event,
        url,
        secret,
        isActive: true,
        retryCount: 0,
      })
      .returning();

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    logger.error({ error }, "POST /api/admin/webhooks failed");
    return createErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    requireAdmin(session);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await db.delete(webhooks).where(eq(webhooks.id, id));
    return NextResponse.json({ data: { id } }, { status: 200 });
  } catch (error) {
    logger.error({ error }, "DELETE /api/admin/webhooks failed");
    return createErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    requireAdmin(session);

    const body = await request.json();
    const { id, isActive } = body as { id?: string; isActive?: boolean };

    if (!id || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "id and isActive are required" }, { status: 400 });
    }

    const [updated] = await db
      .update(webhooks)
      .set({ isActive })
      .where(eq(webhooks.id, id))
      .returning();
    return NextResponse.json({ data: updated });
  } catch (error) {
    logger.error({ error }, "PATCH /api/admin/webhooks failed");
    return createErrorResponse(error);
  }
}
