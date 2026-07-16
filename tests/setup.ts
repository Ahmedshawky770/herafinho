import { afterEach } from 'vitest';

// Provide a fallback DATABASE_URL / VALKEY_URL so module-level imports of the
// data layer (which construct a client at import time) don't throw in
// environments without infrastructure. Real integration suites are gated by
// `RUN_INTEGRATION=1` (see tests/integration/helpers/db.ts), so they remain
// skipped locally and only run in CI where the services are provisioned.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgres://herafino:herafino@localhost:5432/herafino_test';
}
if (!process.env.VALKEY_URL) {
  process.env.VALKEY_URL = 'valkey://localhost:6379';
}

try {
  const { cleanup } = require('@testing-library/react');
  afterEach(() => {
    cleanup();
  });
} catch {
  // @testing-library/react is not installed at the root level
}
