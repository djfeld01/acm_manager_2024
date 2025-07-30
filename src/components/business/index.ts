// Business Component Library for ACM Manager
// Comprehensive collection of components for self-storage management

// Metric and Performance Components
export {
  MetricCard,
  FacilityCard,
  type MetricCardProps,
  type FacilityMetricProps,
  type FacilityOccupancy,
  type FacilityActivity,
  type FacilityReceivables,
} from "./MetricCards";

// Employee Management Components
export {
  EmployeeCard,
  EmployeeStats,
  type EmployeeCardProps,
  type EmployeeStatsProps,
} from "./EmployeeComponents";

// Payroll and Compensation Components
export {
  PayrollSummaryCard,
  EmployeePayrollItem,
  PayrollAlerts,
  type PayrollPeriod,
  type CommittedPayrollByEmployee,
  type MonthlyBonusBreakdown,
  type Rentals,
  type PayrollSummaryProps,
  type EmployeePayrollItemProps,
  type PayrollAlert,
  type PayrollAlertsProps,
} from "./PayrollComponents";

// Banking and Deposit Components
export {
  DailyDepositCard,
  BankingSummary,
  DepositTrends,
  type DailyDeposit,
  type DailyDepositCardProps,
  type BankAccount,
  type BankingSummaryProps,
  type DepositTrend,
  type DepositTrendsProps,
} from "./DepositComponents";

// Goal Tracking and Performance Components
export {
  GoalCard,
  GoalsDashboard,
  GoalPerformance,
  type Goal,
  type GoalCardProps,
  type GoalsDashboardProps,
  type GoalPerformanceProps,
} from "./GoalComponents";

// Component Categories for Documentation
export const BUSINESS_COMPONENT_CATEGORIES = {
  metrics: {
    name: "Metrics & Performance",
    description:
      "Components for displaying facility performance, revenue, occupancy, and KPIs",
    components: ["MetricCard", "FacilityCard"],
  },
  employees: {
    name: "Employee Management",
    description:
      "Components for staff information, performance tracking, and management",
    components: ["EmployeeCard", "EmployeeStats"],
  },
  payroll: {
    name: "Payroll & Compensation",
    description:
      "Components for payroll processing, employee compensation, and alerts",
    components: ["PayrollSummaryCard", "EmployeePayrollItem", "PayrollAlerts"],
  },
  banking: {
    name: "Banking & Deposits",
    description:
      "Components for daily deposits, banking summaries, and financial trends",
    components: ["DailyDepositCard", "BankingSummary", "DepositTrends"],
  },
  goals: {
    name: "Goals & Tracking",
    description:
      "Components for goal setting, progress tracking, and performance monitoring",
    components: ["GoalCard", "GoalsDashboard", "GoalPerformance"],
  },
} as const;

// Usage Examples and Best Practices
export const COMPONENT_USAGE_EXAMPLES = {
  facilityDashboard: [
    "MetricCard",
    "FacilityCard",
    "EmployeeStats",
    "DepositTrends",
  ],
  employeeManagement: ["EmployeeCard", "EmployeeStats", "EmployeePayrollItem"],
  payrollProcessing: [
    "PayrollSummaryCard",
    "EmployeePayrollItem",
    "PayrollAlerts",
  ],
  bankingDashboard: ["DailyDepositCard", "BankingSummary", "DepositTrends"],
  goalsTracking: ["GoalCard", "GoalsDashboard", "GoalPerformance"],
} as const;

// Design System Integration
export const BUSINESS_DESIGN_TOKENS = {
  colors: {
    revenue: "hsl(var(--revenue))",
    expense: "hsl(var(--expense))",
    performance: "hsl(var(--performance))",
    occupancy: "hsl(var(--occupancy))",
    success: "hsl(var(--success))",
    warning: "hsl(var(--warning))",
    info: "hsl(var(--info))",
  },
  spacing: {
    cardPadding: "1rem",
    sectionGap: "1.5rem",
    componentGap: "0.75rem",
  },
  typography: {
    metricValue: "text-2xl font-bold",
    cardTitle: "text-lg font-semibold",
    label: "text-sm font-medium",
    description: "text-sm text-muted-foreground",
  },
} as const;
