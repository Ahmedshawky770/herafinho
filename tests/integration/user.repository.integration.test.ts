import { it, expect } from "vitest";
import { UserRepository } from "@herafino/shared/repositories/user.repository";
import { setupIntegrationDatabase, withCleanDatabase, randomId } from "./helpers/db";
import { describeIntegration } from "./helpers/db";
import { users } from "@herafino/shared/db/schema";

const ctx = setupIntegrationDatabase();
withCleanDatabase(ctx);

async function seedUser(overrides: Record<string, unknown> = {}) {
  return new UserRepository().create({
    email: `${randomId()}@example.com`,
    name: "Test User",
    image: "http://example.com/img.png",
    role: "client",
    ...overrides,
  });
}

describeIntegration("UserRepository (integration)", () => {
  it("creates a user with a generated id and defaults", async () => {
    const user = await new UserRepository().create({
      email: `${randomId()}@example.com`,
      name: "Ada",
      image: "http://example.com/a.png",
      role: "craftsman",
    });

    expect(user.id).toBeTruthy();
    expect(user.role).toBe("craftsman");
    expect(user.isDeleted).toBe(false);
  });

  it("finds a user by id", async () => {
    const created = await seedUser();
    const found = await new UserRepository().findById(created.id);
    expect(found?.email).toBe(created.email);
  });

  it("returns null when the user does not exist", async () => {
    expect(await new UserRepository().findById("missing-id")).toBeNull();
  });

  it("finds a user by email", async () => {
    const created = await seedUser();
    const found = await new UserRepository().findByEmail(created.email);
    expect(found?.id).toBe(created.id);
  });

  it("finds a user by google id", async () => {
    const created = await seedUser({ googleId: randomId("g") });
    const found = await new UserRepository().findByGoogleId(created.googleId!);
    expect(found?.id).toBe(created.id);
  });

  it("reports existence correctly", async () => {
    const created = await seedUser();
    expect(await new UserRepository().exists(created.id)).toBe(true);
    expect(await new UserRepository().exists("nope")).toBe(false);
  });

  it("updates a user", async () => {
    const created = await seedUser();
    const updated = await new UserRepository().update(created.id, { name: "Renamed", age: 42 });
    expect(updated.name).toBe("Renamed");
    expect(updated.age).toBe(42);
  });

  it("soft deletes a user", async () => {
    const created = await seedUser();
    await new UserRepository().softDelete(created.id);
    const after = await new UserRepository().findById(created.id);
    expect(after?.isDeleted).toBe(true);
  });

  it("isolates data between tests via truncation", async () => {
    // BeforeEach truncates all tables, so a fresh test starts empty.
    expect((await ctx.db.select().from(users)).length).toBe(0);
    await seedUser();
    expect((await ctx.db.select().from(users)).length).toBe(1);
  });
});
