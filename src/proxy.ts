import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-change-me"
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;
  let role: string | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      role = payload.role as string;
    } catch {
      // invalid token
    }
  }

  // ── Unauthenticated ──────────────────────────────────────────
  if (!role) {
    if (pathname === "/login" || pathname === "/register") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── Logged in → block auth pages ────────────────────────────
  if (pathname === "/login") {
    return NextResponse.redirect(new URL(homeFor(role), request.url));
  }

  if (pathname === "/register") {
    return NextResponse.redirect(new URL(homeFor(role), request.url));
  }

  // ── Role-based guards ────────────────────────────────────────

  if (pathname.startsWith("/admin")) {
    if (role !== "admin") {
      return NextResponse.redirect(new URL(homeFor(role), request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/student")) {
    if (role !== "student") {
      return NextResponse.redirect(new URL(homeFor(role), request.url));
    }
    return NextResponse.next();
  }

  // Teacher-only pages (/, /classrooms, /subjects, /settings)
  if (role === "student") {
    return NextResponse.redirect(new URL("/student", request.url));
  }
  if (role === "admin") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

function homeFor(role: string) {
  if (role === "student") return "/student";
  if (role === "admin") return "/admin";
  return "/";
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
