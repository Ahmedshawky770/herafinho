# Testing Strategy - Harfino

```mermaid
pyramid
    title Testing Pyramid - Harfino
    
    row_1: 10% - E2E Tests<br/>[Playwright]<br/>Full browser automation<br/>Critical user flows
    row_2: 20% - Integration Tests<br/>[Vitest + Supertest]<br/>API contracts<br/>Module boundaries
    row_3: 70% - Unit Tests<br/>[Vitest]<br/>Pure business logic<br/>Domain layer
```

---

## Test Environment

### docker-compose.test.yml

```yaml
# docker-compose.test.yml
# Harfino Testing Environment

services:
  postgres_test:
    image: postgres:16-alpine
    container_name: harfino_test_pg
    environment:
      POSTGRES_DB: herafino_test
      POSTGRES_USER: herafino
      POSTGRES_PASSWORD: password
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U herafino"]
      interval: 2s
      timeout: 5s
      retries: 10

  valkey_test:
    image: valkey/valkey:8.0.0
    container_name: harfino_test_valkey
    ports:
      - "6390:6379"
    healthcheck:
      test: ["CMD", "valkey-cli", "ping"]
      interval: 2s
      timeout: 5s
      retries: 10
```

---

## test/ Directory Structure

```
tests/
├── unit/                     # 70% - Pure business logic
│   ├── domain/
│   │   ├── user/
│   │   │   ├── user.test.ts
│   │   │   └── user-values.test.ts
│   │   ├── craftsman/
│   │   │   ├── craftsman-profile.test.ts
│   │   │   ├── three-strikes-rule.test.ts
│   │   │   └── onboarding-validation.test.ts
│   │   ├── order/
│   │   │   ├── order-state-machine.test.ts
│   │   │   ├── eta-calculation.test.ts
│   │   │   └── cancellation-policy.test.ts
│   │   ├── review/
│   │   │   └── rating-aggregation.test.ts
│   │   └── complaint/
│   │       ├── complaint-actions.test.ts
│   │       └── freeze-count.test.ts
│   ├── application/
│   │   ├── register-craftsman.test.ts
│   │   ├── approve-craftsman.test.ts
│   │   ├── create-order.test.ts
│   │   ├── accept-order.test.ts
│   │   ├── file-complaint.test.ts
│   │   ├── update-location.test.ts
│   │   ├── process-complaint-resolution.test.ts
│   │   └── verify-freeze-count.test.ts
│   ├── utils/
│   │   ├── egyptian-phone-validator.test.ts
│   │   ├── geohash.test.ts
│   │   ├── date-formatter.test.ts (Arabic)
│   │   └── pagination.test.ts
│   └── lib/
│       ├── zod-validation.test.ts
│       ├── jwt-test.ts
│       └── hash-password.test.ts (future)
│
├── integration/              # 20% - Module boundaries + API
│   ├── /api/
│   │   ├── auth.test.ts
│   │   │   ├── google-oauth-login.test.ts
│   │   │   ├── session-validation.test.ts
│   │   │   └── logout.test.ts
│   │   ├── craftsman.test.ts
│   │   │   ├── onboarding.test.ts
│   │   │   ├── profile-update.test.ts
│   │   │   ├── availability-toggle.test.ts
│   │   │   ├── transport-upload.test.ts
│   │   │   └── location-update.test.ts
│   │   ├── orders.test.ts
│   │   │   ├── create-order.test.ts
│   │   │   ├── accept-order.test.ts
│   │   │   ├── complete-order.test.ts
│   │   │   └── cancel-order.test.ts
│   │   ├── reviews.test.ts
│   │   │   ├── submit-review.test.ts
│   │   │   └── get-reviews.test.ts
│   │   ├── complaints.test.ts
│   │   │   ├── file-complaint.test.ts
│   │   │   ├── admin-resolution.test.ts
│   │   │   ├── freeze-count.test.ts
│   │   │   └── auto-ban-three-strikes.test.ts
│   │   ├── admin.test.ts
│   │   │   ├── review-craftsman.test.ts
│   │   │   └── moderation-queue.test.ts
│   │   ├── location.test.ts
│   │   │   ├── search-nearby-craftsmen.test.ts
│   │   │   └── websocket-connection.test.ts
│   │   └── webhooks.test.ts
│   │       ├── webhook-dispatch.test.ts
│   │       ├── webhook-retry.test.ts
│   │       └── webhook-verify-signature.test.ts
│   ├── repositories/
│   │   ├── user-repository.test.ts
│   │   │   ├── find-by-id.test.ts
│   │   │   ├── create.test.ts
│   │   │   └── find-by-google-id.test.ts
│   │   ├── craftsman-repository.test.ts
│   │   │   ├── find-profile-by-user.test.ts
│   │   │   ├── create-profile.test.ts
│   │   │   ├── update-profile.test.ts
│   │   │   ├── approve.test.ts
│   │   │   ├── reject.test.ts
│   │   │   ├── freeze.test.ts
│   │   │   ├── unfreeze.test.ts
│   │   │   ├── ban.test.ts
│   │   │   ├── increment-freeze-count.test.ts
│   │   │   └── get-pending-profiles.test.ts
│   │   ├── order-repository.test.ts
│   │   │   ├── create-order.test.ts
│   │   │   ├── find-by-user-id.test.ts
│   │   │   ├── update-status.test.ts
│   │   │   └── find-active-orders.test.ts
│   │   ├── review-repository.test.ts
│   │   │   ├── find-by-craftsman.test.ts
│   │   │   └── calculate-average-rating.test.ts
│   │   ├── complaint-repository.test.ts
│   │   │   ├── find-by-against-user.test.ts
│   │   │   ├── find-pending.test.ts
│   │   │   └── resolvecomplaint.test.ts
│   │   ├── location-repository.test.ts
│   │   │   ├── upsert-location.test.ts
│   │   │   ├── find-nearby.test.ts
│   │   │   └── find-available-craftsmen.test.ts
│   │   └── audit-repository.test.ts
│   │       └── log-action.test.ts
│   └── contracts/
│       ├── user-repository-contract.test.ts
│       ├── craftsman-repository-contract.test.ts
│       ├── order-repository-contract.test.ts
│       ├── i-email-service-contract.test.ts
│       ├── i-notification-service-contract.test.ts
│       └── i-location-service-contract.test.ts
│
├── e2e/                     # 10% - Critical user flows
│   ├── auth/
│   │   ├── google-oauth-login.e2e.ts
│   │   ├── craftsman-registration.e2e.ts
│   │   └── session-persistence.e2e.ts
│   ├── craftsman/
│   │   ├── onboarding-flow.e2e.ts
│   │   └── admin-approval-flow.e2e.ts
│   ├── client/
│   │   ├── search-craftsman.e2e.ts
│   │   ├── create-order.e2e.ts
│   │   ├── track-order.e2e.ts
│   │   └── submit-review.e2e.ts
│   ├── admin/
│   │   ├── review-pending-craftsmen.e2e.ts
│   │   ├── complaint-resolution.e2e.ts
│   │   └── user-management.e2e.ts
│   └── realtime/
│       ├── websocket-location.e2e.ts
│       └── location-broadcast.e2e.ts
│
├── fixtures/                # Shared test data
│   ├── users.ts
│   ├── craftsmen.ts
│   ├── orders.ts
│   ├── reviews.ts
│   ├── complaints.ts
│   └── factories/
│       ├── user.factory.ts
│       ├── craftsman.factory.ts
│       ├── order.factory.ts
│       └── review.factory.ts
│
├── helpers/                 # Test utilities
│   ├── db-setup.ts           # Drizzle test DB setup/teardown
│   ├── valkey-cleanup.ts     # Valkey cleanup after tests
│   ├── auth-mock.ts         # NextAuth mock
│   ├── geo-mock.ts          # Mock geolocation
│   ├── date-mock.ts         # Lucid date mocking
│   └── server.ts            # Custom test server
│
├── mocks/                   # Mock implementations
│   ├── email-service.mock.ts
│   ├── notification-service.mock.ts
│   ├── websocket-service.mock.ts
│   ├── google-oauth.mock.ts
│   ├── resend.mock.ts
│   ├── maps-api.mock.ts
│   └── audit-service.mock.ts
│
├── jest.config.ts
├── vitest.config.ts
├── vitest.workspace.ts
├── playwright.config.ts
├── tsconfig.test.json
└── index.ts                 # Barrel export
```

