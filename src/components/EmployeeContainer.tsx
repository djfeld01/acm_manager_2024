import { db } from "@/db";
import React from "react";
import { and, count, eq, gte, lte, desc, sql } from "drizzle-orm";
import {
  storageFacilities,
  tenantActivities,
  userDetails,
  usersToFacilities,
} from "@/db/schema";
import { Activity, EmployeeCard } from "./EmployeeCard";
import { getUnpaidActivitiesByEmployee } from "@/lib/controllers/activityController";

interface EmployeeContainerProps {
  sitelinkId: string;
}

async function EmployeeContainer({ sitelinkId }: EmployeeContainerProps) {
  const today = new Date();

  const employees = await getUnpaidActivitiesByEmployee(sitelinkId);

  return (
    <div className="flex flex-col flex-wrap lg:flex-row justify-between gap-2 mb-8">
      {employees.map((employee) => (
        <EmployeeCard employee={employee} key={employee.userDetailsId} />
      ))}
    </div>
  );
}

export default EmployeeContainer;
