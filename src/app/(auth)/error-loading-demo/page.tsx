"use client";

import { useState } from "react";
import { AppShell, PageWrapper, GridLayout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LoadingSpinner,
  PageLoading,
  CardSkeleton,
  TableSkeleton,
  ListSkeleton,
  DashboardSkeleton,
  InlineLoading,
  LoadingOverlay,
} from "@/components/shared/LoadingStates";
import {
  NetworkError,
  NetworkStatus,
  RetryableError,
  getNetworkErrorType,
} from "@/components/shared/NetworkError";
import ErrorBoundary, {
  PageErrorBoundary,
  SectionErrorBoundary,
  ComponentErrorBoundary,
} from "@/components/shared/ErrorBoundary";

// Component that throws an error for testing
function ErrorThrower({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error("This is a test error for demonstration purposes");
  }
  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
      <p className="text-green-800">✅ Component loaded successfully!</p>
    </div>
  );
}

export default function ErrorLoadingDemoPage() {
  const [showError, setShowError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [networkErrorType, setNetworkErrorType] = useState<
    "offline" | "server_error" | "not_found"
  >("offline");
  const [retryCount, setRetryCount] = useState(0);

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    // Simulate retry logic
    console.log(`Retry attempt ${retryCount + 1}`);
  };

  return (
    <AppShell>
      <PageWrapper
        title="Error Handling & Loading States Demo"
        description="Comprehensive demonstration of error boundaries, loading states, and network error handling components."
        badge={{ text: "Interactive Demo", variant: "secondary" }}
        actions={[
          {
            label: "Simulate Loading",
            onClick: simulateLoading,
            variant: "outline",
          },
        ]}
      >
        <Tabs defaultValue="loading" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="loading">Loading States</TabsTrigger>
            <TabsTrigger value="errors">Error Boundaries</TabsTrigger>
            <TabsTrigger value="network">Network Errors</TabsTrigger>
            <TabsTrigger value="interactive">Interactive Tests</TabsTrigger>
          </TabsList>

          <TabsContent value="loading" className="space-y-6">
            <GridLayout cols={1} colsMd={2} gap="lg">
              <Card>
                <CardHeader>
                  <CardTitle>Loading Spinners</CardTitle>
                  <CardDescription>
                    Different sizes and styles of loading spinners
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <LoadingSpinner size="sm" />
                    <span className="text-sm">Small</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <LoadingSpinner size="md" />
                    <span className="text-sm">Medium</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <LoadingSpinner size="lg" />
                    <span className="text-sm">Large</span>
                  </div>
                  <InlineLoading text="Processing..." />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Skeleton Loaders</CardTitle>
                  <CardDescription>
                    Skeleton placeholders for different content types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CardSkeleton contentLines={2} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Table Skeleton</CardTitle>
                  <CardDescription>
                    Loading placeholder for tabular data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TableSkeleton rows={3} columns={3} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>List Skeleton</CardTitle>
                  <CardDescription>
                    Loading placeholder for list items
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ListSkeleton items={3} showAvatar={true} />
                </CardContent>
              </Card>
            </GridLayout>

            <Card>
              <CardHeader>
                <CardTitle>Loading Overlay</CardTitle>
                <CardDescription>
                  Overlay loading state demonstration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LoadingOverlay
                  isLoading={isLoading}
                  loadingText="Loading content..."
                >
                  <div className="h-32 bg-muted rounded-md flex items-center justify-center">
                    <p className="text-muted-foreground">
                      {isLoading
                        ? "Content is loading..."
                        : 'Content loaded! Click "Simulate Loading" to test overlay.'}
                    </p>
                  </div>
                </LoadingOverlay>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dashboard Skeleton</CardTitle>
                <CardDescription>
                  Complete dashboard loading state
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DashboardSkeleton cards={4} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="space-y-6">
            <GridLayout cols={1} colsLg={2} gap="lg">
              <Card>
                <CardHeader>
                  <CardTitle>Component Error Boundary</CardTitle>
                  <CardDescription>
                    Catches errors at the component level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ComponentErrorBoundary>
                    <ErrorThrower shouldThrow={showError} />
                  </ComponentErrorBoundary>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowError(!showError)}
                    >
                      {showError ? "Fix Error" : "Trigger Error"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Section Error Boundary</CardTitle>
                  <CardDescription>
                    Catches errors at the section level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SectionErrorBoundary>
                    <ErrorThrower shouldThrow={false} />
                  </SectionErrorBoundary>
                </CardContent>
              </Card>
            </GridLayout>

            <Card>
              <CardHeader>
                <CardTitle>Error Boundary Features</CardTitle>
                <CardDescription>
                  Key features of our error boundary system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GridLayout cols={1} colsMd={3} gap="md">
                  <div className="space-y-2">
                    <h4 className="font-medium">🛡️ Error Isolation</h4>
                    <p className="text-sm text-muted-foreground">
                      Errors are contained to specific components or sections
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">🔄 Retry Functionality</h4>
                    <p className="text-sm text-muted-foreground">
                      Users can retry failed operations with a single click
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">🐛 Debug Information</h4>
                    <p className="text-sm text-muted-foreground">
                      Detailed error information in development mode
                    </p>
                  </div>
                </GridLayout>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="network" className="space-y-6">
            <GridLayout cols={1} colsMd={2} gap="lg">
              <Card>
                <CardHeader>
                  <CardTitle>Network Error Types</CardTitle>
                  <CardDescription>
                    Different types of network errors
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {(["offline", "server_error", "not_found"] as const).map(
                      (type) => (
                        <Button
                          key={type}
                          variant={
                            networkErrorType === type ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setNetworkErrorType(type)}
                          className="w-full"
                        >
                          {type.replace("_", " ").toUpperCase()}
                        </Button>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Network Error Preview</CardTitle>
                  <CardDescription>
                    Preview of selected network error type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md p-4 min-h-[200px]">
                    <NetworkError
                      type={networkErrorType}
                      onRetry={handleRetry}
                      showDetails={true}
                    />
                  </div>
                </CardContent>
              </Card>
            </GridLayout>

            <Card>
              <CardHeader>
                <CardTitle>Retryable Error</CardTitle>
                <CardDescription>
                  Error component with retry logic and attempt tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RetryableError
                  error={new Error("Network request failed")}
                  onRetry={handleRetry}
                  currentRetry={retryCount}
                  maxRetries={3}
                />
                <div className="mt-4 text-sm text-muted-foreground">
                  Retry attempts: {retryCount}/3
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interactive" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Interactive Error Testing</CardTitle>
                <CardDescription>
                  Test error boundaries and recovery mechanisms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Button
                    variant="destructive"
                    onClick={() => setShowError(true)}
                  >
                    Trigger Component Error
                  </Button>
                  <Button variant="outline" onClick={() => setShowError(false)}>
                    Reset Error State
                  </Button>
                </div>

                <div className="border rounded-md p-4">
                  <ComponentErrorBoundary>
                    <ErrorThrower shouldThrow={showError} />
                  </ComponentErrorBoundary>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Loading State Testing</CardTitle>
                <CardDescription>
                  Test different loading states and overlays
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Button onClick={simulateLoading}>Simulate 2s Loading</Button>
                  <Badge variant="outline">
                    Status: {isLoading ? "Loading" : "Ready"}
                  </Badge>
                </div>

                <LoadingOverlay isLoading={isLoading}>
                  <div className="h-32 bg-muted rounded-md flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Interactive content area
                    </p>
                  </div>
                </LoadingOverlay>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageWrapper>
    </AppShell>
  );
}
