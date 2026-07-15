#!/usr/bin/env node
'use strict';

import { startWorkerService } from './worker';
import { logger } from '@herafino/shared/logger/factory';

const SHUTDOWN_SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const;

async function main(): Promise<void> {
  logger.info('[worker] Harfino Background Worker Service');
  logger.info(
    {
      pid: process.pid,
      node: process.version,
      nodeEnv: process.env.NODE_ENV || 'development',
      valkeyUrl: process.env.VALKEY_URL || 'valkey://localhost:6379',
    },
    '[worker] startup'
  );

  let isShuttingDown = false;

  const gracefulShutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) {
      logger.error({ signal }, '[worker] Already shutting down, forcing exit');
      process.exit(1);
    }

    isShuttingDown = true;
    logger.info({ signal }, '[worker] Initiating graceful shutdown');

    try {
      logger.info('[worker] Graceful shutdown complete');
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
    logger.error(
      { reason: reason instanceof Error ? reason.message : String(reason) },
      '[worker] Unhandled rejection'
    );
  });

  process.on('uncaughtException', (err) => {
    logger.error({ message: err.message, stack: err.stack }, '[worker] Uncaught exception');
    void gracefulShutdown('uncaughtException');
  });

  try {
    await startWorkerService();
    logger.info('[worker] Service fully started');
  } catch (err) {
    logger.error(
      { message: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : '' },
      '[worker] Failed to start'
    );
    process.exit(1);
  }
}

void main();
