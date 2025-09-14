"use client";

import { useState } from "react";
import {
  AppShell,
  PageWrapper,
  Container,
  GridLayout,
} from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function AppShellDemoPage() {
  const [showBreadcrumbs, setShowBreadcrumbs] = useState(true);
  const [showSidebarTrigger, setShowSidebarTrigger] = useState(true);
  const [layoutVariant, setLayoutVariant] = useState<
    "default" | "centered" | "full-width" | "split"
  >("default");

  const headerContent = (
    <div className="flex items-center gap-2">
      <Badge variant="secondary">Demo</Badge>
      <Button size="sm" variant="outline">
        Action
      </Button>
    </div>
  );

  const demoContent = (
    <PageWrapper
      title="AppShell Demo"
      description="Demonstrating the responsive application shell with various layout options and configurations."
      badge={{ text: "Interactive Demo", variant: "secondary" }}
      actions={[
        {
          label: "Refresh Demo",
          onClick: () => window.location.reload(),
          variant: "outline",
        },
      ]}
    >
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="layouts">Layout Variants</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <GridLayout cols={1} colsMd={2} colsLg={3} gap="lg">
            <Card>
              <CardHeader>
                <CardTitle>Responsive Design</CardTitle>
                <CardDescription>
                  Automatically switches between desktop and mobile layouts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✅ Desktop: Sidebar + main content</li>
                  <li>✅ Mobile: Bottom tabs + header</li>
                  <li>✅ Automatic layout switching</li>
                  <li>✅ Consistent navigation state</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Layout Components</CardTitle>
                <CardDescription>
                  Flexible layout system with multiple variants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>🏗️ AppShell - Main container</li>
                  <li>📐 AppLayout - Advanced layouts</li>
                  <li>📄 PageWrapper - Page structure</li>
                  <li>📦 Container - Content containers</li>
                  <li>🔲 GridLayout - Grid systems</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
                <CardDescription>
                  Built-in features for better user experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>🧭 Breadcrumb navigation</li>
                  <li>🎛️ Sidebar toggle controls</li>
                  <li>📱 Mobile-optimized layouts</li>
                  <li>🎨 Consistent spacing</li>
                  <li>⚡ Performance optimized</li>
                </ul>
              </CardContent>
            </Card>
          </GridLayout>
        </TabsContent>

        <TabsContent value="layouts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Layout Variants</CardTitle>
              <CardDescription>
                Different layout options for various content types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="layout-variant">Current Layout</Label>
                  <div className="mt-2">
                    <Badge variant="outline">{layoutVariant}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  {(
                    ["default", "centered", "full-width", "split"] as const
                  ).map((variant) => (
                    <Button
                      key={variant}
                      variant={
                        layoutVariant === variant ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setLayoutVariant(variant)}
                      className="w-full"
                    >
                      {variant.charAt(0).toUpperCase() +
                        variant.slice(1).replace("-", " ")}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <GridLayout cols={1} colsMd={2} gap="lg">
            <Card>
              <CardHeader>
                <CardTitle>Default Layout</CardTitle>
                <CardDescription>
                  Standard layout with full-width content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded-md flex items-center justify-center text-sm text-muted-foreground">
                  Full-width content area
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Centered Layout</CardTitle>
                <CardDescription>
                  Centered content with max-width constraints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded-md flex items-center justify-center text-sm text-muted-foreground mx-auto max-w-md">
                  Centered content
                </div>
              </CardContent>
            </Card>
          </GridLayout>
        </TabsContent>

        <TabsContent value="components" className="space-y-6">
          <GridLayout cols={1} colsLg={2} gap="lg">
            <Card>
              <CardHeader>
                <CardTitle>Container Component</CardTitle>
                <CardDescription>
                  Responsive containers with size variants
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Container size="sm" className="bg-muted rounded-md">
                  <div className="text-center text-sm py-2">
                    Small Container
                  </div>
                </Container>
                <Container size="md" className="bg-muted rounded-md">
                  <div className="text-center text-sm py-2">
                    Medium Container
                  </div>
                </Container>
                <Container size="lg" className="bg-muted rounded-md">
                  <div className="text-center text-sm py-2">
                    Large Container
                  </div>
                </Container>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Grid Layout</CardTitle>
                <CardDescription>
                  Flexible grid system with responsive breakpoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GridLayout cols={2} colsMd={3} gap="sm">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-12 bg-muted rounded-md flex items-center justify-center text-sm"
                    >
                      {i + 1}
                    </div>
                  ))}
                </GridLayout>
              </CardContent>
            </Card>
          </GridLayout>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AppShell Settings</CardTitle>
              <CardDescription>
                Configure the application shell behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="breadcrumbs"
                  checked={showBreadcrumbs}
                  onCheckedChange={(checked) =>
                    setShowBreadcrumbs(checked === true)
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="breadcrumbs"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Show Breadcrumbs
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Display breadcrumb navigation in the header
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sidebar-trigger"
                  checked={showSidebarTrigger}
                  onCheckedChange={(checked) =>
                    setShowSidebarTrigger(checked === true)
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="sidebar-trigger"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Show Sidebar Trigger
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Display the sidebar toggle button
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Current Configuration</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>
                    Breadcrumbs: {showBreadcrumbs ? "Enabled" : "Disabled"}
                  </div>
                  <div>
                    Sidebar Trigger:{" "}
                    {showSidebarTrigger ? "Enabled" : "Disabled"}
                  </div>
                  <div>Layout Variant: {layoutVariant}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );

  return (
    <AppShell
      showBreadcrumbs={showBreadcrumbs}
      showSidebarTrigger={showSidebarTrigger}
      headerContent={headerContent}
    >
      {demoContent}
    </AppShell>
  );
}
