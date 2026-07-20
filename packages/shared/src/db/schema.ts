import { pgTable, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  name: text("name").notNull(),
  image: text("image").notNull(),
  googleId: text("google_id").unique(),
  role: text("role", {
    enum: ["client", "craftsman", "admin", "super_admin"],
  })
    .default("client")
    .notNull(),
  onboardingComplete: boolean("onboarding_complete").default(false).notNull(),
  phone: text("phone"),
  age: integer("age"),
  bannedAt: timestamp("banned_at"),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const craftsmanProfiles = pgTable("craftsman_profiles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  craftType: text("craft_type", {
    enum: [
      "carpenter",
      "plumber",
      "painter",
      "electrician",
      "welder",
      "tiler",
      "ceramicist",
      "whitewasher",
      "hvac",
      "satellite",
      "aluminum",
    ],
  }).notNull(),
  experienceYears: integer("experience_years").notNull(),
  idCardFrontUrl: text("id_card_front_url").notNull(),
  idCardBackUrl: text("id_card_back_url").notNull(),
  facePhotoUrl: text("face_photo_url").notNull(),
  transportType: text("transport_type", {
    enum: ["bike", "walking", "car", "minivan"],
  })
    .notNull()
    .default("bike"),
  transportPhotos: jsonb("transport_photos").$type<string[]>(),
  vehicleNumber: text("vehicle_number"),
  workshopAddress: text("workshop_address").notNull(),
  workshopLatitude: text("workshop_latitude").notNull(),
  workshopLongitude: text("workshop_longitude").notNull(),
  isAvailable: boolean("is_available").default(false).notNull(),
  isOnline: boolean("is_online").default(false).notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected", "frozen", "banned"] })
    .default("pending")
    .notNull(),
  freezeUntil: timestamp("freeze_until"),
  freezeReason: text("freeze_reason"),
  freezeCount: integer("freeze_count").default(0).notNull(),
  rejectionReason: text("rejection_reason"),
  reviewedBy: text("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const craftsmanLocations = pgTable("craftsman_locations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  isAvailable: boolean("is_available").notNull(),
});

export const orders = pgTable("orders", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  craftsmanId: text("craftsman_id").references(() => users.id, { onDelete: "cascade" }),
  craftType: text("craft_type", {
    enum: [
      "carpenter",
      "plumber",
      "painter",
      "electrician",
      "welder",
      "tiler",
      "ceramicist",
      "whitewasher",
      "hvac",
      "satellite",
      "aluminum",
    ],
  }).notNull(),
  status: text("status", {
    enum: ["pending", "accepted", "rejected", "in_progress", "completed", "cancelled"],
  })
    .default("pending")
    .notNull(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  estimatedPrice: text("estimated_price"),
  finalPrice: text("final_price"),
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  clientAcceptedFinalPrice: boolean("client_accepted_final_price"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  clientId: text("client_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  craftsmanId: text("craftsman_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const complaints = pgTable("complaints", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id").references(() => orders.id),
  reporterId: text("reporter_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  againstUserId: text("against_user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  reason: text("reason", {
    enum: ["no_show", "bad_service", "overpriced", "harassment", "fraud", "other"],
  }).notNull(),
  description: text("description").notNull(),
  evidenceUrls: jsonb("evidence_urls").$type<string[]>(),
  status: text("status", { enum: ["pending", "investigating", "resolved", "dismissed"] })
    .default("pending")
    .notNull(),
  actionTaken: text("action_taken", { enum: ["warning", "freeze", "permanent_ban"] }),
  resolvedBy: text("resolved_by").references(() => users.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type", { enum: ["email", "in_app", "push"] }).notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  read: boolean("read").default(false).notNull(),
  readAt: timestamp("read_at"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

export const webhooks = pgTable("webhooks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  event: text("event").notNull(),
  url: text("url").notNull(),
  secret: text("secret").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  retryCount: integer("retry_count").default(0).notNull(),
  lastTriggeredAt: timestamp("last_triggered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eventOutbox = pgTable("event_outbox", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  eventName: text("event_name").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull(),
  status: text("status", { enum: ["pending", "processing", "completed", "failed"] })
    .default("pending")
    .notNull(),
  lastError: text("last_error"),
  nextRetryAt: timestamp("next_retry_at").defaultNow().notNull(),
  retryCount: integer("retry_count").default(0).notNull(),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  craftsmanProfile: one(craftsmanProfiles, {
    fields: [users.id],
    references: [craftsmanProfiles.userId],
  }),
  ordersAsClient: many(orders, { relationName: "clientOrders" }),
  ordersAsCraftsman: many(orders, { relationName: "craftsmanOrders" }),
  reviews: many(reviews, { relationName: "reviews" }),
  complaints: many(complaints, { relationName: "complaints" }),
}));

export const craftsmanProfilesRelations = relations(craftsmanProfiles, ({ one }) => ({
  user: one(users, {
    fields: [craftsmanProfiles.userId],
    references: [users.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  client: one(users, {
    fields: [orders.clientId],
    references: [users.id],
    relationName: "clientOrders",
  }),
  craftsman: one(users, {
    fields: [orders.craftsmanId],
    references: [users.id],
    relationName: "craftsmanOrders",
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
}));

export const complaintsRelations = relations(complaints, ({ one }) => ({
  order: one(orders, {
    fields: [complaints.orderId],
    references: [orders.id],
  }),
}));

// Performance indexes are managed via Drizzle migrations
// (see migrations/0003_performance_indexes.sql): a partial composite index on
// craftsman_profiles(status, craft_type, is_available) for the search hot path
// plus client/craftsman/status indexes on orders and FK indexes elsewhere.

export const userSelectSchema = createSelectSchema(users);
export const userInsertSchema = createInsertSchema(users);

export const craftsmanProfileSelectSchema = createSelectSchema(craftsmanProfiles);
export const craftsmanProfileInsertSchema = createInsertSchema(craftsmanProfiles);

export const orderSelectSchema = createSelectSchema(orders);
export const orderInsertSchema = createInsertSchema(orders);

export const reviewSelectSchema = createSelectSchema(reviews);
export const reviewInsertSchema = createInsertSchema(reviews);

export const complaintSelectSchema = createSelectSchema(complaints);
export const complaintInsertSchema = createInsertSchema(complaints);

export const notificationSelectSchema = createSelectSchema(notifications);
export const notificationInsertSchema = createInsertSchema(notifications);

export const webhookSelectSchema = createSelectSchema(webhooks);
export const webhookInsertSchema = createInsertSchema(webhooks);

export const eventOutboxSelectSchema = createSelectSchema(eventOutbox);
export const eventOutboxInsertSchema = createInsertSchema(eventOutbox);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type CraftsmanProfile = typeof craftsmanProfiles.$inferSelect;
export type NewCraftsmanProfile = typeof craftsmanProfiles.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type Complaint = typeof complaints.$inferSelect;
export type NewComplaint = typeof complaints.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;
export type EventOutbox = typeof eventOutbox.$inferSelect;
export type NewEventOutbox = typeof eventOutbox.$inferInsert;
