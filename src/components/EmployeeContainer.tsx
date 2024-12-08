"use server";
import { db } from "@/db";
import React from "react";
import { and, count, eq, gte, lte, desc, sql } from "drizzle-orm";
import {
  payPeriod,
  storageFacilities,
  tenantActivities,
  userDetails,
  usersToFacilities,
} from "@/db/schema";
import { EmployeeCard } from "./EmployeeCard";
import { getUnpaidActivitiesByEmployee } from "@/lib/controllers/activityController";

interface EmployeeContainerProps {
  sitelinkId: string;
}

async function EmployeeContainer({ sitelinkId }: EmployeeContainerProps) {
  let {
    employees,
    nextPayPeriod,
    insuranceCommissionRate,
    storageCommissionRate,
    employeeList,
  } = await getUnpaidActivitiesByEmployee(sitelinkId);

  async function refreshData() {
    "use server";
    return ({
      employees,
      nextPayPeriod,
      insuranceCommissionRate,
      storageCommissionRate,
    } = await getUnpaidActivitiesByEmployee(sitelinkId));
  }
  // const updatedArray = await db
  //   .update(tenantActivities)
  //   .set({ payPeriodId: null })
  //   .where(eq(tenantActivities.payPeriodId, nextPayPeriod.payPeriodId))
  //   .returning({ ids: tenantActivities.Id });

  // console.log("🚀 ~ EmployeeContainer ~ updatedArray:", updatedArray);

  return (
    <div className="flex flex-col flex-wrap lg:flex-row justify-between gap-2 mb-8">
      {employees.map(
        (employee) =>
          (employee.fullName ?? employee.activities.length > 0) && (
            <EmployeeCard
              employeeList={employeeList}
              employee={employee}
              key={employee.userDetailsId}
              nextPayPeriod={nextPayPeriod}
              storageCommissionRate={storageCommissionRate}
              insuranceCommissionRate={insuranceCommissionRate}
              refreshData={refreshData}
              sitelinkId={sitelinkId}
            />
          )
      )}
    </div>
  );
}

export default EmployeeContainer;
