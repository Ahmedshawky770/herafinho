import { NextResponse } from 'next/server';

// Intentionally public: this endpoint is polled by the orchestrator / load
// balancer (Docker healthcheck, k8s liveness/readiness) and must not require
// authentication. It only reports aggregate component status, never secrets.
export async function GET() {
  try {
    const checks = {
      database: await checkDatabase(),
      valkey: await checkValkey(),
    };

    const allHealthy = Object.values(checks).every((c) => c.healthy);
    return NextResponse.json(
      {
        status: allHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        checks,
      },
      { status: allHealthy ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        // Never leak internal error details to unauthenticated callers; the
        // full error is already captured by Sentry for operators.
        error: process.env.NODE_ENV === 'production' ? 'internal error' : error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

async function checkDatabase(): Promise<{ healthy: boolean; message?: string }> {
  try {
    const { db } = await import('@herafino/shared/db');
    const { users } = await import('@herafino/shared/db/schema');
    await db.select().from(users).limit(1);
    return { healthy: true };
  } catch (error) {
    return { healthy: false, message: error instanceof Error ? error.message : String(error) };
  }
}

async function checkValkey(): Promise<{ healthy: boolean; message?: string }> {
  try {
    const { getValkeyClient } = await import('@herafino/shared/valkey/client');
    const client = getValkeyClient();
    await client.ping();
    return { healthy: true };
  } catch (error) {
    return { healthy: false, message: error instanceof Error ? error.message : String(error) };
  }
}