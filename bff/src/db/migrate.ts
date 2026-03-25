import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./index.js";

/**
 * Run all pending migrations on startup.
 * Drizzle uses advisory locks to prevent concurrent migration runs.
 */
export async function runMigrations(): Promise<void> {
  console.log("Running database migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations complete.");
}
