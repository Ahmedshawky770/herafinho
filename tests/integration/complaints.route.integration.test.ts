import { it, expect, beforeEach } from "vitest";
import { mockAuth, setSession, clientSession, adminSession } from "./helpers/auth";
import { setupIntegrationDatabase, withCleanDatabase, randomId } from "./helpers/db";
import { describeIntegration } from "./helpers/db";
import { UserRepository } from "@herafino/shared/repositories/user.repository";
import { CraftsmanRepository } from "@herafino/shared/repositories/craftsman.repository";
import { OrderRepository } from "@herafino/shared/repositories/order.repository";

mockAuth();

const ctx = setupIntegrationDatabase();
withCleanDatabase(ctx);

async function seedComplaintContext() {
  const reporter = await new UserRepository().create({
    email: `${randomId()}@example.com`,
    name: "Reporter",
    image: "i",
    role: "client",
  });
  const against = await new UserRepository().create({
    email: `${randomId()}@example.com`,
    name: "Against",
    image: "i",
    role: "craftsman",
  });
  await new CraftsmanRepository().createProfile({
    userId: against.id,
    craftType: "painter",
    experienceYears: 1,
    idCardFrontUrl: "f",
    idCardBackUrl: "b",
    facePhotoUrl: "x",
    workshopAddress: "a",
    workshopLatitude: "30",
    workshopLongitude: "31",
  });
  const order = await new OrderRepository().create({
    clientId: reporter.id,
    craftsmanId: against.id,
    craftType: "painter",
    description: "paint the wall",
    address: "addr",
    latitude: "30",
    longitude: "31",
  });
  return { reporter, against, order };
}

async function importCollectionRoute() {
  return import("@/app/api/complaints/route");
}

async function importItemRoute() {
  return import("@/app/api/complaints/[id]/route");
}

async function importAdminRoute() {
  return import("@/app/api/admin/complaints/route");
}

async function importResolveRoute() {
  return import("@/app/api/complaints/[id]/resolve/route");
}

describeIntegration("Complaints API (integration)", () => {
  beforeEach(() => {
    setSession(null);
  });

  it("rejects unauthenticated GET and POST", async () => {
    setSession(null);
    const collection = await importCollectionRoute();
    const getRes = await collection.GET();
    expect(getRes.status).toBe(401);

    const postRes = await collection.POST(
      new Request("http://localhost", { method: "POST", body: "{}" })
    );
    expect(postRes.status).toBe(401);
  });

  it("validates the create payload and returns 400 on bad input", async () => {
    const reporter = await new UserRepository().create({
      email: `${randomId()}@example.com`,
      name: "Reporter",
      image: "i",
      role: "client",
    });
    setSession(clientSession(reporter.id));
    const collection = await importCollectionRoute();
    const res = await collection.POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: "bad_service" }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("allows a client to create a complaint and list their own", async () => {
    const { reporter, against, order } = await seedComplaintContext();
    setSession(clientSession(reporter.id));
    const collection = await importCollectionRoute();

    const createRes = await collection.POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          againstUserId: against.id,
          reason: "bad_service",
          description: "did a poor job on the wall",
        }),
      })
    );
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.data.id).toBeTruthy();

    const listRes = await collection.GET();
    expect(listRes.status).toBe(200);
    const list = await listRes.json();
    expect(list.data.some((c: { id: string }) => c.id === created.data.id)).toBe(true);
  });

  it("returns only the owner or an admin can read a single complaint", async () => {
    const { reporter, against, order } = await seedComplaintContext();
    setSession(clientSession(reporter.id));
    const collection = await importCollectionRoute();
    const createRes = await collection.POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          againstUserId: against.id,
          reason: "no_show",
          description: "the craftsman never showed up",
        }),
      })
    );
    const { id } = (await createRes.json()).data;

    // A different client is forbidden.
    const stranger = await new UserRepository().create({
      email: `${randomId()}@example.com`,
      name: "Stranger",
      image: "i",
      role: "client",
    });
    setSession(clientSession(stranger.id));
    const item = await importItemRoute();
    const forbidden = await item.GET(new Request("http://localhost"), {
      params: Promise.resolve({ id }),
    });
    expect(forbidden.status).toBe(403);

    // The reporter can read it.
    setSession(clientSession(reporter.id));
    const ok = await item.GET(new Request("http://localhost"), { params: Promise.resolve({ id }) });
    expect(ok.status).toBe(200);
  });

  it("lets an admin list all complaints but forbids a client", async () => {
    const { reporter, against, order } = await seedComplaintContext();
    setSession(clientSession(reporter.id));
    const collection = await importCollectionRoute();
    await collection.POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          againstUserId: against.id,
          reason: "overpriced",
          description: "charged way more than quoted",
        }),
      })
    );

    // Client is forbidden from the admin endpoint.
    const adminRoute = await importAdminRoute();
    const clientForbidden = await adminRoute.GET();
    expect(clientForbidden.status).toBe(403);

    // Admin can list everything.
    const admin = await new UserRepository().create({
      email: `${randomId()}@example.com`,
      name: "Admin",
      image: "i",
      role: "admin",
    });
    setSession(adminSession(admin.id));
    const adminOk = await adminRoute.GET();
    expect(adminOk.status).toBe(200);
    const list = await adminOk.json();
    expect(Array.isArray(list.data)).toBe(true);
    expect(list.data.length).toBeGreaterThanOrEqual(1);
  });

  it("lets an admin resolve a complaint", async () => {
    const { reporter, against, order } = await seedComplaintContext();
    setSession(clientSession(reporter.id));
    const collection = await importCollectionRoute();
    const createRes = await collection.POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          againstUserId: against.id,
          reason: "harassment",
          description: "was rude and threatening during the job",
        }),
      })
    );
    const { id } = (await createRes.json()).data;

    const admin = await new UserRepository().create({
      email: `${randomId()}@example.com`,
      name: "Admin",
      image: "i",
      role: "admin",
    });
    setSession(adminSession(admin.id));
    const resolve = await importResolveRoute();
    const res = await resolve.PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "warning", notes: "verbal warning issued" }),
      }),
      { params: Promise.resolve({ id }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe("resolved");
    expect(body.data.actionTaken).toBe("warning");
  });
});
