"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FeatureFlagProvider,
  useFeatureFlag,
  useAllFeatureFlags,
  FeatureFlagGate,
  MultiFeatureFlagGate,
  FEATURE_FLAG_KEYS,
} from "@/lib/feature-flags";
import { FeatureFlagAdminPanel } from "@/components/admin/FeatureFlagAdmin";
import {
  Flag,
  Users,
  Shield,
  Smartphone,
  Zap,
  TestTube,
  Navigation,
  BarChart3,
  DollarSign,
  Info,
} from "lucide-react";

// Mock user data for demo
const mockUser = {
  id: "user-123",
  role: "admin", // Change this to test different roles: 'admin', 'area_manager', 'manager', 'employee'
  name: "Demo User",
};

export default function FeatureFlagsDemo() {
  return (
    <FeatureFlagProvider userId={mockUser.id} userRole={mockUser.role}>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Feature Flags Demo
          </h1>
          <p className="text-muted-foreground">
            Demonstration of the feature flag system for gradual rollout and A/B
            testing
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Current user: <strong>{mockUser.name}</strong> (Role:{" "}
            <strong>{mockUser.role}</strong>)
            <br />
            Change the role in the code to see different feature flag behaviors.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <FeatureFlagStatusCard />
            <FeatureFlagExamples />
          </div>
          <div className="space-y-6">
            <ConditionalFeatures />
            <RoleBasedFeatures />
          </div>
        </div>

        <FeatureFlagAdminPanel userRole={mockUser.role} userId={mockUser.id} />
      </div>
    </FeatureFlagProvider>
  );
}

function FeatureFlagStatusCard() {
  const flags = useAllFeatureFlags();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="h-5 w-5" />
          Feature Flag Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.values(flags).map((flag) => (
            <FeatureFlagStatus key={flag.key} flagKey={flag.key} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureFlagStatus({ flagKey }: { flagKey: string }) {
  const isEnabled = useFeatureFlag(flagKey);
  const flags = useAllFeatureFlags();
  const flag = flags[flagKey];

  if (!flag) return null;

  return (
    <div className="flex items-center justify-between p-3 border rounded">
      <div>
        <div className="font-medium">{flag.name}</div>
        <div className="text-sm text-muted-foreground">
          Rollout: {flag.rolloutPercentage}%
          {flag.targetRoles && flag.targetRoles.length > 0 && (
            <span> • Roles: {flag.targetRoles.join(", ")}</span>
          )}
        </div>
      </div>
      <Badge variant={isEnabled ? "default" : "secondary"}>
        {isEnabled ? "Enabled" : "Disabled"}
      </Badge>
    </div>
  );
}

function FeatureFlagExamples() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flag Examples</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FeatureFlagGate
          flag={FEATURE_FLAG_KEYS.NEW_FRONTEND}
          fallback={
            <Alert>
              <AlertDescription>
                New frontend is not enabled for your account.
              </AlertDescription>
            </Alert>
          }
        >
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              ✅ New frontend is enabled! You&apos;re seeing the modern
              interface.
            </AlertDescription>
          </Alert>
        </FeatureFlagGate>

        <FeatureFlagGate
          flag={FEATURE_FLAG_KEYS.BETA_FEATURES}
          fallback={
            <Button variant="outline" disabled>
              <TestTube className="h-4 w-4 mr-2" />
              Beta Features (Not Available)
            </Button>
          }
        >
          <Button>
            <TestTube className="h-4 w-4 mr-2" />
            Access Beta Features
          </Button>
        </FeatureFlagGate>

        <MultiFeatureFlagGate
          flags={{
            [FEATURE_FLAG_KEYS.NEW_FRONTEND]: (
              <div className="p-3 border border-blue-200 bg-blue-50 rounded">
                <p className="text-blue-800">New Frontend Active</p>
              </div>
            ),
            [FEATURE_FLAG_KEYS.MOBILE_OPTIMIZATIONS]: (
              <div className="p-3 border border-purple-200 bg-purple-50 rounded">
                <p className="text-purple-800">Mobile Optimizations Active</p>
              </div>
            ),
          }}
          fallback={
            <div className="p-3 border border-gray-200 bg-gray-50 rounded">
              <p className="text-gray-600">No special features enabled</p>
            </div>
          }
          mode="any"
        />
      </CardContent>
    </Card>
  );
}

function ConditionalFeatures() {
  const newNavigation = useFeatureFlag(FEATURE_FLAG_KEYS.NEW_NAVIGATION);
  const newDashboard = useFeatureFlag(FEATURE_FLAG_KEYS.NEW_DASHBOARD);
  const mobileOptimizations = useFeatureFlag(
    FEATURE_FLAG_KEYS.MOBILE_OPTIMIZATIONS
  );
  const performanceFeatures = useFeatureFlag(
    FEATURE_FLAG_KEYS.PERFORMANCE_FEATURES
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conditional UI Components</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <FeatureCard
            icon={Navigation}
            title="Enhanced Navigation"
            enabled={newNavigation}
            description="New responsive navigation with role-based menus"
          />

          <FeatureCard
            icon={BarChart3}
            title="Advanced Dashboard"
            enabled={newDashboard}
            description="Role-specific dashboard with enhanced metrics"
          />

          <FeatureCard
            icon={Smartphone}
            title="Mobile Optimizations"
            enabled={mobileOptimizations}
            description="Touch-friendly interface and PWA features"
          />

          <FeatureCard
            icon={Zap}
            title="Performance Features"
            enabled={performanceFeatures}
            description="Advanced caching and prefetching"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  enabled,
  description,
}: {
  icon: any;
  title: string;
  enabled: boolean;
  description: string;
}) {
  return (
    <div
      className={`p-3 border rounded transition-colors ${
        enabled ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon
          className={`h-5 w-5 ${enabled ? "text-green-600" : "text-gray-400"}`}
        />
        <div className="flex-1">
          <div className="font-medium">{title}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
        <Badge variant={enabled ? "default" : "secondary"}>
          {enabled ? "Active" : "Inactive"}
        </Badge>
      </div>
    </div>
  );
}

function RoleBasedFeatures() {
  const payrollInterface = useFeatureFlag(
    FEATURE_FLAG_KEYS.NEW_PAYROLL_INTERFACE
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Role-Based Features
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            Current role: <strong>{mockUser.role}</strong>
            <br />
            Some features are only available to specific roles.
          </AlertDescription>
        </Alert>

        <FeatureFlagGate
          flag={FEATURE_FLAG_KEYS.NEW_PAYROLL_INTERFACE}
          fallback={
            <div className="p-3 border border-orange-200 bg-orange-50 rounded">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-orange-600" />
                <span className="text-orange-800">
                  Payroll interface not available for your role
                </span>
              </div>
            </div>
          }
        >
          <div className="p-3 border border-green-200 bg-green-50 rounded">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-green-800">
                Enhanced payroll interface available
              </span>
            </div>
          </div>
        </FeatureFlagGate>

        <div className="text-sm text-muted-foreground">
          <p>
            <strong>Admin/Area Manager:</strong> Full access to all features
          </p>
          <p>
            <strong>Manager:</strong> Limited access to location-specific
            features
          </p>
          <p>
            <strong>Employee:</strong> Basic features only
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
