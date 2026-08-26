import { config } from "dotenv";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { postgresAdapter } from "../src/server/postgres-adapter";
import { randomUUID } from "node:crypto";

config({ path: [".env.local", ".env"] });

const adminKeys = [
  "FIRST_ADMIN_NAME",
  "FIRST_ADMIN_EMAIL",
  "FIRST_ADMIN_USERNAME",
  "FIRST_ADMIN_PASSWORD",
] as const;

const hasAdminEnv = adminKeys.every((key) => Boolean(process.env[key]));

if (!process.env.DATABASE_URL) {
  console.log("Skipping admin bootstrap: DATABASE_URL is not set.");
  process.exit(0);
}

if (!hasAdminEnv) {
  console.log(
    "Skipping admin bootstrap: FIRST_ADMIN_* env vars are not set (already created, or create later via Settings → Users).",
  );
  process.exit(0);
}

if (process.env.FIRST_ADMIN_PASSWORD!.length < 8) {
  throw new Error("FIRST_ADMIN_PASSWORD must contain at least 8 characters.");
}

const database = new PrismaClient({
  adapter: postgresAdapter(process.env.DATABASE_URL),
});

try {
  if (await database.user.count({ where: { role: "ADMIN" } })) {
    console.log("Administrator already exists. Skipping bootstrap.");
    process.exit(0);
  }

  const password = await hashPassword(process.env.FIRST_ADMIN_PASSWORD!);
  const email = process.env.FIRST_ADMIN_EMAIL!.toLowerCase();
  const id = randomUUID();
  const user = await database.user.create({
    data: {
      id,
      name: process.env.FIRST_ADMIN_NAME!,
      email,
      username: process.env.FIRST_ADMIN_USERNAME!.toLowerCase(),
      displayUsername: process.env.FIRST_ADMIN_USERNAME!,
      role: "ADMIN",
      accounts: {
        create: {
          providerId: "credential",
          accountId: id,
          password,
        },
      },
    },
  });
  console.log(`First administrator created: ${user.email}`);
} finally {
  await database.$disconnect();
}
