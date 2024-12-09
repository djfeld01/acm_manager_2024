"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import React from "react";
import EmployeeCard from "./EmployeeCard";
import {
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { workingEmployees } from "@/app/queryHelpers/queryOptions";

type LocationCardProps = {
  sitelinkId: string;
  facilityName: string;
};

function LocationCard({ sitelinkId, facilityName }: LocationCardProps) {
  const queryClient = useQueryClient();
  const query = useQuery(workingEmployees(sitelinkId));

  return (
    <Card>
      <CardHeader className="font-semibold text-center">
        {facilityName}
      </CardHeader>
      <CardContent>
        <EmployeeCard employeeName="David" employeeId="123" />
      </CardContent>
    </Card>
  );
}

export default LocationCard;
function payrollPageDataOptions(sitelinkId: string): any {
  throw new Error("Function not implemented.");
}
