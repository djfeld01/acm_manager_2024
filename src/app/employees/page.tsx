import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAllUserFacilityConnections } from "@/lib/controllers/userController/getUserFacilities";
import {
  EmployeeDataTable,
  ConnectionsDataTable,
} from "@/components/employees/EmployeeDataTable";
import { PageAuthWrapper } from "@/lib/auth/PageAuthWrapper";
import { Role } from "@/db/schema/user";
import { Users, Building2, MapPin, UserCheck } from "lucide-react";

// Type for the user facility connection data (matching database schema)
type RawUserFacilityConnection = {
  sitelinkId: string;
  facilityName: string;
  facilityAbbreviation: string;
  position:
    | "ACM_OFFICE"
    | "AREA_MANAGER"
    | "MANAGER"
    | "ASSISTANT"
    | "STORE_OWNER"
    | "TERMINATED"
    | null;
  fullName: string | null;
};

// Type for processed connection data
type UserFacilityConnection = {
  sitelinkId: string;
  facilityName: string;
  facilityAbbreviation: string;
  position: string;
  fullName: string;
};

// Group connections by user
function groupConnectionsByUser(connections: UserFacilityConnection[]) {
  const grouped = connections.reduce(
    (acc, connection) => {
      if (!acc[connection.fullName]) {
        acc[connection.fullName] = {
          userName: connection.fullName,
          facilities: [],
          positions: new Set<string>(),
        };
      }

      acc[connection.fullName].facilities.push({
        sitelinkId: connection.sitelinkId,
        facilityName: connection.facilityName,
        facilityAbbreviation: connection.facilityAbbreviation,
        position: connection.position,
      });

      acc[connection.fullName].positions.add(connection.position);

      return acc;
    },
    {} as Record<
      string,
      {
        userName: string;
        facilities: Array<{
          sitelinkId: string;
          facilityName: string;
          facilityAbbreviation: string;
          position: string;
        }>;
        positions: Set<string>;
      }
    >
  );

  return Object.values(grouped).map((user) => ({
    ...user,
    positions: Array.from(user.positions),
    facilityCount: user.facilities.length,
  }));
}

async function EmployeesPageContent() {
  const rawConnections = await getAllUserFacilityConnections();

  // Filter out null values and create clean connections
  const connections: UserFacilityConnection[] = rawConnections
    .filter((conn) => conn.position !== null && conn.fullName !== null)
    .map((conn) => ({
      sitelinkId: conn.sitelinkId,
      facilityName: conn.facilityName,
      facilityAbbreviation: conn.facilityAbbreviation,
      position: conn.position as string,
      fullName: conn.fullName as string,
    }));

  const groupedUsers = groupConnectionsByUser(connections);

  // Calculate summary statistics
  const totalUsers = groupedUsers.length;
  const totalFacilities = new Set(connections.map((c) => c.sitelinkId)).size;
  const positionCounts = connections.reduce((acc, conn) => {
    acc[conn.position] = (acc[conn.position] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Employee Management
        </h1>
        <p className="text-muted-foreground">
          View all employees and their facility access permissions
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{totalUsers}</div>
            <div className="text-sm text-muted-foreground">Total Employees</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Building2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{totalFacilities}</div>
            <div className="text-sm text-muted-foreground">
              Total Facilities
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <UserCheck className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{connections.length}</div>
            <div className="text-sm text-muted-foreground">
              Total Assignments
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">
              {totalUsers > 0
                ? Math.round((connections.length / totalUsers) * 10) / 10
                : 0}
            </div>
            <div className="text-sm text-muted-foreground">
              Avg Facilities/Employee
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Position Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Position Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(positionCounts).map(([position, count]) => (
              <Badge key={position} variant="outline" className="px-3 py-1">
                {position}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Employee Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Details</CardTitle>
          <p className="text-sm text-muted-foreground">
            Complete list of employees with their facility access and positions
          </p>
        </CardHeader>
        <CardContent>
          <EmployeeDataTable groupedUsers={groupedUsers} />
        </CardContent>
      </Card>

      {/* Raw Connections Table (for detailed view) */}
      <Card>
        <CardHeader>
          <CardTitle>All User-Facility Connections</CardTitle>
          <p className="text-sm text-muted-foreground">
            Detailed view of every user-facility relationship
          </p>
        </CardHeader>
        <CardContent>
          <ConnectionsDataTable connections={connections} />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function EmployeesPage() {
  return (
    <PageAuthWrapper
      requireAuthentication={true}
      allowedRoles={[Role.ADMIN, Role.OWNER]}
    >
      <EmployeesPageContent />
    </PageAuthWrapper>
  );
}