---

## vitest.config.ts

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node', // jsdom for client tests
    setupFiles: ['./tests/helpers/db-setup.ts', './tests/helpers/auth-mock.ts'],
    include: [
      'tests/unit/**/*.test.ts',
      'tests/integration/**/*.test.ts',
    ],
    testTimeout: 10000, // 10 seconds for integration tests
    hookTimeout: 5000,  // 5 seconds for setup/teardown
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'apps/web/src/features/**/*.ts',
        'apps/workers/src/**/*.ts',
        'packages/**/*.ts',
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.d.ts',
        '**/types.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },],include: ['tests/**/*.test.ts'],
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('test'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@herafino/types': path.resolve(__dirname, '../packages/types/src'),
      '@herafino/contracts': path.resolve(__dirname, '../packages/contracts/src'),
    },
  },
});
```

---

## vitest.workspace.ts

```typescript
// vitest.workspace.ts
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/types',
  'packages/contracts',
  'packages/logger',
  'apps/web',
  'apps/workers',
]);
```

---

## playwright.config.ts

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Test Execution

```json
// package.json (scripts)
"scripts": {
  "test": "vitest",
  "test:watch": "vitest watch",
  "test:unit": "vitest run tests/unit",
  "test:integration": "vitest run tests/integration",
  "test:workers": "vitest run apps/workers",
  "test:all": "npm run test:unit && npm run test:integration && npm run test:workers",
  "test:coverage": "vitest run --coverage",
  "test:ci": "vitest run --reporter=json --coverage",
  "test:e2e": "playwright test",
  "test:e2e:headed": "playwright test --headed",
  "test:e2e:update": "playwright test --update-snapshots"
}
```

---

## Test Coverage Requirements

| Layer | Target | Gate |
|-------|--------|------|
| **Unit Tests** | 85% | Required |
| **Integration Tests** | 70% | Required |
| **All Combined** | 80% | Required |
| **Branch Coverage** | 70% | Required |
| **E2E Tests** | Critical paths only | Required |

---

## Sample Test Files

### Unit Test: Domain Business Logic

```typescript
// tests/unit/domain/order/order-state-machine.test.ts
import { describe, it, expect } from 'vitest';
import { Order } from '@/features/orders/types/order.types';

