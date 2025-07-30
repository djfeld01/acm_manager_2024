"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  DollarSign,
  Target,
  TrendingUp,
  Calendar,
} from "lucide-react";

// Import business components
import {
  MetricCard,
  FacilityCard,
  EmployeeCard,
  EmployeeStats,
  PayrollSummaryCard,
  DailyDepositCard,
  BankingSummary,
  DepositTrends,
  GoalCard,
  GoalsDashboard,
  PayrollAlerts,
} from "@/components/business";

export default function BusinessComponentsStandalone() {
  // Sample data
  const sampleEmployee = {
    id: "1",
    name: "John Smith",
    position: "Facility Manager",
    facility: "Main Street Storage",
    avatar: undefined,
    status: "active" as const,
    performance: {
      currentMonth: {
        rentals: 15,
        goal: 20,
        commission: 750,
      },
      lastMonth: {
        rentals: 12,
        commission: 600,
      },
    },
  };

  const sampleEmployeeStats = {
    totalEmployees: 24,
    activeEmployees: 18,
    topPerformer: {
      name: "Sarah Johnson",
      rentals: 25,
    },
    averagePerformance: 82,
  };

  const samplePayrollPeriod = {
    id: "1",
    startDate: new Date(2024, 0, 1),
    endDate: new Date(2024, 0, 15),
    payDate: new Date(2024, 0, 17),
    status: "processing" as const,
    totalAmount: 45750,
    employeeCount: 24,
  };

  const samplePayrollBreakdown = {
    regularPay: 38000,
    bonuses: 2500,
    commissions: 3250,
    deductions: 2000,
  };

  const sampleDeposit = {
    id: "1",
    date: new Date(),
    facilityId: "fac1",
    facilityName: "Main Street Storage",
    totalAmount: 2840,
    breakdown: {
      cash: 650,
      checks: 890,
      creditCards: 1120,
      ach: 180,
      online: 0,
    },
    depositedBy: "Sarah Johnson",
    status: "pending" as const,
    bankAccount: "Business Checking ****1234",
  };

  const sampleBankAccounts = [
    {
      id: "1",
      name: "Business Checking",
      accountNumber: "123456789",
      type: "checking" as const,
      balance: 125340,
      availableBalance: 120000,
      pendingDeposits: 5340,
      lastUpdated: new Date(),
    },
    {
      id: "2",
      name: "Business Savings",
      accountNumber: "987654321",
      type: "savings" as const,
      balance: 75000,
      availableBalance: 75000,
      pendingDeposits: 0,
      lastUpdated: new Date(),
    },
  ];

  const sampleGoal = {
    id: "1",
    title: "Q1 Revenue Target",
    description: "Increase facility revenue by 15% compared to Q4",
    type: "revenue" as const,
    period: "quarterly" as const,
    startDate: new Date(2024, 0, 1),
    endDate: new Date(2024, 2, 31),
    targetValue: 150000,
    currentValue: 125000,
    unit: "currency" as const,
    facilityName: "Main Street Storage",
    status: "active" as const,
    createdBy: "Manager",
    lastUpdated: new Date(),
  };

  const sampleGoals = [sampleGoal];

  const samplePayrollAlerts = [
    {
      id: "1",
      type: "warning" as const,
      title: "Missing Timesheet",
      description: "John Smith hasn't submitted timesheet for this week",
      employeeName: "John Smith",
    },
    {
      id: "2",
      type: "error" as const,
      title: "Overtime Approval Required",
      description: "Sarah Johnson has 12 hours of overtime pending approval",
      employeeName: "Sarah Johnson",
    },
  ];

  return (
    <html lang="en">
      <head>
        <title>Business Components Demo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="min-h-screen bg-background">
          <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">
                Business Components Demo
              </h1>
              <p className="text-muted-foreground">
                Comprehensive collection of ACM Manager business components for
                self-storage management
              </p>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <strong>Note:</strong> This is a standalone demo to avoid
                database connection issues. All components use sample data to
                showcase functionality.
              </div>
            </div>

            <div className="space-y-8">
              {/* Metrics Section */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  Metrics & Performance
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <MetricCard
                    title="Monthly Revenue"
                    value="$45,230"
                    change={{
                      value: 12.5,
                      period: "vs last month",
                      isPositive: true,
                    }}
                    icon={DollarSign}
                    variant="revenue"
                  />
                  <MetricCard
                    title="Occupancy Rate"
                    value="87.2%"
                    change={{
                      value: 3.2,
                      period: "vs last month",
                      isPositive: true,
                    }}
                    icon={Building2}
                    variant="occupancy"
                    badge={{ text: "Above Target", variant: "success" }}
                  />
                  <MetricCard
                    title="New Rentals"
                    value={23}
                    change={{
                      value: -2,
                      period: "vs last month",
                      isPositive: false,
                    }}
                    icon={Users}
                    variant="performance"
                  />
                  <MetricCard
                    title="Collections"
                    value="94.8%"
                    change={{
                      value: 1.2,
                      period: "vs last month",
                      isPositive: true,
                    }}
                    icon={TrendingUp}
                    variant="performance"
                    badge={{ text: "Excellent", variant: "success" }}
                  />
                </div>

                <FacilityCard
                  facilityName="Main Street Storage"
                  facilityCode="MSS-001"
                  metrics={{
                    revenue: 45230,
                    occupancy: 87.2,
                    newRentals: 23,
                    issues: 2,
                  }}
                  status="good"
                />
              </section>

              {/* Employee Management Section */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  Employee Management
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <EmployeeCard employee={sampleEmployee} />
                  <EmployeeStats
                    totalEmployees={sampleEmployeeStats.totalEmployees}
                    activeEmployees={sampleEmployeeStats.activeEmployees}
                    topPerformer={sampleEmployeeStats.topPerformer}
                    averagePerformance={sampleEmployeeStats.averagePerformance}
                  />
                </div>
              </section>

              {/* Payroll Section */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="h-6 w-6" />
                  Payroll & Compensation
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PayrollSummaryCard
                    period={samplePayrollPeriod}
                    breakdown={samplePayrollBreakdown}
                  />
                  <PayrollAlerts alerts={samplePayrollAlerts} />
                </div>
              </section>

              {/* Banking & Deposits Section */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="h-6 w-6" />
                  Banking & Deposits
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <DailyDepositCard deposit={sampleDeposit} />
                  <BankingSummary
                    accounts={sampleBankAccounts}
                    totalBalance={200340}
                    totalPendingDeposits={5340}
                  />
                </div>
                <DepositTrends
                  trends={[
                    {
                      date: new Date(2024, 0, 1),
                      amount: 2500,
                      facilityCount: 3,
                    },
                    {
                      date: new Date(2024, 0, 2),
                      amount: 2800,
                      facilityCount: 3,
                    },
                    {
                      date: new Date(2024, 0, 3),
                      amount: 2200,
                      facilityCount: 2,
                    },
                    {
                      date: new Date(2024, 0, 4),
                      amount: 3100,
                      facilityCount: 4,
                    },
                    {
                      date: new Date(2024, 0, 5),
                      amount: 2840,
                      facilityCount: 3,
                    },
                  ]}
                  period="week"
                />
              </section>

              {/* Goals & Tracking Section */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-6 w-6" />
                  Goals & Tracking
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GoalCard goal={sampleGoal} />
                  <GoalsDashboard goals={sampleGoals} period="quarterly" />
                </div>
              </section>

              {/* Component Library Info */}
              <section>
                <Card>
                  <CardHeader>
                    <CardTitle>Component Library Features</CardTitle>
                    <CardDescription>
                      Comprehensive business components for ACM Manager
                      self-storage management
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2">
                          Metrics & Performance
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Revenue and financial metrics display</li>
                          <li>• Occupancy and facility performance tracking</li>
                          <li>• Trend indicators and comparative analysis</li>
                          <li>• Customizable metric cards with variants</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">
                          Employee Management
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Employee cards with performance metrics</li>
                          <li>• Staff statistics and analytics</li>
                          <li>• Role-based information display</li>
                          <li>• Performance tracking and trends</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">
                          Payroll & Banking
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Payroll processing and summaries</li>
                          <li>• Daily deposit tracking and management</li>
                          <li>• Banking integration and reconciliation</li>
                          <li>• Payment method breakdown and analysis</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Goals & Tracking</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Goal setting and progress tracking</li>
                          <li>• Performance dashboards and analytics</li>
                          <li>• Multi-period goal management</li>
                          <li>• Visual progress indicators</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Database Connection Issue Notice */}
              <section>
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="text-yellow-800">
                      Database Connection Issue Detected
                    </CardTitle>
                    <CardDescription className="text-yellow-700">
                      The main application is experiencing Supabase connection
                      timeouts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-yellow-800 text-sm">
                    <p className="mb-2">
                      <strong>Error:</strong> CONNECT_TIMEOUT
                      aws-0-us-east-1.pooler.supabase.com:5432
                    </p>
                    <p className="mb-4">
                      This standalone demo bypasses the auth system to showcase
                      the business components.
                    </p>

                    <h4 className="font-semibold mb-2">
                      Recommended Solutions:
                    </h4>
                    <ul className="space-y-1">
                      <li>
                        1. <strong>Check Supabase Dashboard:</strong> Verify if
                        your instance is paused (free tier limitation)
                      </li>
                      <li>
                        2. <strong>Wake up the instance:</strong> Visit your
                        Supabase project dashboard to activate it
                      </li>
                      <li>
                        3. <strong>Update connection string:</strong> Ensure
                        DATABASE_URL in .env.local is current
                      </li>
                      <li>
                        4. <strong>Check connection limits:</strong> Free tier
                        has limited concurrent connections
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </section>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
