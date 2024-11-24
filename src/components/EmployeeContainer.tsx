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
  const today = new Date();

  const {
    employees,
    nextPayPeriod,
    insuranceCommissionRate,
    storageCommissionRate,
    unlinkedActivities,
  } = await getUnpaidActivitiesByEmployee(sitelinkId);

  const employeeList = employees.reduce<
    { userDetailId: string; firstName: string; lastName: string }[]
  >((prevList, employee) => {
    if (employee.firstName) {
      return [
        ...prevList,
        {
          userDetailId: employee.userDetailsId,
          firstName: employee.firstName,
          lastName: employee.lastName,
        },
      ];
    }
    return prevList;
  }, []);

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
            />
          )
      )}
    </div>
  );
}

export default EmployeeContainer;