describe('Order State Machine', () => {
  it('should transition from pending to accepted on craftsman accept', () => {
    const order = Order.create({ status: 'pending' });
    const accepted = order.accept('craftsman-id');
    expect(accepted.status).toBe('accepted');
  });

  it('should transition from accepted to completed on markComplete', () => {
    const order = Order.create({ status: 'accepted' });
    const completed = order.complete({ finalPrice: '500' });
    expect(completed.status).toBe('completed');
    expect(completed.finalPrice).toBe('500');
  });

  it('should reject transition from completed to pending (immutable)', () => {
    const order = Order.create({ status: 'completed' });
    expect(() => order.accept()).toThrow('Cannot change status from completed');
  });
});
```

### Integration Test: API Contract

```typescript
// tests/integration/api/orders.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/orders/route';
import { createTestDb } from '@/tests/helpers/db-setup';

describe('POST /api/orders', () => {
  beforeEach(async () => {
    await createTestDb(); // Creates test database
  });

  it('should create order for authenticated client', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
      body: { craftsmanId: 'craftsman-uuid', craftType: 'carpenter', description: 'need woodwork', address: '...' },
    });

    const response = await POST(req);
    expect(res._getStatusCode()).toBe(201);
    expect(response).toHaveProperty('id');
    expect(response.status).toBe('pending');
  });

  it('should reject creation when craftsman not found', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
      body: { craftsmanId: 'non-existent', craftType: 'carpenter', description: '...', address: '...' },
    });

    const response = await POST(req);
    expect(res._getStatusCode()).toBe(404);
  });
});
```

### Contract Test: Repository Interface Implementation

```typescript
// tests/contracts/craftsman-repository-contract.test.ts
import { describe, it, expect } from 'vitest';
import { ICraftsmanRepository } from '@/packages/contracts';
import { CraftsmanRepository } from '@/features/craftsman/repositories/craftsman.repository';
import { createTestDb } from '@/tests/helpers/db-setup';

describe('CraftsmanRepository - Contract Tests', () => {
  let repo: ICraftsmanRepository;
  beforeEach(async () => {
    const db = await createTestDb();
    repo = new CraftsmanRepository(db);
  });

  it('should implement findProfileByUserId', async () => {
    const profile = await repo.findProfileByUserId('user-id');
    expect(profile).toBeDefined();
    expect(typeof profile.id).toBe('string');
  });

  it('should implement freeze with reason', async () => {
    await repo.freeze('profile-id', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'Violation');
    const profile = await repo.findProfileByUserId('user-id');
    expect(profile.status).toBe('frozen');
  });
});
```

### E2E Test: Craftsman Onboarding

```typescript
// tests/e2e/craftsman/onboarding-flow.e2e.ts
import { test, expect } from '@playwright/test';

