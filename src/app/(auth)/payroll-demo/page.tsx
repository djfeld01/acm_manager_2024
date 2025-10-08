"use client";

import { useState } from "react";
import { AppShell, PageWrapper } from "@/components/layout";
import {
  PayrollCard,
  PayrollHistory,
  MultiLocationPayroll,
  PayrollBreakdownModal,
  PayrollData,
  PayrollPeriod,
  LocationPayrollData,
} from "@/components/payroll";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function PayrollDemoPage() {
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollData | null>(
    null
  );
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);

  // Mock data for demonstration
  const mockPayrollPeriods: PayrollPeriod[] = [
    {
      payPeriodId: "2024-01-01",
      startDate: "2024-01-01",
      endDate: "2024-01-15",
      status: "paid",
      year: 2024,
    },
    {
      payPeriodId: "2024-01-16",
      startDate: "2024-01-16",
      endDate: "2024-01-31",
      status: "committed",
      year: 2024,
    },
    {
      payPeriodId: "2024-02-01",
      startDate: "2024-02-01",
      endDate: "2024-02-15",
      status: "draft",
      year: 2024,
    },
  ];

  const mockPayrollData: PayrollData = {
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
    monthlyBonusBreakdown: [
      {
        bonusType: "Performance",
        amount: 300,
        month: "January",
        date: "2024-01-15",
      },
      {
        bonusType: "Team Goal",
        amount: 200,
        month: "January",
        date: "2024-01-15",
      },
    ],
    commissionBreakdown: [
      {
        date: "2024-01-03",
        unitName: "A-101",
        tenantName: "Alice Johnson",
        hasInsurance: true,
        amount: 50,
      },
      {
        date: "2024-01-05",
        unitName: "B-205",
        tenantName: "Bob Wilson",
        hasInsurance: false,
        amount: 35,
      },
      {
        date: "2024-01-08",
        unitName: "C-310",
        tenantName: "Carol Davis",
        hasInsurance: true,
        amount: 50,
      },
    ],
  };

  const mockPayrollHistory: PayrollData[] = [
    mockPayrollData,
    {
      ...mockPayrollData,
      payPeriodId: "2024-01-16",
      payPeriodStart: "2024-01-16",
      payPeriodEnd: "2024-01-31",
      monthlyBonus: 400,
      commission: 680,
      commissionCount: 12,
      totalPay: 3505,
      hasUnpaidCommission: true,
      unpaidCommissionCount: 2,
    },
    {
      ...mockPayrollData,
      payPeriodId: "2023-12-16",
      payPeriodStart: "2023-12-16",
      payPeriodEnd: "2023-12-31",
      monthlyBonus: 600,
      christmasBonus: 1000,
      commission: 820,
      commissionCount: 18,
      totalPay: 4945,
    },
  ];

  const mockLocationPayrolls: LocationPayrollData[] = [
    {
      locationId: "loc-001",
      locationName: "Downtown Storage",
      locationAbbreviation: "DT",
      payrollData: [mockPayrollData],
      totalEarnings: 3775,
      totalCommission: 750,
      totalBonuses: 500,
      isActive: true,
    },
    {
      locationId: "loc-002",
      locationName: "Westside Storage",
      locationAbbreviation: "WS",
      payrollData: [
        {
          ...mockPayrollData,
          locationName: "Westside Storage",
          locationAbbreviation: "WS",
          monthlyBonus: 300,
          commission: 450,
          totalPay: 3275,
        },
      ],
      totalEarnings: 3275,
      totalCommission: 450,
      totalBonuses: 300,
      isActive: true,
    },
    {
      locationId: "loc-003",
      locationName: "Northside Storage",
      locationAbbreviation: "NS",
      payrollData: [
        {
          ...mockPayrollData,
          locationName: "Northside Storage",
          locationAbbreviation: "NS",
          monthlyBonus: 200,
          commission: 320,
          totalPay: 3045,
        },
      ],
      totalEarnings: 3045,
      totalCommission: 320,
      totalBonuses: 200,
      isActive: false,
    },
  ];

  const handleViewPayrollDetails = (payroll: PayrollData) => {
    setSelectedPayroll(payroll);
    setShowBreakdownModal(true);
  };

  const handleExport = (format: string) => {
    toast.success(`Exporting payroll data as ${format.toUpperCase()}`);
  };

  return (
    <AppShell>
      <PageWrapper
        title="Payroll Components Demo"
        description="Interactive demonstration of payroll management components"
        badge={{ text: "Demo", variant: "secondary" }}
        actions={[
          {
            label: "Export All",
            onClick: () => handleExport("csv"),
            variant: "outline",
          },
        ]}
      >
        <div className="space-y-6">
          {/* Feature Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Personal Payroll View</h3>
              <p className="text-sm text-muted-foreground">
                Individual payroll cards with bonus and commission tracking
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Multi-Location Support</h3>
              <p className="text-sm text-muted-foreground">
                Unified views for employees working across multiple facilities
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Payroll History</h3>
              <p className="text-sm text-muted-foreground">
                Historical payroll data with filtering and export capabilities
              </p>
            </div>
          </div>

          <Tabs defaultValue="single" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="single">Single Payroll</TabsTrigger>
              <TabsTrigger value="multi">Multi-Location</TabsTrigger>
              <TabsTrigger value="history">Payroll History</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">
                  Individual Payroll Card
                </h2>
                <p className="text-sm text-muted-foreground">
                  Display individual employee payroll information with detailed
                  breakdowns
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <PayrollCard
                  payrollData={mockPayrollData}
                  onViewDetails={() =>
                    handleViewPayrollDetails(mockPayrollData)
                  }
                  onViewBreakdown={(type) => {
                    toast.info(`Viewing ${type} breakdown`);
                    setSelectedPayroll(mockPayrollData);
                    setShowBreakdownModal(true);
                  }}
                />

                <PayrollCard
                  payrollData={{
                    ...mockPayrollData,
                    employeeName: "Sarah Johnson",
                    hasUnpaidCommission: true,
                    unpaidCommissionCount: 3,
                    monthlyBonus: 750,
                    commission: 920,
                    totalPay: 4295,
                  }}
                  onViewDetails={() =>
                    handleViewPayrollDetails(mockPayrollData)
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="multi" className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">
                  Multi-Location Payroll
                </h2>
                <p className="text-sm text-muted-foreground">
                  Manage payroll for employees working across multiple locations
                </p>
              </div>

              <MultiLocationPayroll
                employeeId="emp-001"
                employeeName="John Smith"
                locationPayrolls={mockLocationPayrolls}
                payrollPeriods={mockPayrollPeriods}
                selectedPeriodId="2024-01-01"
                onPeriodChange={(periodId) => {
                  toast.info(`Switched to pay period: ${periodId}`);
                }}
                onViewLocationDetails={(locationId) => {
                  toast.info(`Viewing details for location: ${locationId}`);
                }}
                onViewPayrollDetails={handleViewPayrollDetails}
              />
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Payroll History</h2>
                <p className="text-sm text-muted-foreground">
                  Historical payroll data with filtering, search, and export
                  capabilities
                </p>
              </div>

              <PayrollHistory
                employeeId="emp-001"
                employeeName="John Smith"
                payrollHistory={mockPayrollHistory}
                payrollPeriods={mockPayrollPeriods}
                onRetry={() => {
                  toast.info("Retrying data load...");
                }}
                onExportHistory={(format) => handleExport(format)}
                onViewPayrollDetails={handleViewPayrollDetails}
              />
            </TabsContent>
          </Tabs>

          {/* Features Summary */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Payroll Features</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h3 className="font-medium">Employee Features</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Personal payroll display with bonus status</li>
                  <li>• Commission tracking with rental details</li>
                  <li>• Multi-location payroll consolidation</li>
                  <li>• Payroll history with period selection</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Management Features</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Role-based payroll access control</li>
                  <li>• Detailed breakdown modals</li>
                  <li>• Export capabilities (CSV, PDF)</li>
                  <li>• Filtering and search functionality</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Data Display</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Responsive card layouts</li>
                  <li>• Loading states and error handling</li>
                  <li>• Pagination for large datasets</li>
                  <li>• Status indicators and badges</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Integration</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Works with existing payroll data structure</li>
                  <li>• Server-side data handling</li>
                  <li>• Error boundaries and fallbacks</li>
                  <li>• Consistent with design system</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Payroll Breakdown Modal */}
        {selectedPayroll && (
          <PayrollBreakdownModal
            open={showBreakdownModal}
            onOpenChange={setShowBreakdownModal}
            payrollData={selectedPayroll}
            onExport={handleExport}
          />
        )}
      </PageWrapper>
    </AppShell>
  );
}
