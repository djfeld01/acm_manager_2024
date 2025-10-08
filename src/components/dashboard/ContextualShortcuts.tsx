"use client";

import { Role } from "@/db/schema/user";
import { QuickAction, QuickActionsBar } from "./QuickActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Calendar,
  FileText,
  DollarSign,
  Users,
  Settings,
  AlertCircle,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Printer,
  Download,
  Upload,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  Share,
  Bell,
  Star,
  Bookmark,
  CheckCircle,
} from "lucide-react";

interface ContextualShortcutsProps {
  userRole: Role;
  context?: {
    locationId?: string;
    locationName?: string;
    currentPage?: string;
    hasAlerts?: boolean;
    hasOverduePayments?: boolean;
    hasNewInquiries?: boolean;
    isPayrollPeriod?: boolean;
  };
  className?: string;
}

export function ContextualShortcuts({
  userRole,
  context = {},
  className,
}: ContextualShortcutsProps) {
  const {
    locationId,
    locationName,
    currentPage,
    hasAlerts,
    hasOverduePayments,
    hasNewInquiries,
    isPayrollPeriod,
  } = context;

  // Generate contextual shortcuts based on role and current context
  const getContextualShortcuts = (): QuickAction[] => {
    const shortcuts: QuickAction[] = [];

    // Common shortcuts for all roles
    shortcuts.push({
      id: "search",
      label: "Search",
      description: "Search customers, units, or documents",
      onClick: () => {
        // Focus search input or open search modal
        const searchInput = document.querySelector(
          'input[type="search"]'
        ) as HTMLInputElement;
        if (searchInput) searchInput.focus();
      },
      icon: Search,
      roles: [
        Role.USER,
        Role.MANAGER,
        Role.ASSISTANT,
        Role.SUPERVISOR,
        Role.ADMIN,
        Role.OWNER,
      ],
    });

    // Alert-based shortcuts
    if (hasAlerts) {
      shortcuts.push({
        id: "view-alerts",
        label: "View Alerts",
        description: "Check system alerts and notifications",
        href: "/alerts",
        icon: AlertCircle,
        roles: [
          Role.MANAGER,
          Role.ASSISTANT,
          Role.SUPERVISOR,
          Role.ADMIN,
          Role.OWNER,
        ],
        badge: { text: "!", variant: "destructive" },
      });
    }

    // Overdue payments shortcut
    if (hasOverduePayments) {
      shortcuts.push({
        id: "overdue-payments",
        label: "Overdue Payments",
        description: "Follow up on overdue accounts",
        href: locationId
          ? `/location/${locationId}/payments/overdue`
          : "/payments/overdue",
        icon: DollarSign,
        roles: [
          Role.MANAGER,
          Role.ASSISTANT,
          Role.SUPERVISOR,
          Role.ADMIN,
          Role.OWNER,
        ],
        badge: { text: "Urgent", variant: "destructive" },
      });
    }

    // New inquiries shortcut
    if (hasNewInquiries) {
      shortcuts.push({
        id: "new-inquiries",
        label: "New Inquiries",
        description: "Respond to customer inquiries",
        href: locationId ? `/location/${locationId}/inquiries` : "/inquiries",
        icon: Mail,
        roles: [
          Role.MANAGER,
          Role.ASSISTANT,
          Role.SUPERVISOR,
          Role.ADMIN,
          Role.OWNER,
        ],
        badge: { text: "New", variant: "default" },
      });
    }

    // Payroll period shortcuts
    if (isPayrollPeriod) {
      shortcuts.push({
        id: "process-payroll",
        label: "Process Payroll",
        description: "Complete payroll processing",
        href: "/payroll/process",
        icon: DollarSign,
        roles: [Role.SUPERVISOR, Role.ADMIN, Role.OWNER],
        badge: { text: "Due", variant: "secondary" },
      });
    }

    // Role-specific shortcuts
    switch (userRole) {
      case Role.MANAGER:
      case Role.ASSISTANT:
        shortcuts.push(
          {
            id: "daily-checklist",
            label: "Daily Checklist",
            description: "Complete daily operational tasks",
            href: locationId
              ? `/location/${locationId}/checklist`
              : "/checklist",
            icon: CheckCircle,
            roles: [
              Role.MANAGER,
              Role.ASSISTANT,
              Role.SUPERVISOR,
              Role.ADMIN,
              Role.OWNER,
            ],
          },
          {
            id: "quick-rental",
            label: "Quick Rental",
            description: "Start new rental process",
            href: locationId
              ? `/location/${locationId}/rentals/new`
              : "/rentals/new",
            icon: Plus,
            roles: [
              Role.MANAGER,
              Role.ASSISTANT,
              Role.SUPERVISOR,
              Role.ADMIN,
              Role.OWNER,
            ],
          },
          {
            id: "print-reports",
            label: "Print Reports",
            description: "Print daily or weekly reports",
            onClick: () => window.print(),
            icon: Printer,
            roles: [
              Role.MANAGER,
              Role.ASSISTANT,
              Role.SUPERVISOR,
              Role.ADMIN,
              Role.OWNER,
            ],
          }
        );
        break;

      case Role.SUPERVISOR:
        shortcuts.push(
          {
            id: "team-schedule",
            label: "Team Schedule",
            description: "Manage team schedules",
            href: "/schedule/team",
            icon: Calendar,
            roles: [Role.SUPERVISOR, Role.ADMIN, Role.OWNER],
          },
          {
            id: "performance-review",
            label: "Performance Review",
            description: "Review location performance",
            href: "/reports/performance",
            icon: TrendingUp,
            roles: [Role.SUPERVISOR, Role.ADMIN, Role.OWNER],
          },
          {
            id: "bulk-actions",
            label: "Bulk Actions",
            description: "Perform actions across locations",
            href: "/tools/bulk-actions",
            icon: RefreshCw,
            roles: [Role.SUPERVISOR, Role.ADMIN, Role.OWNER],
          }
        );
        break;

      case Role.ADMIN:
      case Role.OWNER:
        shortcuts.push(
          {
            id: "system-health",
            label: "System Health",
            description: "Monitor system status",
            href: "/admin/system-health",
            icon: TrendingUp,
            roles: [Role.ADMIN, Role.OWNER],
          },
          {
            id: "user-management",
            label: "User Management",
            description: "Manage users and permissions",
            href: "/admin/users",
            icon: Users,
            roles: [Role.ADMIN, Role.OWNER],
          },
          {
            id: "backup-data",
            label: "Backup Data",
            description: "Create system backup",
            href: "/admin/backup",
            icon: Download,
            roles: [Role.ADMIN, Role.OWNER],
          }
        );
        break;
    }

    // Page-specific shortcuts
    if (currentPage) {
      switch (currentPage) {
        case "dashboard":
          shortcuts.push({
            id: "refresh-dashboard",
            label: "Refresh",
            description: "Refresh dashboard data",
            onClick: () => window.location.reload(),
            icon: RefreshCw,
            roles: [
              Role.USER,
              Role.MANAGER,
              Role.ASSISTANT,
              Role.SUPERVISOR,
              Role.ADMIN,
              Role.OWNER,
            ],
          });
          break;

        case "reports":
          shortcuts.push(
            {
              id: "export-report",
              label: "Export",
              description: "Export current report",
              onClick: () => {
                // Trigger export functionality
                console.log("Exporting report...");
              },
              icon: Download,
              roles: [
                Role.MANAGER,
                Role.ASSISTANT,
                Role.SUPERVISOR,
                Role.ADMIN,
                Role.OWNER,
              ],
            },
            {
              id: "schedule-report",
              label: "Schedule",
              description: "Schedule automatic reports",
              href: "/reports/schedule",
              icon: Calendar,
              roles: [Role.SUPERVISOR, Role.ADMIN, Role.OWNER],
            }
          );
          break;

        case "payroll":
          shortcuts.push(
            {
              id: "payroll-history",
              label: "History",
              description: "View payroll history",
              href: "/payroll/history",
              icon: Clock,
              roles: [
                Role.MANAGER,
                Role.ASSISTANT,
                Role.SUPERVISOR,
                Role.ADMIN,
                Role.OWNER,
              ],
            },
            {
              id: "payroll-export",
              label: "Export Payroll",
              description: "Export payroll data",
              onClick: () => {
                console.log("Exporting payroll...");
              },
              icon: Download,
              roles: [Role.SUPERVISOR, Role.ADMIN, Role.OWNER],
            }
          );
          break;
      }
    }

    // Location-specific shortcuts
    if (locationId && locationName) {
      shortcuts.push(
        {
          id: "location-details",
          label: `${locationName} Details`,
          description: "View detailed location information",
          href: `/location/${locationId}`,
          icon: MapPin,
          roles: [
            Role.MANAGER,
            Role.ASSISTANT,
            Role.SUPERVISOR,
            Role.ADMIN,
            Role.OWNER,
          ],
        },
        {
          id: "location-contacts",
          label: "Emergency Contacts",
          description: "View location emergency contacts",
          href: `/location/${locationId}/contacts`,
          icon: Phone,
          roles: [
            Role.MANAGER,
            Role.ASSISTANT,
            Role.SUPERVISOR,
            Role.ADMIN,
            Role.OWNER,
          ],
        }
      );
    }

    return shortcuts;
  };

  const contextualShortcuts = getContextualShortcuts();

  if (contextualShortcuts.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <Badge variant="outline">
            {contextualShortcuts.length} available
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <QuickActionsBar
          actions={contextualShortcuts}
          userRole={userRole}
          maxActions={8}
        />
      </CardContent>
    </Card>
  );
}

// Helper function to determine context based on current state
export function getPageContext(
  pathname: string,
  searchParams?: URLSearchParams
): {
  currentPage?: string;
  hasAlerts?: boolean;
  hasOverduePayments?: boolean;
  hasNewInquiries?: boolean;
  isPayrollPeriod?: boolean;
} {
  const context: ReturnType<typeof getPageContext> = {};

  // Determine current page
  if (pathname.includes("/dashboard")) context.currentPage = "dashboard";
  else if (pathname.includes("/reports")) context.currentPage = "reports";
  else if (pathname.includes("/payroll")) context.currentPage = "payroll";
  else if (pathname.includes("/locations")) context.currentPage = "locations";

  // Mock context data - in real app, this would come from API/state
  context.hasAlerts = Math.random() > 0.7; // 30% chance of alerts
  context.hasOverduePayments = Math.random() > 0.8; // 20% chance of overdue payments
  context.hasNewInquiries = Math.random() > 0.6; // 40% chance of new inquiries

  // Check if it's payroll period (e.g., last 3 days of month)
  const today = new Date();
  const lastDayOfMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate();
  context.isPayrollPeriod = today.getDate() >= lastDayOfMonth - 2;

  return context;
}