test.describe('Craftsman Onboarding Flow', () => {
  test('complete multi-step onboarding', async ({ page }) => {
    // Start from Google OAuth login
    await page.goto('/signin?as=craftsman');
    await page.goto('http://localhost:3000'); // Mock Google OAuth (test mode)

    // Complete 4 steps
    await page.fill('select[name="craft_type"]', 'carpenter');
    await page.fill('input[name="phone"]', '01012345678');
    await page.fill('input[name="age"]', '30');
    await page.fill('input[name="experience_years"]", '"10');

    await page.setInputFiles('input[name="id_card_front"]', '/path/to/front.jpg');
    await page.setInputFiles('input[name="id_card_back"]', '/path/to/back.jpg');
    await page.setInputFiles('input[name="face_photo"]', '/path/to/face.jpg');

    await page.fill('select[name="transport_type"]', 'car');
    await page.fill('input[name="vehicle_number"]', 'ABC 1234');
    await page.setInputFiles('input[name="transport_photo"]', '/path/to/car.jpg');

    await page.fill('input[name="workshop_address"]', '123 Tahrir Square, Cairo');
    await page.click('button:has-text("Confirm on Map")');

    await page.click('button:has-text("Submit Profile")');

    // Should redirect to pending status page
    await expect(page).toHaveURL(/\/dashboard\/craftsman\/pending/);
  });
});
```

---

## Mock Implementations

### Email Service Mock

```typescript
// tests/mocks/email-service.mock.ts
import { IEmailService } from '@herafino/contracts';

export class MockEmailService implements IEmailService {
  async sendWelcome(_email: string, _name: string): Promise<void> { }
  async sendApprovalNotification(_email: string, _name: string): Promise<void> { }
  async sendRejectionNotification(_email: string, _name: string, _reason?: string): Promise<void> { }
  async sendOrderNotification(_email: string, _order: unknown): Promise<void> { }
  async sendComplaintNotification(_email: string, _complaint: unknown): Promise<void> { }
}
```

### Valkey Mock (In-memory)

```typescript
// tests/mocks/valkey.mock.ts
export class MockValkey {
  private store = new Map<string, { value: string; expires: number | null }>();

  async get(key: string) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expires && Date.now() > item.expires) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, opts?: { EX?: number }) {
    this.store.set(key, {
      value,
      expires: opts?.EX ? Date.now() + opts.EX * 1000 : null,
    });
  }

  async del(key: string) { this.store.delete(key); }

  async mget(keys: string[]) {
    const values = await Promise.all(keys.map(k => this.get(k)));
    return values;
  }

  async flushall() { this.store.clear(); }
}
```

---

## Test Data Fixtures

### Users Factory

```typescript
// tests/fixtures/factories/user.factory.ts
import { faker } from '@faker-js/faker';
import { User } from '@herafino/types';

export function createUser(overrides?: Partial<User>): User {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    emailVerified: true,
    name: faker.person.fullName(),
    image: faker.image.avatar(),
    googleId: faker.string.uuid(),
    role: 'client',
    phone: '01012345678',
    age: 25,
    createdAt: new Date(),
    updatedAt: new Date(),
    bannedAt: null,
    isDeleted: false,
    ...overrides,
  };
}

export const testUsers = {
  admin: createUser({ role: 'admin', email: 'admin@herafino.com' }),
  craftsman: createUser({ role: 'craftsman', email: 'craftsman@herafino.com' }),
  client: createUser({ role: 'client', email: 'client@herafino.com' }),
};
```

---

## Test Runner Commands

| Command | Purpose | When to Use |
|---------|---------|-----------------------------------|
| `npm run test:watch` | Watch mode for development | During development |
| `npm run test:unit` | Quick unit tests | After each change |
| `npm run test:integration` | Integration tests | Before PR |
| `npm run test:all` | Full test suite | Before merge/deploy |
| `npm run test:coverage` | Coverage report | In CI only |
| `npm run test:ci` | CI-compatible output | In GitHub Actions |
| `npm run test:e2e` | E2E tests with Playwright | Nightly or pre-deploy |

---

## CI/CD Test Pipeline

```yaml
# .github/workflows/test.yml
name: Test Pipeline
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: herafino_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      valkey:
        image: valkey/valkey:8.0.0
        options: >-
          --health-cmd "valkey-cli ping"
          --health-interval 10s

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - run: docker compose -f docker-compose.test.yml up -d

      - run: npx tsc --noEmit

      - run: npm run test:unit — —coverage

      - run: npm run test:integration

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json

      - run: npm run test:e2e
        env:
          E2E_BASE_URL: http://localhost:3000

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run ESLint
        run: npm run lint
      - name: TypeScript check
        run: npm run typecheck
