import { auth } from "@/auth";
import { getFacilityConnections } from "@/lib/controllers/facilityController";
import { getNavigationForUser } from "@/lib/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Building2, CheckCircle2 } from "lucide-react";

export default async function NavigationDemoPage() {
  const session = await auth();
  const locations = await getFacilityConnections(
    session?.user?.userDetailId || ""
  );

  const userRole = session?.user?.role || "USER";
  const hasLocations = locations.length > 0;
  const navigationSections = getNavigationForUser(userRole, hasLocations);

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Role-Based Navigation Demo
        </h1>
        <p className="text-muted-foreground mt-2">
          Demonstrating the role-based access control and navigation system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Name
              </div>
              <div>{session?.user?.name || "Not signed in"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Role
              </div>
              <Badge variant={userRole === "ADMIN" ? "default" : "secondary"}>
                {userRole}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Email
              </div>
              <div className="text-sm">{session?.user?.email || "N/A"}</div>
            </div>
          </CardContent>
        </Card>

        {/* Facility Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Facility Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Connected Facilities
              </div>
              <div className="text-2xl font-bold">{locations.length}</div>
            </div>
            {locations.length > 0 && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Facilities
                </div>
                <div className="space-y-1">
                  {locations.slice(0, 5).map((location) => (
                    <div key={location.sitelinkId} className="text-sm">
                      {location.facilityAbbreviation} - {location.facilityName}
                    </div>
                  ))}
                  {locations.length > 5 && (
                    <div className="text-sm text-muted-foreground">
                      +{locations.length - 5} more...
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Dashboard Access
              </div>
              {userRole !== "USER" && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Facility Management
                </div>
              )}
              {["MANAGER", "SUPERVISOR", "ADMIN"].includes(userRole) && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Employee Management
                </div>
              )}
              {["SUPERVISOR", "ADMIN"].includes(userRole) && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Multi-location Reports
                </div>
              )}
              {userRole === "ADMIN" && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  System Administration
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Sections */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">
          Available Navigation Sections
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {navigationSections.map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle>{section.label}</CardTitle>
                <CardDescription>
                  {section.items.length} item
                  {section.items.length !== 1 ? "s" : ""} available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded-lg border"
                    >
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        )}
                      </div>
                      {item.requiresLocations && (
                        <Badge variant="outline" className="text-xs">
                          Requires Facilities
                        </Badge>
                      )}
                      {item.badge && (
                        <Badge variant="secondary">{item.badge}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Role Comparison */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Role Comparison</h2>
        <Card>
          <CardHeader>
            <CardTitle>Navigation Items by Role</CardTitle>
            <CardDescription>
              Comparison of what navigation items are available for different
              user roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Feature</th>
                    <th className="text-center p-2">USER</th>
                    <th className="text-center p-2">ASSISTANT</th>
                    <th className="text-center p-2">MANAGER</th>
                    <th className="text-center p-2">SUPERVISOR</th>
                    <th className="text-center p-2">ADMIN</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: "Dashboard",
                      roles: [
                        "USER",
                        "ASSISTANT",
                        "MANAGER",
                        "SUPERVISOR",
                        "ADMIN",
                      ],
                    },
                    {
                      name: "Deposits",
                      roles: ["ASSISTANT", "MANAGER", "SUPERVISOR", "ADMIN"],
                    },
                    {
                      name: "Payroll",
                      roles: ["ASSISTANT", "MANAGER", "SUPERVISOR", "ADMIN"],
                    },
                    {
                      name: "Employees",
                      roles: ["MANAGER", "SUPERVISOR", "ADMIN"],
                    },
                    {
                      name: "Activity",
                      roles: ["MANAGER", "SUPERVISOR", "ADMIN"],
                    },
                    {
                      name: "Goals",
                      roles: ["MANAGER", "SUPERVISOR", "ADMIN"],
                    },
                    { name: "Reports", roles: ["SUPERVISOR", "ADMIN"] },
                    { name: "Locations", roles: ["SUPERVISOR", "ADMIN"] },
                    { name: "User Management", roles: ["ADMIN"] },
                    { name: "Settings", roles: ["ADMIN"] },
                  ].map((feature) => (
                    <tr key={feature.name} className="border-b">
                      <td className="p-2 font-medium">{feature.name}</td>
                      {[
                        "USER",
                        "ASSISTANT",
                        "MANAGER",
                        "SUPERVISOR",
                        "ADMIN",
                      ].map((role) => (
                        <td key={role} className="text-center p-2">
                          {feature.roles.includes(role) ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <div className="h-4 w-4 mx-auto"></div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
