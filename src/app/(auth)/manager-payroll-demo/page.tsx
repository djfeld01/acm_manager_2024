"use client";

import { useState } from "react";
import { AppShell, PageWrapper } from "@/components/layout";
import {
  TeamPayrollOverview,
  AdminPayrollManagement,
  PayrollAccessControl,
  PayrollPermissionsDisplay,
  usePayrollPermissions,
  TeamMember,
  TeamPayrollSummary,
  PayrollPeriodAdmin,
  PayrollSummaryAdmin,
  BatchOperation,
  PayrollRole,
  PayrollData,
} from "@/components/payroll";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// Helper component to avoid hook usage in callback
function RolePermissionDisplay({
  role,
  selectedRole,
}: {
  role: PayrollRole;
  selectedRole: PayrollRole;
}) {
  const rolePermissions = usePayrollPermissions(role);
  const actions = rolePermissions.getAccessibleActions();

  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <Badge variant={role === selectedRole ? "default" : "outline"}>
          {role}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {actions.length} permissions
        </span>
      </div>
      <div className="text-xs text-muted-foreground">
        {actions.slice(0, 3).join(", ")}
        {actions.length > 3 && ` +${actions.length - 3} more`}
      </div>
    </div>
  );
}

export default function ManagerPayrollDemoPage() {
  const [selectedRole, setSelectedRole] = useState<PayrollRole>("MANAGER");
  const [selectedPeriod, setSelectedPeriod] = useState("2024-01-01");

  // Mock data for team payroll
  const mockTeamMembers: TeamMember[] = [
    {
      employeeId: "emp-001",
      employeeName: "John Smith",
      role: "Assistant Manager",
      locationId: "loc-001",
      locationName: "Downtown Storage",
      locationAbbreviation: "DT",
      isActive: true,
      hireDate: "2023-03-15",
      payrollData: {
        employeeId: "emp-001",
        employeeName: "John Smith",
        payPeriodId: "2024-01-01",
        payPeriodStart: "2024-01-01",
        payPeriodEnd: "2024-01-15",
        locationName: "Downtown Storage",
        locationAbbreviation: "DT",
        basePay: 2400,
        vacationHours: 8,
        holidayHours: 0,
        monthlyBonus: 500,
        christmasBonus: 0,
        commission: 750,
        commissionCount: 15,
        mileageDollars: 125,
        hasUnpaidCommission: false,
        unpaidCommissionCount: 0,
        totalPay: 3775,
      },
    },
    {
      employeeId: "emp-002",
      employeeName: "Sarah Johnson",
      role: "Sales Associate",
      locationId: "loc-001",
      locationName: "Downtown Storage",
      locationAbbreviation: "DT",
      isActive: true,
      hireDate: "2023-06-20",
      payrollData: {
        employeeId: "emp-002",
        employeeName: "Sarah Johnson",
        payPeriodId: "2024-01-01",
        payPeriodStart: "2024-01-01",
        payPeriodEnd: "2024-01-15",
        locationName: "Downtown Storage",
        locationAbbreviation: "DT",
        basePay: 2200,
        vacationHours: 4,
        holidayHours: 8,
        monthlyBonus: 300,
        christmasBonus: 0,
        commission: 920,
        commissionCount: 18,
        mileageDollars: 85,
        hasUnpaidCommission: true,
        unpaidCommissionCount: 3,
        totalPay: 3513,
      },
    },
    {
      employeeId: "emp-003",
      employeeName: "Mike Wilson",
      role: "Maintenance",
      locationId: "loc-002",
      locationName: "Westside Storage",
      locationAbbreviation: "WS",
      isActive: true,
      hireDate: "2022-11-10",
      payrollData: {
        employeeId: "emp-003",
        employeeName: "Mike Wilson",
        payPeriodId: "2024-01-01",
        payPeriodStart: "2024-01-01",
        payPeriodEnd: "2024-01-15",
        locationName: "Westside Storage",
        locationAbbreviation: "WS",
        basePay: 2600,
        vacationHours: 0,
        holidayHours: 8,
        monthlyBonus: 200,
        christmasBonus: 0,
        commission: 0,
        commissionCount: 0,
        mileageDollars: 45,
        hasUnpaidCommission: false,
        unpaidCommissionCount: 0,
        totalPay: 2845,
      },
    },
    {
      employeeId: "emp-004",
      employeeName: "Lisa Chen",
      role: "Sales Associate",
      locationId: "loc-002",
      locationName: "Westside Storage",
      locationAbbreviation: "WS",
      isActive: false,
      hireDate: "2023-01-05",
    },
  ];

  const mockTeamSummary: TeamPayrollSummary = {
    totalTeamMembers: 4,
    activeMembers: 3,
    totalPayroll: 10133,
    totalCommission: 1670,
    totalBonuses: 1000,
    unpaidCommissionCount: 3,
    averagePayPerEmployee: 3378,
  };

  // Mock data for admin payroll management
  const mockPayrollPeriods: PayrollPeriodAdmin[] = [
    {
      payPeriodId: "2024-01-01",
      startDate: "2024-01-01",
      endDate: "2024-01-15",
      status: "paid",
      totalEmployees: 45,
      totalPayroll: 152000,
      processedEmployees: 45,
      createdBy: "admin",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-16T10:30:00Z",
    },
    {
      payPeriodId: "2024-01-16",
      startDate: "2024-01-16",
      endDate: "2024-01-31",
      status: "committed",
      totalEmployees: 47,
      totalPayroll: 158000,
      processedEmployees: 47,
      createdBy: "admin",
      createdAt: "2024-01-16T00:00:00Z",
      lastModified: "2024-02-01T09:15:00Z",
    },
    {
      payPeriodId: "2024-02-01",
      startDate: "2024-02-01",
      endDate: "2024-02-15",
      status: "processing",
      totalEmployees: 48,
      totalPayroll: 162000,
      processedEmployees: 32,
      createdBy: "admin",
      createdAt: "2024-02-01T00:00:00Z",
      lastModified: "2024-02-10T14:20:00Z",
    },
  ];

  const mockAdminSummary: PayrollSummaryAdmin = {
    totalEmployees: 48,
    totalLocations: 17,
    totalPayroll: 472000,
    pendingApprovals: 5,
    processingErrors: 2,
    completedPayrolls: 140,
  };

  const mockBatchOperations: BatchOperation[] = [
    {
      operationId: "op-001",
      type: "calculate",
      status: "running",
      employeeCount: 48,
      progress: 67,
      startedAt: "2024-02-10T14:00:00Z",
    },
    {
      operationId: "op-002",
      type: "export",
      status: "completed",
      employeeCount: 45,
      progress: 100,
      startedAt: "2024-02-10T13:30:00Z",
      completedAt: "2024-02-10T13:35:00Z",
    },
  ];

  const mockSimplePayrollPeriods = [
    {
      payPeriodId: "2024-01-01",
      startDate: "2024-01-01",
      endDate: "2024-01-15",
      status: "paid" as const,
    },
    {
      payPeriodId: "2024-01-16",
      startDate: "2024-01-16",
      endDate: "2024-01-31",
      status: "committed" as const,
    },
  ];

  const { permissions, getAccessibleActions } =
    usePayrollPermissions(selectedRole);

  const handleRoleChange = (role: PayrollRole) => {
    setSelectedRole(role);
    toast.info(`Switched to ${role} role`);
  };

  const handleTeamAction = (action: string, data?: any) => {
    toast.success(`${action} action triggered`, {
      description: data ? JSON.stringify(data) : undefined,
    });
  };

  const handleAdminAction = (action: string, data?: any) => {
    toast.success(`Admin ${action} action triggered`, {
      description: data ? JSON.stringify(data) : undefined,
    });
  };

  return (
    <AppShell>
      <PageWrapper
        title="Manager Payroll Oversight Demo"
        description="Role-based payroll management for Area Managers and Admins"
        badge={{ text: "Demo", variant: "secondary" }}
      >
        <div className="space-y-6">
          {/* Role Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Role-Based Access Demo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Role:</label>
                  <Select value={selectedRole} onValueChange={handleRoleChange}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="OWNER">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <PayrollPermissionsDisplay userRole={selectedRole} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Team Oversight</h3>
              <p className="text-sm text-muted-foreground">
                Area Managers can view and manage their direct reports&apos;
                payroll
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Admin Management</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive payroll processing tools and batch operations
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Access Control</h3>
              <p className="text-sm text-muted-foreground">
                Role-based permissions ensure data isolation and security
              </p>
            </div>
          </div>

          <Tabs defaultValue="team" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="team">Team Management</TabsTrigger>
              <TabsTrigger value="admin">Admin Tools</TabsTrigger>
              <TabsTrigger value="permissions">Access Control</TabsTrigger>
            </TabsList>

            {/* Team Management Tab */}
            <TabsContent value="team" className="space-y-6">
              <PayrollAccessControl
                userRole={selectedRole}
                userId="manager-001"
                requiredPermission="canViewTeamPayroll"
                showError={true}
              >
                <TeamPayrollOverview
                  managerId="manager-001"
                  managerName="Alice Manager"
                  teamMembers={mockTeamMembers}
                  payrollSummary={mockTeamSummary}
                  selectedPeriodId={selectedPeriod}
                  payrollPeriods={mockSimplePayrollPeriods}
                  onPeriodChange={setSelectedPeriod}
                  onViewEmployeeDetails={(employeeId) =>
                    handleTeamAction("View Employee Details", { employeeId })
                  }
                  onExportTeamPayroll={(format) =>
                    handleTeamAction("Export Team Payroll", { format })
                  }
                  onProcessPayroll={(employeeIds) =>
                    handleTeamAction("Process Payroll", { employeeIds })
                  }
                />
              </PayrollAccessControl>
            </TabsContent>

            {/* Admin Tools Tab */}
            <TabsContent value="admin" className="space-y-6">
              <PayrollAccessControl
                userRole={selectedRole}
                userId="admin-001"
                requiredPermission="canAccessAdminTools"
                showError={true}
              >
                <AdminPayrollManagement
                  payrollPeriods={mockPayrollPeriods}
                  payrollSummary={mockAdminSummary}
                  batchOperations={mockBatchOperations}
                  selectedPeriodId={selectedPeriod}
                  onPeriodChange={setSelectedPeriod}
                  onCreatePeriod={(startDate, endDate) =>
                    handleAdminAction("Create Period", { startDate, endDate })
                  }
                  onProcessPeriod={(periodId) =>
                    handleAdminAction("Process Period", { periodId })
                  }
                  onApprovePeriod={(periodId) =>
                    handleAdminAction("Approve Period", { periodId })
                  }
                  onExportPayroll={(periodId, format) =>
                    handleAdminAction("Export Payroll", { periodId, format })
                  }
                  onBatchOperation={(operation, employeeIds) =>
                    handleAdminAction("Batch Operation", {
                      operation,
                      employeeIds,
                    })
                  }
                  onCancelOperation={(operationId) =>
                    handleAdminAction("Cancel Operation", { operationId })
                  }
                />
              </PayrollAccessControl>
            </TabsContent>

            {/* Access Control Tab */}
            <TabsContent value="permissions" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Permission Examples */}
                <Card>
                  <CardHeader>
                    <CardTitle>Permission Examples</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">View Own Payroll</h4>
                      <PayrollAccessControl
                        userRole={selectedRole}
                        userId="user-001"
                        targetEmployeeId="user-001"
                        requiredPermission="canViewOwnPayroll"
                        fallback={
                          <Badge variant="destructive">Access Denied</Badge>
                        }
                      >
                        <Badge variant="default">Access Granted</Badge>
                      </PayrollAccessControl>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">View Team Payroll</h4>
                      <PayrollAccessControl
                        userRole={selectedRole}
                        userId="manager-001"
                        requiredPermission="canViewTeamPayroll"
                        fallback={
                          <Badge variant="destructive">Access Denied</Badge>
                        }
                      >
                        <Badge variant="default">Access Granted</Badge>
                      </PayrollAccessControl>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Process Payroll</h4>
                      <PayrollAccessControl
                        userRole={selectedRole}
                        userId="admin-001"
                        requiredPermission="canProcessPayroll"
                        fallback={
                          <Badge variant="destructive">Access Denied</Badge>
                        }
                      >
                        <Badge variant="default">Access Granted</Badge>
                      </PayrollAccessControl>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Admin Tools</h4>
                      <PayrollAccessControl
                        userRole={selectedRole}
                        userId="admin-001"
                        requiredPermission="canAccessAdminTools"
                        fallback={
                          <Badge variant="destructive">Access Denied</Badge>
                        }
                      >
                        <Badge variant="default">Access Granted</Badge>
                      </PayrollAccessControl>
                    </div>
                  </CardContent>
                </Card>

                {/* Role Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle>Role Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(
                        [
                          "USER",
                          "MANAGER",
                          "SUPERVISOR",
                          "ADMIN",
                        ] as PayrollRole[]
                      ).map((role) => (
                        <RolePermissionDisplay
                          key={role}
                          role={role}
                          selectedRole={selectedRole}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Features Summary */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              Manager Oversight Features
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h3 className="font-medium">Team Management</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• View direct reports&apos; payroll information</li>
                  <li>• Filter and search team members</li>
                  <li>• Export team payroll data</li>
                  <li>• Process selected employee payrolls</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Admin Tools</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Comprehensive payroll period management</li>
                  <li>• Batch operations and processing</li>
                  <li>• System-wide payroll oversight</li>
                  <li>• Advanced reporting and analytics</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Access Control</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Role-based permission system</li>
                  <li>• Data isolation by location and team</li>
                  <li>• Granular access controls</li>
                  <li>• Audit trail and compliance</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Security Features</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Server-side permission validation</li>
                  <li>• Location-based access restrictions</li>
                  <li>• Employee data protection</li>
                  <li>• Secure export and processing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    </AppShell>
  );
}
