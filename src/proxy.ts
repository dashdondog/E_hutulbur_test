import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-change-me");

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow auth pages and API routes
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/login" ||
    pathname === "/register"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    // Student can only access /student/* and /subjects/*/tests/* and /api/*
    if (role === "student") {
      if (
        pathname.startsWith("/student") ||
        pathname.match(/^\/subjects\/[^/]+\/tests\/[^/]+$/) ||
        pathname.startsWith("/api/")
      ) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/student", request.url));
    }

    // Teacher can access everything except /student
    if (role === "teacher" && pathname.startsWith("/student")) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.set("token", "", { maxAge: 0 });
    return res;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
