import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: [".env.local", ".env"] });

// Prefer DIRECT_URL for migrations (Supabase session/direct on :5432).
// App runtime still uses DATABASE_URL (pooler :6543) via postgresAdapter.
const datasourceUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!datasourceUrl) {
  throw new Error("Set DATABASE_URL, or DIRECT_URL for migrations.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: { url: datasourceUrl },
});
