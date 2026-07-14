import { afterEach } from 'vitest';

try {
  const { cleanup } = require('@testing-library/react');
  afterEach(() => {
    cleanup();
  });
} catch {
  // @testing-library/react is not installed at the root level
}