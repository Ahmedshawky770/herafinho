import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The proxy module imports `auth` (NextAuth) and the rate-limit middleware at
// module load. We stub both so the unit test exercises only the guard logic
// (auth redirects, role-based access, onboarding lock) without a real OAuth or
// Valkey connection.
const mockSession = vi.fn();
vi.mock("@/app/auth", () => ({
  auth: (...args: unknown[]) => mockSession(...args),
}));

vi.mock("@/lib/cache/rate-limit.middleware", () => ({
  rateLimitMiddleware: () => () => null,
}));

import { proxy } from "@/proxy";

function makeRequest(pathname: string): NextRequest {
  return {
    nextUrl: { pathname, toString: () => `http://localhost${pathname}` },
    url: `http://localhost${pathname}`,
  } as unknown as NextRequest;
}

function setSession(overrides: Record<string, unknown> | null) {
  mockSession.mockResolvedValue(
    overrides
      ? { user: { id: "u1", role: "client", onboardingComplete: true, ...overrides } }
      : null
  );
}

describe("proxy (Next.js 16 Proxy / auth + role guards)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users away from /dashboard to /login", async () => {
    setSession(null);
    const res = await proxy(makeRequest("/dashboard/client"));
    expect(res).toBeInstanceOf(NextResponse);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("redirects an authenticated but not-onboarded client to /choose-account", async () => {
    setSession({ role: "client", onboardingComplete: false });
    const res = await proxy(makeRequest("/dashboard/client"));
    expect(res.headers.get("location")).toContain("/choose-account");
  });

  it("locks a not-onboarded craftsman to the craftsman onboarding route", async () => {
    setSession({ role: "craftsman", onboardingComplete: false });
    const res = await proxy(makeRequest("/dashboard/client"));
    expect(res.headers.get("location")).toContain("/dashboard/craftsman/onboarding");
  });

  it("blocks a client from accessing admin dashboard", async () => {
    setSession({ role: "client", onboardingComplete: true });
    const res = await proxy(makeRequest("/dashboard/admin"));
    expect(res.headers.get("location")).toContain("/unauthorized");
  });

  it("blocks a craftsman from accessing super_admin dashboard", async () => {
    setSession({ role: "craftsman", onboardingComplete: true });
    const res = await proxy(makeRequest("/dashboard/super_admin"));
    expect(res.headers.get("location")).toContain("/unauthorized");
  });

  it("allows an admin into the admin dashboard", async () => {
    setSession({ role: "admin", onboardingComplete: true });
    const res = await proxy(makeRequest("/dashboard/admin"));
    expect(res.status).toBe(200);
  });

  it("allows a super_admin into the super_admin dashboard", async () => {
    setSession({ role: "super_admin", onboardingComplete: true });
    const res = await proxy(makeRequest("/dashboard/super_admin"));
    expect(res.status).toBe(200);
  });

  it("redirects a logged-in user visiting /login to their dashboard", async () => {
    setSession({ role: "client", onboardingComplete: true });
    const res = await proxy(makeRequest("/login"));
    expect(res.headers.get("location")).toContain("/dashboard/client");
  });
});
