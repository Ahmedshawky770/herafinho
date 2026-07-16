import { vi } from 'vitest';

export interface MockSession {
  user: {
    id: string;
    role: string;
    email?: string;
    name?: string;
  };
}

let currentSession: MockSession | null = null;

export function setSession(session: MockSession | null) {
  currentSession = session;
}

// Mock NextAuth at the top level (vi.mock is hoisted). The factory reads the
// mutable `currentSession` so tests can swap the active session via setSession.
vi.mock('@/app/auth', () => ({
  auth: vi.fn(async () => currentSession),
  handlers: {},
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

export function mockAuth() {
  // no-op: the mock is registered at module load (see vi.mock above)
}

export function clientSession(id: string): MockSession {
  return { user: { id, role: 'client', email: 'c@e.com', name: 'Client' } };
}

export function craftsmanSession(id: string): MockSession {
  return { user: { id, role: 'craftsman', email: 'k@e.com', name: 'Craft' } };
}

export function adminSession(id: string): MockSession {
  return { user: { id, role: 'admin', email: 'a@e.com', name: 'Admin' } };
}
