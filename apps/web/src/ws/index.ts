#!/usr/bin/env node
'use strict';

import { HarfinoWebSocketServer } from './server';

const SHUTDOWN_SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const;

async function main(): Promise<void> {
  console.log('[ws] ────────────────────────────────────────');
  console.log('[ws] Harfino WebSocket Server');
  console.log(`[ws] PID: ${process.pid}`);
  console.log(`[ws] Node: ${process.version}`);
  console.log(`[ws] Port: ${process.env.WS_PORT || 3001}`);
  console.log('[ws] ────────────────────────────────────────\n');

  let isShuttingDown = false;

  const gracefulShutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) {
      console.error(`[ws] Forced exit from ${signal}`);
      process.exit(1);
    }

    isShuttingDown = true;
    console.log(`\n[ws] Received ${signal}, shutting down gracefully...`);

    try {
      console.log('[ws] Goodbye');
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
    console.error(`[ws] Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`);
  });

  process.on('uncaughtException', (err: Error) => {
    console.error(`[ws] Uncaught exception: ${err.message}`);
    console.error(err.stack);
    void gracefulShutdown('uncaughtException');
  });

  try {
    const wsServer = new HarfinoWebSocketServer();
    await wsServer.start();

    console.log(`[ws] ✅ WebSocket server running on port ${process.env.WS_PORT || 3001}`);
    console.log('[ws] Waiting for connections...\n');

    // Export for external use (e.g., API routes can import and call notifyUser)
    (global as Record<string, unknown>).__wsServer = wsServer;

    await new Promise(() => {});
  } catch (err) {
    console.error(
      `[ws] ❌ Failed to start: ${err instanceof Error ? err.message : String(err)}`
    );
    console.error(err instanceof Error ? err.stack : '');
    process.exit(1);
  }
}

void main();
