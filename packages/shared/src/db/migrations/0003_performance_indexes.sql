-- Performance indexes for the most frequent query patterns.
--  - Craftsman search filters by (status, craft_type, is_available) and is the
--    hottest read path on the marketplace; a partial composite index keeps only
--    the servable (approved + available) rows, so the planner never scans the
--    full table.
--  - Order listing by client/craftsman plus status is the second hottest path
--    (dashboard + "my orders").
-- All statements are idempotent (IF NOT EXISTS) so re-running migrate is safe.

CREATE INDEX IF NOT EXISTS "craftsman_profiles_servable_idx"
  ON "craftsman_profiles" ("status", "craft_type", "is_available")
  WHERE "status" = 'approved' AND "is_available" = true;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "craftsman_profiles_user_id_idx"
  ON "craftsman_profiles" ("user_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "orders_client_id_status_idx"
  ON "orders" ("client_id", "status");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "orders_craftsman_id_status_idx"
  ON "orders" ("craftsman_id", "status");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "complaints_against_user_id_idx"
  ON "complaints" ("against_user_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "reviews_craftsman_id_idx"
  ON "reviews" ("craftsman_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "notifications_user_id_read_idx"
  ON "notifications" ("user_id", "read");
