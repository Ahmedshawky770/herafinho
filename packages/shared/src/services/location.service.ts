import type { CraftType, GeocodeResult, Location, NearbyCraftsman } from "@herafino/types";
import { logger } from "../logger/factory";
import { db } from "../db";
import { craftsmanLocations } from "../db/schema";
import { eq } from "drizzle-orm";
import type { ILocationService } from "@herafino/contracts";
import { CraftsmanRepository } from "../repositories/craftsman.repository";
import { valkey } from "../valkey/client";

export class LocationService implements ILocationService {
  async getGeocode(address: string): Promise<GeocodeResult> {
    // Server-side geocoding via the Google Maps Geocoding API. A dedicated
    // server key is required (the public NEXT_PUBLIC_* key must never be used
    // on the server). When unconfigured we fail loudly so callers don't silently
    // persist zero coordinates.
    const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY;
    if (!apiKey) {
      throw new Error(
        "Geocoding is not configured: set GOOGLE_MAPS_SERVER_KEY to enable address geocoding"
      );
    }

    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", address);
    url.searchParams.set("language", "ar");
    url.searchParams.set("region", "eg");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      throw new Error(`Geocoding request failed with status ${res.status}`);
    }

    const data = (await res.json()) as {
      status: string;
      error_message?: string;
      results?: Array<{
        formatted_address: string;
        geometry: { location: { lat: number; lng: number } };
      }>;
    };

    if (data.status !== "OK" || !data.results?.length) {
      throw new Error(
        `Geocoding returned no results (status: ${data.status}${data.error_message ? ` — ${data.error_message}` : ""})`
      );
    }

    const top = data.results[0];
    return {
      lat: String(top.geometry.location.lat),
      lng: String(top.geometry.location.lng),
      formattedAddress: top.formatted_address,
    };
  }

  async updateCraftsmanLocation(
    userId: string,
    lat: string,
    lng: string,
    available: boolean
  ): Promise<void> {
    const existing = await db.query.craftsmanLocations.findFirst({
      where: eq(craftsmanLocations.userId, userId),
    });
    if (existing) {
      await db
        .update(craftsmanLocations)
        .set({
          latitude: lat,
          longitude: lng,
          isAvailable: available,
          lastUpdated: new Date(),
        })
        .where(eq(craftsmanLocations.userId, userId));
    } else {
      await db.insert(craftsmanLocations).values({
        userId,
        latitude: lat,
        longitude: lng,
        isAvailable: available,
      });
    }
    logger.info({ userId, lat, lng, available }, "Craftsman location updated");
  }

  async getNearbyCraftsmen(
    lat: string,
    lng: string,
    craftType: string,
    radiusKm: number
  ): Promise<NearbyCraftsman[]> {
    // The authoritative spatial query lives in CraftsmanRepository
    // (PostGIS-backed, with an in-memory haversine fallback). Delegate to it
    // instead of duplicating the logic here.
    const results = await new CraftsmanRepository().searchNearbyCraftsmen(
      craftType as CraftType,
      lat,
      lng,
      radiusKm
    );
    return results.map((r) => ({
      userId: r.profile.userId,
      name: r.name,
      craftType: r.profile.craftType,
      latitude: r.profile.workshopLatitude,
      longitude: r.profile.workshopLongitude,
      distanceKm: r.distanceKm,
      rating: 0,
      isAvailable: r.profile.isAvailable,
    }));
  }

  subscribeToLocationUpdates(userId: string, callback: (location: Location) => void): () => void {
    // The WebSocket server publishes live craftsman location changes to the
    // `herafino:ws:location` Valkey channel (see apps/web/src/ws/server.ts).
    // Subscribe to that channel and forward only updates for the requested user,
    // mapping the wire payload onto the domain `Location` type.
    const subscriber = valkey.duplicate();

    const handleMessage = (channel: string, raw: string) => {
      if (channel !== "herafino:ws:location") return;
      try {
        const data = JSON.parse(raw) as {
          userId?: string;
          latitude?: string;
          longitude?: string;
          isAvailable?: boolean;
          timestamp?: number;
        };
        if (!data.userId || data.userId !== userId) return;
        if (!data.latitude || !data.longitude) return;
        callback({
          id: `${userId}-${data.timestamp ?? Date.now()}`,
          userId,
          latitude: data.latitude,
          longitude: data.longitude,
          updatedAt: new Date(data.timestamp ?? Date.now()),
          available: data.isAvailable ?? false,
        });
      } catch {
        // skip malformed payloads
      }
    };

    void subscriber.connect().then(async () => {
      await subscriber.subscribe(
        "herafino:ws:location",
        (_err: Error | null | undefined, ...chunks: unknown[]) => {
          const raw = chunks[0];
          if (typeof raw === "string") handleMessage("herafino:ws:location", raw);
        }
      );
    });

    return () => {
      void subscriber
        .unsubscribe("herafino:ws:location")
        .then(() => subscriber.quit())
        .catch(() => undefined);
    };
  }
}
