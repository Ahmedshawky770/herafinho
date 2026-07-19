import { it, expect } from "vitest";
import { UserRepository } from "@herafino/shared/repositories/user.repository";
import { CraftsmanRepository } from "@herafino/shared/repositories/craftsman.repository";
import { OrderRepository } from "@herafino/shared/repositories/order.repository";
import { ReviewRepository } from "@herafino/shared/repositories/review.repository";
import { setupIntegrationDatabase, withCleanDatabase, randomId } from "./helpers/db";
import { describeIntegration } from "./helpers/db";
import { reviews } from "@herafino/shared/db/schema";

const ctx = setupIntegrationDatabase();
withCleanDatabase(ctx);

async function seedCompletedOrder() {
  const client = await new UserRepository().create({
    email: `${randomId()}@example.com`,
    name: "Client",
    image: "i",
    role: "client",
  });
  const craftsmanUser = await new UserRepository().create({
    email: `${randomId()}@example.com`,
    name: "Craft",
    image: "i",
    role: "craftsman",
  });
  await new CraftsmanRepository().createProfile({
    userId: craftsmanUser.id,
    craftType: "electrician",
    experienceYears: 1,
    idCardFrontUrl: "f",
    idCardBackUrl: "b",
    facePhotoUrl: "face",
    workshopAddress: "addr",
    workshopLatitude: "30",
    workshopLongitude: "31",
  });
  const order = await new OrderRepository().create({
    clientId: client.id,
    craftsmanId: craftsmanUser.id,
    craftType: "electrician",
    description: "install a socket",
    address: "addr",
    latitude: "30",
    longitude: "31",
  });
  await new OrderRepository().updateStatus(order.id, "completed");
  return { client, craftsmanUser, order };
}

describeIntegration("ReviewRepository (integration)", () => {
  it("creates a review for a completed order", async () => {
    const { client, craftsmanUser, order } = await seedCompletedOrder();
    const review = await new ReviewRepository().create({
      orderId: order.id,
      clientId: client.id,
      craftsmanId: craftsmanUser.id,
      rating: 4,
      comment: "solid work",
    });
    expect(review.id).toBeTruthy();
    expect(review.rating).toBe(4);
  });

  it("finds a review by order id", async () => {
    const { client, craftsmanUser, order } = await seedCompletedOrder();
    const review = await new ReviewRepository().create({
      orderId: order.id,
      clientId: client.id,
      craftsmanId: craftsmanUser.id,
      rating: 5,
    });
    expect((await new ReviewRepository().findByOrderId(order.id))?.id).toBe(review.id);
  });

  it("lists reviews by craftsman", async () => {
    const { client, craftsmanUser, order } = await seedCompletedOrder();
    await new ReviewRepository().create({
      orderId: order.id,
      clientId: client.id,
      craftsmanId: craftsmanUser.id,
      rating: 3,
    });
    expect(
      (await new ReviewRepository().findByCraftsmanId(craftsmanUser.id)).length
    ).toBeGreaterThanOrEqual(1);
  });

  it("calculates the average rating", async () => {
    const { client, craftsmanUser, order } = await seedCompletedOrder();
    await new ReviewRepository().create({
      orderId: order.id,
      clientId: client.id,
      craftsmanId: craftsmanUser.id,
      rating: 4,
    });
    const second = await seedCompletedOrder();
    await new ReviewRepository().create({
      orderId: second.order.id,
      clientId: second.client.id,
      craftsmanId: second.craftsmanUser.id,
      rating: 2,
    });
    const avg = await new ReviewRepository().calculateAverageRating(second.craftsmanUser.id);
    expect(avg).toBe(2);
  });

  it("counts reviews by craftsman", async () => {
    const { client, craftsmanUser, order } = await seedCompletedOrder();
    await new ReviewRepository().create({
      orderId: order.id,
      clientId: client.id,
      craftsmanId: craftsmanUser.id,
      rating: 5,
    });
    expect(await new ReviewRepository().countByCraftsman(craftsmanUser.id)).toBeGreaterThanOrEqual(
      1
    );
  });

  it("isolation: reviews table is truncated between tests", async () => {
    expect((await ctx.db.select().from(reviews)).length).toBe(0);
    const { client, craftsmanUser, order } = await seedCompletedOrder();
    await new ReviewRepository().create({
      orderId: order.id,
      clientId: client.id,
      craftsmanId: craftsmanUser.id,
      rating: 5,
    });
    expect((await ctx.db.select().from(reviews)).length).toBe(1);
  });
});