```

---

## Test Naming Conventions

```typescript
// PREFERRED: describe / it with Arabic explanation
describe('Craftsman Onboarding', () => {
  it('يجب رفض رقم هاتف غير مصري', () => {
    expect(validateEgyptianPhone('123')).toBe(false);
  });
});

// ALSO OK: English for technical details
describe('Order State Machine', () => {
  it('should not allow transition from completed directly to pending', () => {
    expect(() => order.accept()).toThrow();
  });
});
```

---

## Assertions & Test Helpers

```typescript
// tests/helpers/assertions.ts
export function assertCraftsmanProfile(data: unknown) {
  assertType<CraftsmanProfile>(data);
  expect(data.id).toBeDefined();
  expect(data.userId).toBeDefined();
  expect(data.craftType).toBeDefined();
  expect(data.status).toBe('approved');
}

export function assertValidOrder(data: unknown) {
  assertType<Order>(data);
  expect(data.id).toBeDefined();
  expect(data.clientId).toBeDefined();
  expect(data.craftsmanId).toBeDefined();
  expect(data.status).toMatch(/pending|accepted|in_progress|completed/);
}

export async function waitForWebSocketMessage(
  ws: WebSocket,
  type: string,
  timeout = 5000
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error('WebSocket timeout')), timeout);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === type) {
        clearTimeout(timeoutId);
        resolve(data.payload);
      }
    };
  });
}
```

---

## E2E Test: Full User Journey

```typescript
// tests/e2e/full-user-journey.e2e.ts
import { test, expect } from '@playwright/test';

test.describe('Full User Journey - طالب حرفة + حرفي + Admin', () => {
  test('client finds craftsman, orders, reviews', async ({ page }) => {
    // 1. Client Login
    await page.goto('/');
    await page.click('text=تسجيل الدخول كعميل');
    // Mock Google OAuth
    await page.goto('/dashboard/client');

    // 2. Search for carpenter
    await page.fill('input[placeholder="ابحث عن حرفي"]', 'نجار');
    await page.click('button:has-text("بحث")');
    await expect(page.locator('.craftsman-card')).toHaveCount(10);

    // 3. Order a carpenter
    await page.click('.craftsman-card:first-child >> text=طلب خدمة');
    await page.fill('textarea[name="description"]', 'أحتاج نجار لتركيب أبواب');
    await page.click('button:has-text("إرسال طلب")');

    // 4. Wait for approval (mock craftsman response)
    await page.waitForSelector('text=تم قبول طلبك', { timeout: 10000 });

    // 5. Rate craftsman after completion
    await page.goto('/dashboard/client/orders');
    await page.click('button:has-text("تقييم")');
    await page.fill('input[value="5"]', ''); // 5 stars
    await page.click('button:has-text("إرسال تقييم")');
  });

  test.beforeEach(async ({ browser }) => {
    // Mock Google OAuth for testing
    await browser.route('**/oauth**', route => route.fulfill({
      body: JSON.stringify({ access_token: 'mock-token' }),
      contentType: 'application/json',
    }));
  });
});
```

---

## Coverage Report Example

```
------------------|---------|----------|---------|---------|-------------------
File              | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line(s)
------------------|---------|----------|---------|---------|-------------------
features/auth
 cr

 I'll let the file continue here as an example:

 features/auth
  use-cases/handlers-google-callback.usecase.ts | 100.00 |  92.31 |  100.00 |  100.00
 features/craftsman
  use-cases/submit-profile.usecase.ts           |  95.83 |  87.50 |  100.00 |  95.83

------------------|---------|----------|---------|---------|-----------
All files         |  86.54 |  76.39 |  83.33 |  86.02 |
```

---

## Performance Testing (Future)

| Tool | Purpose |
|------|---------|
| **Autocannon** | HTTP load testing on API routes |
| **Artillery** | Full-stack load testing |
| **k6** | WebSocket performance testing |
| **Lighthouse** | Frontend performance auditing |
| **Bundle Analyzer** | Next.js bundle size analysis |

```bash
# Run load tests
artillery run load-tests/api-load.yml
k6 run -e DURATION=5m -e VUS=100 tests/performance/websocket-load.js
```

---

## Related Documents
- [C4 L3 - Component](c4-l3-component-internal.md)
- [Plan](plan.md)
- [Kent Beck - Test-Driven Development](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)
