"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/data-table/DataTable";
import { Users, Building2 } from "lucide-react";

// Type for the grouped user data
type GroupedUser = {
  userName: string;
  positions: string[];
  facilityCount: number;
  facilities: Array<{
    sitelinkId: string;
    facilityName: string;
    facilityAbbreviation: string;
    position: string;
  }>;
};

// Type for the processed connection data
type UserFacilityConnection = {
  sitelinkId: string;
  facilityName: string;
  facilityAbbreviation: string;
  position: string;
  fullName: string;
};

interface EmployeeDataTableProps {
  groupedUsers: GroupedUser[];
}

interface ConnectionsDataTableProps {
  connections: UserFacilityConnection[];
}

export function EmployeeDataTable({ groupedUsers }: EmployeeDataTableProps) {
  // Define columns for the grouped users table
  const columns: Column<GroupedUser>[] = [
    {
      key: "userName",
      header: "Employee Name",
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "positions",
      header: "Positions",
      sortable: true,
      render: (positions: string[]) => (
        <div className="flex flex-wrap gap-1">
          {positions.map((position, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {position}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "facilityCount",
      header: "Facilities",
      sortable: true,
      width: 100,
      render: (count) => (
        <div className="flex items-center gap-1">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono">{count}</span>
        </div>
      ),
    },
    {
      key: "facilities",
      header: "Facility Details",
      render: (
        facilities: Array<{
          sitelinkId: string;
          facilityName: string;
          facilityAbbreviation: string;
          position: string;
        }>
      ) => (
        <div className="space-y-1 max-w-md">
          {facilities.slice(0, 3).map((facility, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm"
            >
              <span className="truncate">{facility.facilityName}</span>
              <div className="flex items-center gap-1 ml-2">
                <Badge variant="secondary" className="text-xs">
                  {facility.facilityAbbreviation}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {facility.position}
                </Badge>
              </div>
            </div>
          ))}
          {facilities.length > 3 && (
            <div className="text-xs text-muted-foreground">
              +{facilities.length - 3} more facilities
            </div>
          )}
        </div>
      ),
    },
  ];

  const handleRowClick = (user: GroupedUser) => {
    console.log("Selected employee:", user.userName);
    // Here you could navigate to employee detail page
  };

  const handleExport = (data: GroupedUser[]) => {
    console.log("Exporting employee data:", data.length, "records");
    // Here you could implement CSV export functionality
  };

  return (
    <DataTable
      data={groupedUsers}
      columns={columns}
      pagination={{
        enabled: true,
        pageSize: 25,
        pageSizeOptions: [10, 25, 50, 100],
      }}
      sorting={{
        enabled: true,
        defaultSort: { key: "userName", direction: "asc" },
      }}
      filtering={{
        enabled: true,
        searchPlaceholder: "Search employees...",
      }}
      actions={{
        enabled: true,
        onExport: handleExport,
      }}
      onRowClick={handleRowClick}
    />
  );
}

export function ConnectionsDataTable({
  connections,
}: ConnectionsDataTableProps) {
  const columns: Column<UserFacilityConnection>[] = [
    {
      key: "fullName",
      header: "Employee",
      sortable: true,
      filterable: true,
    },
    {
      key: "facilityName",
      header: "Facility",
      sortable: true,
      filterable: true,
    },
    {
      key: "facilityAbbreviation",
      header: "Code",
      sortable: true,
      width: 80,
      render: (value) => (
        <Badge variant="secondary" className="font-mono">
          {value}
        </Badge>
      ),
    },
    {
      key: "position",
      header: "Position",
      sortable: true,
      filterable: true,
      render: (value) => <Badge variant="outline">{value}</Badge>,
    },
    {
      key: "sitelinkId",
      header: "Sitelink ID",
      sortable: true,
      width: 120,
      render: (value) => <span className="font-mono text-sm">{value}</span>,
    },
  ];

  return (
    <DataTable
      data={connections}
      columns={columns}
      pagination={{
        enabled: true,
        pageSize: 50,
        pageSizeOptions: [25, 50, 100, 200],
      }}
      sorting={{
        enabled: true,
        defaultSort: { key: "fullName", direction: "asc" },
      }}
      filtering={{
        enabled: true,
        searchPlaceholder: "Search connections...",
      }}
      virtualization={{
        enabled: true,
        height: 400,
        itemHeight: 50,
      }}
    />
  );
}
