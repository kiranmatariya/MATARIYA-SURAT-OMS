import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Browser-local review mode contains no production data and needs no login.
  // PostgreSQL mode always uses the full independent Surat authentication flow.
  if (process.env.NEXT_PUBLIC_DATA_PROVIDER !== "postgres") return NextResponse.next();
  const { auth } = await import("@/lib/auth");
  const session = await auth.api.getSession({ headers: request.headers });
  const isApi = request.nextUrl.pathname.startsWith("/api/");
  if (!session || session.user.active === false || session.user.banned) {
    if (isApi) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
    const target = new URL("/login", request.url); target.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(target);
  }
  const adminOnly = request.nextUrl.pathname.startsWith("/settings/users") || request.nextUrl.pathname === "/products/new" || request.nextUrl.pathname.startsWith("/products/fan-rod/") || /^\/products\/[^/]+\/edit$/.test(request.nextUrl.pathname) || /^\/orders\/[^/]+\/reduce$/.test(request.nextUrl.pathname);
  if (adminOnly && session.user.role !== "ADMIN") return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"] };
