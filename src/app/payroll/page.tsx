import { db } from "@/db";
import {
  columns,
  CommittedPayrollByEmployee,
} from "./payrollTable/payrollColumns";
import { DataTable } from "./payrollTable/payrollDataTable";
import { ChoosePayrollDropDown } from "./Component/ChoosePayrollDropDown";
import { payPeriod, payPeriodStatusEnum } from "@/db/schema";
import { format } from "date-fns";
import { getEmployeePayrollData } from "@/lib/controllers/payrollController/getEmployeePayrollData";

export default async function payrollPage({
  searchParams,
}: {
  searchParams?: Promise<{ payPeriod?: string }>;
}) {
  const payPeriods = await db.query.payPeriod.findMany({
    where: (payPeriod, { lt }) =>
      lt(payPeriod.startDate, new Date().toLocaleDateString()),
    orderBy: (payPeriod, { desc }) => [desc(payPeriod.startDate)],
  });
  const params = await searchParams;
  const selectedId = params?.payPeriod ?? payPeriods[1]?.payPeriodId ?? null;
  const selectedPeriod = payPeriods.find((p) => p.payPeriodId === selectedId);
  const payrollData = await getEmployeePayrollData(selectedId);

  return (
    <div className="container mx-auto py-10 space-y-6">
      <ChoosePayrollDropDown payPeriods={payPeriods} selectedId={selectedId} />

      {selectedPeriod && (
        <div className="text-sm text-muted-foreground">
          Selected pay period: <strong>{selectedPeriod.payPeriodId}</strong>
        </div>
      )}

      <DataTable columns={columns} data={payrollData.finalResult} />
    </div>
  );
}
