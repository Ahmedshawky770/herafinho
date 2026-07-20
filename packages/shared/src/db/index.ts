import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | null = null;
let drizzleDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getConnectionString(): string {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }
  return connectionString;
}

export function getDb() {
  if (!drizzleDb) {
    client = postgres(getConnectionString(), {
      prepare: false,
    });
    drizzleDb = drizzle(client, { schema });
  }
  return drizzleDb;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle<typeof schema>>];
  },
});

export type Database = ReturnType<typeof getDb>;
