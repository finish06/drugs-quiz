import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("Missing required env var: DATABASE_URL");
  process.exit(1);
}

/** Postgres connection (pooled) */
const client = postgres(DATABASE_URL);

/** Drizzle ORM instance with schema */
export const db = drizzle(client, { schema });

export { client };
