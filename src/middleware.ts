import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// For now, let's simplify the middleware to avoid Edge Runtime issues
// Page-level auth will handle the protection
export default function middleware(request: NextRequest) {
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
