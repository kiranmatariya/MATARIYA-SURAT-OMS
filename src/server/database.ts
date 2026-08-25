import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { postgresAdapter } from "@/server/postgres-adapter";

const globalDatabase = globalThis as unknown as { matariyaPrisma?: PrismaClient };

function createClient() {
  const url = process.env.DATABASE_URL ?? "postgresql://unconfigured:unconfigured@127.0.0.1:1/unconfigured";
  return new PrismaClient({
    adapter: postgresAdapter(url),
    transactionOptions: {
      maxWait: 10_000,
      timeout: 20_000,
    },
  });
}

export const database = globalDatabase.matariyaPrisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalDatabase.matariyaPrisma = database;
