"use client";

import { useState } from "react";
import { AppShell, PageWrapper } from "@/components/layout";
import { RoleDashboard } from "@/components/dashboard";
import { Role } from "@/db/schema/user";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DashboardDemoPage() {
  const [selectedRole, setSelectedRole] = useState<Role>(Role.MANAGER);

  // Mock data for different roles
  const mockData = {
    locationId: "loc-123",
    locationName: "Downtown Storage Facility",
    managedLocations: [
      {
        id: "loc-1",
        name: "Downtown Storage",
        occupancyRate: 87,
        revenue: 45231,
      },
      {
        id: "loc-2",
        name: "Westside Storage",
        occupancyRate: 92,
        revenue: 52100,
      },
      {
        id: "loc-3",
        name: "Northside Storage",
        occupancyRate: 78,
        revenue: 38950,
      },
    ],
    systemStats: {
      totalLocations: 19,
      totalUsers: 45,
      totalRevenue: 892450,
      systemHealth: "good" as const,
    },
  };

  const roleOptions = [
    {
      value: Role.MANAGER,
      label: "Manager",
      description: "Single location management",
    },
    {
      value: Role.ASSISTANT,
      label: "Assistant",
      description: "Location support role",
    },
    {
      value: Role.SUPERVISOR,
      label: "Area Manager",
      description: "Multi-location oversight",
    },
    { value: Role.ADMIN, label: "Admin", description: "System administration" },
    { value: Role.OWNER, label: "Owner", description: "Full system access" },
    { value: Role.USER, label: "User", description: "Basic access" },
  ];

  const currentRoleInfo = roleOptions.find(
    (option) => option.value === selectedRole
  );

  return (
    <AppShell>
      <PageWrapper
        title="Dashboard Demo"
        description="Interactive demonstration of role-specific dashboard layouts"
        badge={{ text: "Demo", variant: "secondary" }}
        actions={[
          {
            label: "Reset Demo",
            onClick: () => setSelectedRole(Role.MANAGER),
            variant: "outline",
          },
        ]}
      >
        <div className="space-y-6">
          {/* Role Selector */}
          <div className="rounded-lg border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Role Selection</h2>
                <p className="text-sm text-muted-foreground">
                  Choose a role to see the corresponding dashboard layout
                </p>
              </div>
              <Badge variant="outline">Current: {currentRoleInfo?.label}</Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Select
                  value={selectedRole}
                  onValueChange={(value) => setSelectedRole(value as Role)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                {roleOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={
                      selectedRole === option.value ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedRole(option.value)}
                    className="hidden sm:inline-flex"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {currentRoleInfo && (
              <div className="text-sm text-muted-foreground">
                <strong>Description:</strong> {currentRoleInfo.description}
              </div>
            )}
          </div>

          {/* Dashboard Features Info */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Manager/Assistant</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Location-specific metrics</li>
                <li>• Personal payroll access</li>
                <li>• Daily operations tools</li>
                <li>• Basic reporting</li>
              </ul>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Area Manager</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Multi-location overview</li>
                <li>• Team management tools</li>
                <li>• Performance analytics</li>
                <li>• Staff scheduling</li>
              </ul>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Admin/Owner</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• System-wide oversight</li>
                <li>• User management</li>
                <li>• Financial analytics</li>
                <li>• Security controls</li>
              </ul>
            </div>
          </div>

          {/* Role-Specific Dashboard */}
          <div className="rounded-lg border">
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold">
                {currentRoleInfo?.label} Dashboard
              </h2>
              <p className="text-sm text-muted-foreground">
                This is how the dashboard appears for users with the{" "}
                {currentRoleInfo?.label.toLowerCase()} role
              </p>
            </div>

            <div className="p-6">
              <RoleDashboard
                userRole={selectedRole}
                locationId={mockData.locationId}
                locationName={mockData.locationName}
                managedLocations={mockData.managedLocations}
                systemStats={mockData.systemStats}
              />
            </div>
          </div>
        </div>
      </PageWrapper>
    </AppShell>
  );
}
