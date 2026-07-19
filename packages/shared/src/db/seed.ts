import { eq } from "drizzle-orm";
import { db } from "./index";
import { users } from "./schema";
import { logger } from "../logger/factory";

async function seed() {
  try {
    const adminEmail = process.env.FIRST_USER_ADMIN;
    if (!adminEmail) {
      logger.warn("FIRST_USER_ADMIN not set, skipping seed");
      return;
    }

    const [existing] = await db.select().from(users).where(eq(users.email, adminEmail));
    if (existing) {
      logger.info("Admin user already exists, skipping seed");
      return;
    }

    const [admin] = await db
      .insert(users)
      .values({
        email: adminEmail,
        name: "Harfino Admin",
        image: "",
        role: "admin",
        onboardingComplete: true,
      })
      .returning();

    logger.info({ adminId: admin?.id, email: adminEmail }, "Admin user seeded");
  } catch (error) {
    logger.error({ error }, "Seed failed");
  }
}

seed().catch((err) => {
  logger.error({ err }, "Seed script failed");
  process.exit(1);
});
