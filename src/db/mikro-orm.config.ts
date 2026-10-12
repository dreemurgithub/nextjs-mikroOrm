import { Migrator } from "@mikro-orm/migrations";
import { defineConfig } from "@mikro-orm/postgresql";
import { SeedManager } from "@mikro-orm/seeder";
import { entities } from "./entities";

// Next.js loads .env itself; the MikroORM CLI does not.
try {
  process.loadEnvFile();
} catch {}

export const SOFT_DELETE_FILTER = "softDelete";

export default defineConfig({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME ?? "mikro-seo",
  entities,
  extensions: [Migrator, SeedManager],
  debug: process.env.DB_DEBUG === "true",
  filters: {
    // Every query hides soft-deleted rows unless called with `filters: { softDelete: false }`.
    [SOFT_DELETE_FILTER]: {
      cond: { deletedAt: null },
      entity: entities,
      default: true,
    },
  },
  migrations: {
    path: "./src/db/migrations",
    pathTs: "./src/db/migrations",
    emit: "ts",
    snapshot: false,
    fileName: (timestamp, name) => `Migration${timestamp}${name ? `_${name}` : ""}`,
  },
  seeder: {
    path: "./src/db/seeders",
    pathTs: "./src/db/seeders",
    defaultSeeder: "DatabaseSeeder",
    emit: "ts",
  },
});
