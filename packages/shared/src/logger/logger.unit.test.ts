import { describe, it, expect } from 'vitest';
import { logger } from '@herafino/shared/logger/factory';

describe('logger factory', () => {
  it('returns a pino-compatible logger with core methods', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('emits at info level without throwing', () => {
    expect(() => logger.info({ test: true }, 'logger factory smoke test')).not.toThrow();
  });
});
