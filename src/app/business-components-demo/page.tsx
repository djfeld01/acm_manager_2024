"use client";

import React from "react";
import { Building2, Users, DollarSign, TrendingUp } from "lucide-react";

// Import business components
import {
  MetricCard,
  FacilityCard,
  PayrollSummaryCard,
  PayrollAlerts,
} from "@/components/business";

// Import types directly from component files
import type {
  FacilityOccupancy,
  FacilityActivity,
  FacilityReceivables,
} from "@/components/business/MetricCards";

import type {
  PayrollPeriod,
  CommittedPayrollByEmployee,
} from "@/components/business/PayrollComponents";

export default function BusinessComponentsDemo() {
  // Sample Data
  const sampleFacilityOccupancy: FacilityOccupancy = {
    facilityId: "001",
    facilityName: "Main Street Storage",
    abbreviation: "MST",
    totalUnits: 350,
    occupiedUnits: 312,
    availableUnits: 38,
    occupancyRate: 0.891,
    rentalGoal: 25,
    currentRentals: 18,
    lastUpdated: "2024-01-31T10:30:00Z",
  };

  const sampleFacilityActivity: FacilityActivity = {
    facilityId: "001",
    date: "2024-01-31",
    moveIns: 8,
    moveOuts: 5,
    netChange: 3,
    inquiries: 24,
    tours: 12,
    conversionRate: 0.33,
  };

  const sampleFacilityReceivables: FacilityReceivables = {
    facilityId: "001",
    currentReceivables: 15420,
    pastDue30: 2340,
    pastDue60: 1200,
    pastDue90Plus: 850,
    totalPastDue: 4390,
    collectionRate: 0.94,
  };

  const samplePayrollPeriod: PayrollPeriod = {
    payPeriodId: "pp_2024_02",
    startDate: "2024-01-15",
    endDate: "2024-01-28",
    paycheckDate: "2024-02-02",
    processingDate: "2024-01-30",
    status: "Current",
  };

  const samplePayrollEmployees: CommittedPayrollByEmployee[] = [
    {
      employeeId: "emp_001",
      firstName: "Sarah",
      lastName: "Johnson",
      fullName: "Sarah Johnson",
      locationAbbreviation: "MST",
      locationName: "Main Street Storage",
      locationPaycorNumber: 101,
      vacationHours: 8,
      holidayHours: 0,
      christmasBonus: 0,
      monthlyBonus: 250,
      commission: 1200,
      mileageDollars: 45.6,
      unpaidCommissionCount: 0,
      currentPayrollId: "pp_2024_02",
      facilityId: "001",
    },
  ];

  const samplePayrollBreakdown = {
    totalHours: 520,
    totalCommissions: 1200,
    totalBonuses: 250,
    totalMileage: 45.6,
    totalVacationHours: 8,
    totalHolidayHours: 0,
  };

  const samplePayrollAlerts = [
    {
      id: "alert_001",
      type: "info" as const,
      message: "Payroll processing deadline is February 1st",
      action: "Complete payroll processing",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">ACM Business Component Library</h1>
          <p className="text-muted-foreground text-lg">
            Updated components matching real ACM database schemas
          </p>
        </div>

        <div className="space-y-12">
          {/* Metrics Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Metrics & Performance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <MetricCard
                title="Total Revenue"
                value="$245,830"
                description="Monthly revenue across all facilities"
                trend={{
                  value: 12.5,
                  label: "vs last month",
                  direction: "up",
                }}
                icon={<DollarSign className="h-4 w-4" />}
              />
              <MetricCard
                title="Avg Occupancy"
                value="88.3%"
                description="Average occupancy rate"
                icon={<Building2 className="h-4 w-4" />}
              />
            </div>

            <FacilityCard
              occupancy={sampleFacilityOccupancy}
              activity={sampleFacilityActivity}
              receivables={sampleFacilityReceivables}
            />
          </section>

          {/* Payroll Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-6 w-6" />
              Payroll Management
            </h2>
            <div className="space-y-6">
              <PayrollSummaryCard
                period={samplePayrollPeriod}
                employees={samplePayrollEmployees}
                breakdown={samplePayrollBreakdown}
              />
              <PayrollAlerts alerts={samplePayrollAlerts} />
            </div>
          </section>
        </div>

        <div className="text-center text-muted-foreground pt-8 border-t">
          <p>ACM Manager 2024 - Business Component Library Demo</p>
          <p>✅ Components updated with real database schemas</p>
        </div>
      </div>
    </div>
  );
}
