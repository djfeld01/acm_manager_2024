"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  RefreshCw,
} from "lucide-react";
import {
  ErrorReport,
  PerformanceMetrics,
} from "@/lib/monitoring/error-tracking";

interface MonitoringDashboardProps {
  userRole: string;
}

export function MonitoringDashboard({ userRole }: MonitoringDashboardProps) {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [errorReports, setErrorReports] = useState<ErrorReport[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<
    PerformanceMetrics[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole === "admin" || userRole === "super_admin") {
      loadMonitoringData();

      // Refresh data every 30 seconds
      const interval = setInterval(loadMonitoringData, 30000);
      return () => clearInterval(interval);
    }
  }, [userRole]);

  const loadMonitoringData = async () => {
    try {
      setLoading(true);

      // Load health status
      const healthResponse = await fetch("/api/health");
      const health = await healthResponse.json();
      setHealthStatus(health);

      // Load error reports (from localStorage for demo)
      const storedErrors = JSON.parse(
        localStorage.getItem("error_reports") || "[]"
      );
      setErrorReports(storedErrors.slice(-50)); // Last 50 errors

      // Generate mock performance data for demo
      const mockPerformance = generateMockPerformanceData();
      setPerformanceMetrics(mockPerformance);
    } catch (error) {
      console.error("Failed to load monitoring data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (userRole !== "admin" && userRole !== "super_admin") {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You don&apos;t have permission to access the monitoring dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time application health and performance metrics
          </p>
        </div>
        <Button onClick={loadMonitoringData} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Health Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <HealthStatusCard
          title="Overall Health"
          status={healthStatus?.status || "unknown"}
          icon={Activity}
        />
        <HealthStatusCard
          title="Database"
          status={healthStatus?.checks?.database?.status || "unknown"}
          icon={CheckCircle}
        />
        <HealthStatusCard
          title="External Services"
          status={healthStatus?.checks?.externalServices?.status || "unknown"}
          icon={Zap}
        />
        <HealthStatusCard
          title="Feature Flags"
          status={healthStatus?.checks?.featureFlags?.status || "unknown"}
          icon={Users}
        />
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Error Tracking</TabsTrigger>
          <TabsTrigger value="system">System Info</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceMetricsPanel metrics={performanceMetrics} />
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <ErrorTrackingPanel errors={errorReports} />
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <SystemInfoPanel healthStatus={healthStatus} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HealthStatusCard({
  title,
  status,
  icon: Icon,
}: {
  title: string;
  status: string;
  icon: any;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600";
      case "degraded":
        return "text-yellow-600";
      case "unhealthy":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case "degraded":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Degraded</Badge>
        );
      case "unhealthy":
        return <Badge className="bg-red-100 text-red-800">Unhealthy</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {getStatusBadge(status)}
          </div>
          <Icon className={`h-8 w-8 ${getStatusColor(status)}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceMetricsPanel({
  metrics,
}: {
  metrics: PerformanceMetrics[];
}) {
  const avgLoadTime =
    metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length
      : 0;

  const avgFCP =
    metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.firstContentfulPaint, 0) /
        metrics.length
      : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Load Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgLoadTime.toFixed(0)}ms</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
              12% improvement
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              First Contentful Paint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgFCP.toFixed(0)}ms</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-red-500" />
              3% slower
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.length}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              24% increase
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.slice(-20)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: number) => [
                  `${value.toFixed(0)}ms`,
                  "Load Time",
                ]}
              />
              <Line
                type="monotone"
                dataKey="loadTime"
                stroke="#8884d8"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function ErrorTrackingPanel({ errors }: { errors: ErrorReport[] }) {
  const errorsByHour = errors.reduce((acc, error) => {
    const hour = new Date(error.timestamp).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const chartData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    errors: errorsByHour[i] || 0,
  }));

  const errorsBySeverity = errors.reduce((acc, error) => {
    acc[error.severity] = (acc[error.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(errorsBySeverity).map(([severity, count]) => (
          <Card key={severity}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground capitalize">
                    {severity} Errors
                  </p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
                <AlertTriangle
                  className={`h-6 w-6 ${
                    severity === "critical"
                      ? "text-red-500"
                      : severity === "high"
                      ? "text-orange-500"
                      : severity === "medium"
                      ? "text-yellow-500"
                      : "text-blue-500"
                  }`}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Errors by Hour</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="errors" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {errors
              .slice(-10)
              .reverse()
              .map((error, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{error.message}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(error.timestamp).toLocaleString()} • {error.url}
                    </div>
                  </div>
                  <Badge
                    variant={
                      error.severity === "critical"
                        ? "destructive"
                        : error.severity === "high"
                        ? "destructive"
                        : error.severity === "medium"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {error.severity}
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SystemInfoPanel({ healthStatus }: { healthStatus: any }) {
  if (!healthStatus) {
    return <div>Loading system information...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Application</h4>
              <div className="space-y-1 text-sm">
                <div>Version: {healthStatus.version}</div>
                <div>Environment: {healthStatus.environment}</div>
                <div>
                  Build Time:{" "}
                  {healthStatus.buildTime
                    ? new Date(healthStatus.buildTime).toLocaleString()
                    : "Unknown"}
                </div>
                <div>
                  Uptime: {Math.round(healthStatus.uptime / 60)} minutes
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Memory Usage</h4>
              <div className="space-y-1 text-sm">
                <div>
                  RSS: {Math.round(healthStatus.memory.rss / 1024 / 1024)} MB
                </div>
                <div>
                  Heap Used:{" "}
                  {Math.round(healthStatus.memory.heapUsed / 1024 / 1024)} MB
                </div>
                <div>
                  Heap Total:{" "}
                  {Math.round(healthStatus.memory.heapTotal / 1024 / 1024)} MB
                </div>
                <div>
                  External:{" "}
                  {Math.round(healthStatus.memory.external / 1024 / 1024)} MB
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(healthStatus.checks || {}).map(
              ([service, status]: [string, any]) => (
                <div
                  key={service}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <span className="font-medium capitalize">
                    {service.replace(/([A-Z])/g, " $1")}
                  </span>
                  <Badge
                    variant={
                      status.status === "healthy" ? "default" : "destructive"
                    }
                  >
                    {status.status}
                  </Badge>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Generate mock performance data for demo
function generateMockPerformanceData(): PerformanceMetrics[] {
  const data: PerformanceMetrics[] = [];
  const now = new Date();

  for (let i = 0; i < 20; i++) {
    const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000); // 5 minutes apart
    data.push({
      url: "/dashboard",
      loadTime: 800 + Math.random() * 400,
      firstContentfulPaint: 400 + Math.random() * 200,
      largestContentfulPaint: 1200 + Math.random() * 600,
      firstInputDelay: 50 + Math.random() * 100,
      cumulativeLayoutShift: Math.random() * 0.2,
      timestamp: timestamp.toISOString(),
      deviceType: Math.random() > 0.7 ? "mobile" : "desktop",
      connection: "4g",
    });
  }

  return data.reverse();
}
