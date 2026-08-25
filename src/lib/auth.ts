import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, username } from "better-auth/plugins";
import { database } from "@/server/database";

export const auth = betterAuth({
  database: prismaAdapter(database, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  advanced: { database: { generateId: "uuid" } },
  emailAndPassword: { enabled: true, disableSignUp: process.env.ALLOW_AUTH_SIGNUP !== "true" },
  disabledPaths: ["/is-username-available"],
  user: { additionalFields: { active: { type: "boolean", defaultValue: true, input: false } } },
  plugins: [username(), admin({ defaultRole: "OFFICE_STAFF", adminRoles: ["ADMIN"] })],
});

export type AuthSession = typeof auth.$Infer.Session;
