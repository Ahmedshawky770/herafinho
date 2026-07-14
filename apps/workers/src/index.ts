#!/usr/bin/env node
'use strict';

import { startWorkerService } from './worker';

const SHUTDOWN_SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const;

async function main(): Promise<void> {
  console.log(`[worker] ──────────────────────────────────────`);
  console.log(`[worker] Harfino Background Worker Service`);
  console.log(`[worker] PID: ${process.pid}`);
  console.log(`[worker] Node: ${process.version}`);
  console.log(`[worker] NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[worker] VALKEY_URL: ${process.env.VALKEY_URL || 'valkey://localhost:6379'}`);
  console.log(`[worker] ──────────────────────────────────────\n`);

  let isShuttingDown = false;

  const gracefulShutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) {
      console.log(`[worker] Received ${signal} — already shutting down, forcing exit`);
      process.exit(1);
    }

    isShuttingDown = true;
    console.log(`[worker] Received ${signal} — initiating graceful shutdown...`);

    try {
      console.log('[worker] Graceful shutdown complete');
      process.exit(0);
    } catch {
      process.exit(1);
    }
  };

  for (const signal of SHUTDOWN_SIGNALS) {
    process.on(signal, () => {
      void gracefulShutdown(signal);
    });
  }

  process.on('unhandledRejection', (reason) => {
    console.error(`[worker] Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`);
  });

  process.on('uncaughtException', (err) => {
    console.error(`[worker] Uncaught exception: ${err.message}`);
    console.error(err.stack);
    void gracefulShutdown('uncaughtException');
  });

  try {
    await startWorkerService();
    console.log('\n[worker] ✅ Service fully started');
  } catch (err) {
    console.error(
      `[worker] ❌ Failed to start: ${err instanceof Error ? err.message : String(err)}`
    );
    console.error(err instanceof Error ? err.stack : '');
    process.exit(1);
  }
}

void main();
