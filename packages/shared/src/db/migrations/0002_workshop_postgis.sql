-- Enables PostGIS spatial features for geo-distance search.
-- Wrapped in EXCEPTION handlers so `drizzle-kit migrate` succeeds even on
-- databases without the PostGIS extension (the app falls back to an
-- in-memory haversine computation in that case). On PostGIS-enabled
-- images (postgis/postgis) the extension, geometry column and GIST
-- index are created and used by CraftsmanRepository.searchNearbyCraftsmen.
DO $$ BEGIN
 CREATE EXTENSION IF NOT EXISTS postgis;
EXCEPTION
 WHEN OTHERS THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "craftsman_profiles" ADD COLUMN IF NOT EXISTS "workshop_location" geometry(Point, 4326);
EXCEPTION
 WHEN OTHERS THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 UPDATE "craftsman_profiles"
 SET "workshop_location" = ST_SetSRID(ST_MakePoint(
   CAST("workshop_longitude" AS double precision),
   CAST("workshop_latitude" AS double precision)
 ), 4326)
 WHERE "workshop_latitude" IS NOT NULL
   AND "workshop_longitude" IS NOT NULL
   AND "workshop_latitude" <> ''
   AND "workshop_longitude" <> '';
EXCEPTION
 WHEN OTHERS THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 CREATE INDEX IF NOT EXISTS "craftsman_profiles_workshop_location_idx"
   ON "craftsman_profiles" USING GIST ("workshop_location");
EXCEPTION
 WHEN OTHERS THEN NULL;
END $$;
--> statement-breakpoint
