import { Role } from "@/db/schema/user";
import { RolePermissions, Permission } from "@/lib/types/permissions";

// Define permissions for each role
export const ROLE_PERMISSIONS: RolePermissions = {
  [Role.USER]: [
    { resource: "profile", action: "read", scope: "own" },
    { resource: "profile", action: "write", scope: "own" },
  ],

  [Role.MANAGER]: [
    // Own permissions
    { resource: "profile", action: "read", scope: "own" },
    { resource: "profile", action: "write", scope: "own" },
    { resource: "payroll", action: "read", scope: "own" },

    // Facility permissions
    { resource: "location", action: "read", scope: "facility" },
    { resource: "location", action: "write", scope: "facility" },
    { resource: "dashboard", action: "read", scope: "facility" },
  ],

  [Role.ASSISTANT]: [
    // Same as manager but potentially more limited
    { resource: "profile", action: "read", scope: "own" },
    { resource: "profile", action: "write", scope: "own" },
    { resource: "payroll", action: "read", scope: "own" },
    { resource: "location", action: "read", scope: "facility" },
    { resource: "dashboard", action: "read", scope: "facility" },
  ],

  [Role.SUPERVISOR]: [
    // Own permissions
    { resource: "profile", action: "read", scope: "own" },
    { resource: "profile", action: "write", scope: "own" },
    { resource: "payroll", action: "read", scope: "own" },

    // Team permissions
    { resource: "payroll", action: "read", scope: "team" },
    { resource: "location", action: "read", scope: "team" },
    { resource: "dashboard", action: "read", scope: "team" },
    { resource: "reports", action: "read", scope: "team" },
  ],

  [Role.ADMIN]: [
    // Full access to most resources
    { resource: "profile", action: "read", scope: "all" },
    { resource: "profile", action: "write", scope: "all" },
    { resource: "payroll", action: "read", scope: "all" },
    { resource: "payroll", action: "write", scope: "all" },
    { resource: "location", action: "read", scope: "all" },
    { resource: "location", action: "write", scope: "all" },
    { resource: "dashboard", action: "read", scope: "all" },
    { resource: "reports", action: "read", scope: "all" },
    { resource: "admin", action: "read", scope: "all" },
    { resource: "admin", action: "write", scope: "all" },
    { resource: "employees", action: "read", scope: "all" },
  ],

  [Role.OWNER]: [
    // Full access to everything
    { resource: "profile", action: "read", scope: "all" },
    { resource: "profile", action: "write", scope: "all" },
    { resource: "payroll", action: "read", scope: "all" },
    { resource: "payroll", action: "write", scope: "all" },
    { resource: "payroll", action: "delete", scope: "all" },
    { resource: "location", action: "read", scope: "all" },
    { resource: "location", action: "write", scope: "all" },
    { resource: "location", action: "delete", scope: "all" },
    { resource: "dashboard", action: "read", scope: "all" },
    { resource: "reports", action: "read", scope: "all" },
    { resource: "admin", action: "read", scope: "all" },
    { resource: "admin", action: "write", scope: "all" },
    { resource: "admin", action: "admin", scope: "all" },
    { resource: "employees", action: "read", scope: "all" },
    { resource: "employees", action: "write", scope: "all" },
  ],
};

// Route-based permissions
export const ROUTE_PERMISSIONS: Record<
  string,
  { roles: Role[]; permissions?: Permission[] }
> = {
  "/dashboard": {
    roles: [
      Role.MANAGER,
      Role.ASSISTANT,
      Role.SUPERVISOR,
      Role.ADMIN,
      Role.OWNER,
    ],
  },
  "/payroll": {
    roles: [
      Role.MANAGER,
      Role.ASSISTANT,
      Role.SUPERVISOR,
      Role.ADMIN,
      Role.OWNER,
    ],
    permissions: [{ resource: "payroll", action: "read", scope: "own" }],
  },
  "/locations": {
    roles: [
      Role.MANAGER,
      Role.ASSISTANT,
      Role.SUPERVISOR,
      Role.ADMIN,
      Role.OWNER,
    ],
    permissions: [{ resource: "location", action: "read", scope: "facility" }],
  },
  "/reports": {
    roles: [Role.SUPERVISOR, Role.ADMIN, Role.OWNER],
    permissions: [{ resource: "reports", action: "read", scope: "team" }],
  },
  "/admin": {
    roles: [Role.ADMIN, Role.OWNER],
    permissions: [{ resource: "admin", action: "read", scope: "all" }],
  },
  "/employees": {
    roles: [Role.ADMIN, Role.OWNER],
    permissions: [{ resource: "admin", action: "read", scope: "all" }],
  },
};
