"use client";

import { useSession } from "next-auth/react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DesktopSidebarV2, Breadcrumbs } from "@/components/layout/Navigation";
import {
  NavigationProvider,
  useNavigation,
} from "@/lib/navigation/NavigationContext";
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

function NavigationContent() {
  const { data: session, status } = useSession();
  const {
    navigationState,
    breadcrumbs,
    navigationItems,
    primaryNavItems,
    secondaryNavItems,
    toggleSidebar,
    isActiveRoute,
  } = useNavigation();

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
            Please sign in to view the navigation preview.
          </p>
          <Button onClick={() => signIn()}>Sign In</Button>
        </div>
      </div>
    );
  }

  const user = session?.user;

  return (
    <SidebarProvider defaultOpen={!navigationState.isCollapsed}>
      <DesktopSidebarV2 />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2 flex-1">
            <Breadcrumbs />
            <div className="ml-auto">
              <Badge variant="secondary">Enhanced Navigation</Badge>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Enhanced Navigation Features</CardTitle>
                <CardDescription>
                  Advanced navigation with state management and routing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✅ Navigation state persistence</li>
                  <li>✅ Breadcrumb navigation</li>
                  <li>✅ Active route detection</li>
                  <li>✅ Role-based filtering</li>
                  <li>✅ Context-based state management</li>
                  <li>✅ Integration tests</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Navigation State</CardTitle>
                <CardDescription>
                  Current navigation state and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Sidebar Collapsed:</strong>{" "}
                    <Badge variant="outline">
                      {navigationState.isCollapsed ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div>
                    <strong>Last Visited:</strong>{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      {navigationState.lastVisitedPath}
                    </code>
                  </div>
                  <div>
                    <strong>Mobile Menu:</strong>{" "}
                    <Badge variant="outline">
                      {navigationState.preferences.mobileMenuOpen
                        ? "Open"
                        : "Closed"}
                    </Badge>
                  </div>
                  <div className="pt-2">
                    <Button size="sm" variant="outline" onClick={toggleSidebar}>
                      Toggle Sidebar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Breadcrumbs</CardTitle>
                <CardDescription>Current breadcrumb trail</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.href} className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {index + 1}.
                      </span>
                      <span
                        className={
                          crumb.isActive
                            ? "font-medium"
                            : "text-muted-foreground"
                        }
                      >
                        {crumb.label}
                      </span>
                      {crumb.isActive && (
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Navigation Items Analysis</CardTitle>
              <CardDescription>
                How navigation items are organized for your role
              </CardDescription>
              <div className="mt-2">
                <Badge>{user?.role}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <h4 className="font-medium mb-3">
                    All Navigation Items ({navigationItems.length})
                  </h4>
                  <div className="space-y-1 text-sm">
                    {navigationItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between"
                      >
                        <span
                          className={
                            isActiveRoute(item.href)
                              ? "font-medium text-primary"
                              : "text-muted-foreground"
                          }
                        >
                          {item.label}
                        </span>
                        {isActiveRoute(item.href) && (
                          <Badge variant="secondary" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">
                    Primary Items ({primaryNavItems.length})
                  </h4>
                  <div className="space-y-1 text-sm">
                    {primaryNavItems.map((item) => (
                      <div key={item.id} className="text-green-600">
                        ✅ {item.label}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Shown in mobile bottom tabs
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-3">
                    Secondary Items ({secondaryNavItems.length})
                  </h4>
                  <div className="space-y-1 text-sm">
                    {secondaryNavItems.map((item) => (
                      <div key={item.id} className="text-blue-600">
                        📱 {item.label}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Shown in mobile hamburger menu
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Testing Instructions</CardTitle>
              <CardDescription>
                How to test the enhanced navigation features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">State Management:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Toggle sidebar and refresh page</li>
                    <li>• Navigate between pages</li>
                    <li>• Check localStorage persistence</li>
                    <li>• Test keyboard shortcuts (Cmd/Ctrl+B)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Breadcrumbs:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Navigate to different sections</li>
                    <li>• Check breadcrumb updates</li>
                    <li>• Test breadcrumb links</li>
                    <li>• Verify active state highlighting</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function NavigationPreviewPage() {
  return (
    <NavigationProvider>
      <NavigationContent />
    </NavigationProvider>
  );
}
