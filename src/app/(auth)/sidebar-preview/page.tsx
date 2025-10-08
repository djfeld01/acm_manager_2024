"use client";

import { useSession } from "next-auth/react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DesktopSidebar } from "@/components/layout";
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

export default function SidebarPreviewPage() {
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
            Please sign in to view the sidebar preview.
          </p>
          <Button onClick={() => signIn()}>Sign In</Button>
        </div>
      </div>
    );
  }

  const user = session?.user;

  return (
    <SidebarProvider defaultOpen={true}>
      <DesktopSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Sidebar Preview</h1>
            <Badge variant="secondary">New Frontend</Badge>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Desktop Sidebar</CardTitle>
                <CardDescription>
                  Role-based navigation with collapsible design
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✅ Role-based menu filtering</li>
                  <li>✅ Active route highlighting</li>
                  <li>✅ Collapsible with tooltips</li>
                  <li>✅ User profile dropdown</li>
                  <li>✅ Keyboard shortcuts (Cmd/Ctrl+B)</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current User</CardTitle>
                <CardDescription>Your authentication details</CardDescription>
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
                    <strong>User ID:</strong> {user?.id}
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
                <CardTitle>Navigation Features</CardTitle>
                <CardDescription>Try these sidebar features</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Click the hamburger menu to toggle</li>
                  <li>• Use Cmd/Ctrl+B keyboard shortcut</li>
                  <li>• Click your avatar for profile menu</li>
                  <li>• Hover over collapsed items for tooltips</li>
                  <li>• Navigate between different sections</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Role-Based Access</CardTitle>
              <CardDescription>
                Navigation items shown based on your role
              </CardDescription>
              <div className="mt-2">
                <Badge>{user?.role}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Available to you:</h4>
                  <ul className="space-y-1 text-sm text-green-600">
                    <li>✅ Dashboard</li>
                    <li>✅ Payroll</li>
                    <li>✅ Locations</li>
                    {(user?.role === "SUPERVISOR" ||
                      user?.role === "ADMIN" ||
                      user?.role === "OWNER") && (
                      <>
                        <li>✅ Reports</li>
                        <li>✅ Employees</li>
                      </>
                    )}
                    {(user?.role === "ADMIN" || user?.role === "OWNER") && (
                      <li>✅ Admin</li>
                    )}
                    <li>✅ Settings</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Restricted items:</h4>
                  <ul className="space-y-1 text-sm text-gray-500">
                    {user?.role !== "ADMIN" &&
                      user?.role !== "OWNER" &&
                      user?.role !== "SUPERVISOR" && (
                        <>
                          <li>❌ Reports (Supervisor+ only)</li>
                          <li>❌ Employees (Supervisor+ only)</li>
                        </>
                      )}
                    {user?.role !== "ADMIN" && user?.role !== "OWNER" && (
                      <li>❌ Admin (Admin+ only)</li>
                    )}
                    {(user?.role === "ADMIN" ||
                      user?.role === "OWNER" ||
                      user?.role === "SUPERVISOR") && (
                      <li className="text-green-600">
                        🎉 You have access to all items!
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
              <CardDescription>
                Session and authentication debug details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm font-mono">
                <div>
                  <strong>Session Status:</strong> {status}
                </div>
                <div>
                  <strong>Has Session:</strong> {session ? "Yes" : "No"}
                </div>
                <div>
                  <strong>Has User:</strong> {user ? "Yes" : "No"}
                </div>
                <div>
                  <strong>User Detail ID:</strong>{" "}
                  {user?.userDetailId || "None"}
                </div>
                <div>
                  <strong>Facilities Count:</strong>{" "}
                  {user?.facilities?.length || 0}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
