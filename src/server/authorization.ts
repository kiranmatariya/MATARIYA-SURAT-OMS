import "server-only";
import { auth, type AuthSession } from "@/lib/auth";

export type AppRole = "ADMIN" | "OFFICE_STAFF";
export async function requireUser(headers: Headers): Promise<AuthSession> {
  const session = await auth.api.getSession({ headers });
  if (!session || session.user.active === false || session.user.banned) throw new Error("UNAUTHORIZED");
  return session;
}
export async function requireAdmin(headers: Headers) {
  const session = await requireUser(headers);
  if (session.user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return session;
}
export function authorizationError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") return Response.json({ error: "Please sign in to continue." }, { status: 401 });
  if (error instanceof Error && error.message === "FORBIDDEN") return Response.json({ error: "Administrator permission is required." }, { status: 403 });
  return null;
}
