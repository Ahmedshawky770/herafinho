import { createClient } from 'valkey';
import { logger } from '../logger/factory';

export const valkey = createClient({
  url: process.env.VALKEY_URL || 'valkey://localhost:6379',
});

valkey.on('connect', () => {
  logger.info({ component: 'valkey' }, 'Connected to Valkey');
});

valkey.on('error', (err: Error) => {
  logger.error({ component: 'valkey', error: err.message }, 'Valkey error');
});

if (process.env.NODE_ENV !== 'test') {
  valkey.connect().catch((err: Error) => {
    logger.fatal({ component: 'valkey', error: err }, 'Failed to connect to Valkey');
  });
}

export type ValkeyClient = typeof valkey;
