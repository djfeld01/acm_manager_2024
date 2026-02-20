import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Use edge-compatible NextAuth instance (no DB adapter) for middleware
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Pass through API routes — external callers don't have session cookies
  if (pathname.startsWith("/api")) return;

  // Pass through static assets and auth pages
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/unauthorized")
  ) {
    return;
  }

  // Redirect unauthenticated users to NextAuth sign-in
  if (!req.auth) {
    const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
    return Response.redirect(signInUrl);
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|images).*)",
  ],
};
