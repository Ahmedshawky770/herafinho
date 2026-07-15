#!/usr/bin/env node
'use strict';

import { HarfinoWebSocketServer } from './server';
import { logger } from '@herafino/shared/logger/factory';

const SHUTDOWN_SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const;

async function main(): Promise<void> {
  logger.info('[ws] Harfino WebSocket Server');
  logger.info({ pid: process.pid, node: process.version, port: process.env.WS_PORT || 3001 }, '[ws] startup');

  let isShuttingDown = false;

  const gracefulShutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) {
      logger.error({ signal }, '[ws] Forced exit');
      process.exit(1);
    }

    isShuttingDown = true;
    logger.info({ signal }, '[ws] Received shutdown signal, shutting down gracefully');

    try {
      logger.info('[ws] Goodbye');
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
    logger.error({ reason: reason instanceof Error ? reason.message : String(reason) }, '[ws] Unhandled rejection');
  });

  process.on('uncaughtException', (err: Error) => {
    logger.error({ message: err.message, stack: err.stack }, '[ws] Uncaught exception');
    void gracefulShutdown('uncaughtException');
  });

  try {
    const wsServer = new HarfinoWebSocketServer();
    await wsServer.start();

    logger.info({ port: process.env.WS_PORT || 3001 }, '[ws] WebSocket server running');
    logger.info('[ws] Waiting for connections');

    // Export for external use (e.g., API routes can import and call notifyUser)
    (global as Record<string, unknown>).__wsServer = wsServer;

    await new Promise(() => {});
  } catch (err) {
    logger.error(
      { message: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : '' },
      '[ws] Failed to start'
    );
    process.exit(1);
  }
}

void main();
