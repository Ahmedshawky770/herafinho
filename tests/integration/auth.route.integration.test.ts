import { it, expect } from "vitest";
import { mockAuth, setSession } from "./helpers/auth";
import { describeIntegration } from "./helpers/db";
import { randomId } from "./helpers/db";
import { UserRepository } from "@herafino/shared/repositories/user.repository";

mockAuth();

describeIntegration("Auth gate (integration)", () => {
  it("rejects unauthenticated requests across protected API surfaces", async () => {
    setSession(null);

    const targets: Array<[string, () => Promise<{ GET?: () => Promise<Response> }>]> = [
      ["orders", () => import("@/app/api/orders/route")],
      ["complaints", () => import("@/app/api/complaints/route")],
      ["craftsmen/me", () => import("@/app/api/craftsmen/me/route")],
      ["notifications", () => import("@/app/api/notifications/route")],
      ["admin/complaints", () => import("@/app/api/admin/complaints/route")],
      ["admin/craftsmen", () => import("@/app/api/admin/craftsmen/route")],
    ];

    for (const [name, loader] of targets) {
      const route = await loader();
      const res = await route.GET();
      expect(res.status, `${name} should reject unauthenticated GET`).toBe(401);
    }
  });

  it("rejects non-admin from admin-only surfaces while allowing the owner role", async () => {
    const client = await new UserRepository().create({
      email: `${randomId()}@example.com`,
      name: "Client",
      image: "i",
      role: "client",
    });
    const admin = await new UserRepository().create({
      email: `${randomId()}@example.com`,
      name: "Admin",
      image: "i",
      role: "admin",
    });

    // Client blocked from admin complaints.
    setSession({ user: { id: client.id, role: "client", email: "c@e.com", name: "Client" } });
    const adminRoute = await import("@/app/api/admin/complaints/route");
    expect((await adminRoute.GET()).status).toBe(403);

    // Admin allowed.
    setSession({ user: { id: admin.id, role: "admin", email: "a@e.com", name: "Admin" } });
    expect((await adminRoute.GET()).status).toBe(200);
  });
});
