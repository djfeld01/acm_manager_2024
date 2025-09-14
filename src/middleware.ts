import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_ROUTES = [
  "/dashboard",
  "/payroll",
  "/locations",
  "/reports",
  "/admin",
];

// Routes that require specific roles
const ROLE_PROTECTED_ROUTES = {
  "/admin": ["ADMIN", "OWNER"],
  "/reports": ["SUPERVISOR", "ADMIN", "OWNER"],
};

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/auth/signin",
  "/auth/signout",
  "/unauthorized",
  "/api/auth",
];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes (except auth)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/favicon") ||
    (pathname.startsWith("/api") && !pathname.startsWith("/api/auth"))
  ) {
    return NextResponse.next();
  }

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // For protected routes, let page-level auth handle the protection
  // This avoids Edge Runtime issues with database connections
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public|images).*)",
  ],
};
