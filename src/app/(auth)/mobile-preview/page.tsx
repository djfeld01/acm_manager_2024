"use client";

import { useSession } from "next-auth/react";
import { MobileNavigation } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { signIn } from "next-auth/react";

export default function MobilePreviewPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Authentication Required</h1>
          <p className="text-muted-foreground">
            Please sign in to view the mobile navigation preview.
          </p>
          <Button onClick={() => signIn()}>Sign In</Button>
        </div>
      </div>
    );
  }

  const user = session?.user;

  return (
    <div className="min-h-screen bg-background">
      <MobileNavigation />

      <main className="px-4 py-6 pb-20">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Mobile Navigation Preview</h1>
            <p className="text-muted-foreground mt-2">
              Resize your browser to mobile width or use dev tools mobile view
            </p>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Mobile Navigation Features</CardTitle>
                <CardDescription>
                  Touch-optimized navigation for mobile devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✅ Bottom tab navigation (primary items)</li>
                  <li>✅ Hamburger menu (secondary items)</li>
                  <li>✅ 44px minimum touch targets</li>
                  <li>✅ User profile dropdown</li>
                  <li>✅ Active state highlighting</li>
                  <li>✅ Role-based filtering</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current User</CardTitle>
                <CardDescription>Your mobile session details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Name:</strong> {user?.name || "Not set"}
                  </div>
                  <div>
                    <strong>Email:</strong> {user?.email}
                  </div>
                  <div>
                    <strong>Role:</strong>{" "}
                    <Badge variant="outline">{user?.role}</Badge>
                  </div>
                  <div>
                    <strong>Session Status:</strong>{" "}
                    <Badge variant="outline">{status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Testing Instructions</CardTitle>
                <CardDescription>
                  How to test the mobile navigation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>1. Resize Browser:</strong> Make your browser window
                    narrow (&lt; 768px)
                  </div>
                  <div>
                    <strong>2. Use Dev Tools:</strong> Open dev tools and select
                    mobile device view
                  </div>
                  <div>
                    <strong>3. Test Bottom Tabs:</strong> Tap different bottom
                    navigation items
                  </div>
                  <div>
                    <strong>4. Test Hamburger:</strong> Tap the menu icon in the
                    top right
                  </div>
                  <div>
                    <strong>5. Test Profile:</strong> Tap your avatar for
                    profile options
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Role-Based Navigation</CardTitle>
                <CardDescription>Items visible for your role</CardDescription>
                <div className="mt-2">
                  <Badge>{user?.role}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Bottom Tabs (Primary):</h4>
                    <ul className="space-y-1 text-sm text-green-600">
                      <li>✅ Dashboard</li>
                      <li>✅ Payroll</li>
                      <li>✅ Locations</li>
                      {(user?.role === "SUPERVISOR" ||
                        user?.role === "ADMIN" ||
                        user?.role === "OWNER") && <li>✅ Reports</li>}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">
                      Hamburger Menu (Secondary):
                    </h4>
                    <ul className="space-y-1 text-sm text-blue-600">
                      {(user?.role === "SUPERVISOR" ||
                        user?.role === "ADMIN" ||
                        user?.role === "OWNER") && <li>✅ Employees</li>}
                      {(user?.role === "ADMIN" || user?.role === "OWNER") && (
                        <li>✅ Admin</li>
                      )}
                      <li>✅ Settings</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scroll Test</CardTitle>
                <CardDescription>
                  Test that bottom navigation stays fixed while scrolling
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-4 bg-muted rounded-lg">
                      <p className="text-sm">
                        Content block {i + 1} - The bottom navigation should
                        remain fixed at the bottom of the screen while you
                        scroll through this content.
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
