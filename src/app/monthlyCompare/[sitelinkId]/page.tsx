import { dailyPaymentFromManagementSummary } from "@/lib/controllers/dailyPaymentController/dailyPaymentFromManagementSummary";
import React from "react";

// Dummy function for demonstration. Replace with your actual import.

type PaymentData = {
  date: string;
  dailyAmount: number;
  monthlyAmount: number;
};

export default async function MonthlyComparePage({
  params,
}: {
  params: Promise<{ sitelinkId: string }>;
}) {
  const sitelinkId = (await params).sitelinkId;

  // Fetch data (assume the function returns a Promise<PaymentData[]>)
  const data: PaymentData[] = await dailyPaymentFromManagementSummary(
    sitelinkId
  );
  const dataSummedByDate = data
    .reduce((acc, curr) => {
      const existing = acc.find((item) => item.date === curr.date);
      if (existing) {
        existing.dailyAmount += curr.dailyAmount;
        existing.monthlyAmount += curr.monthlyAmount;
      } else {
        acc.push({ ...curr });
      }
      return acc;
    }, [] as PaymentData[])
    .sort((a, b) => (a.date > b.date ? 1 : -1));
  // Group data by month
  const months = Array.from(
    dataSummedByDate.reduce((acc, item) => {
      const month = item.date.slice(0, 7); // Extract YYYY-MM
      if (!acc.has(month)) acc.set(month, []);
      acc.get(month)!.push(item);
      return acc;
    }, new Map<string, PaymentData[]>())
  );
  const sortedMonths = new Map(
    Array.from(months).sort((a, b) => (a[0] < b[0] ? 1 : -1))
  );
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Monthly Compare</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
        {Array.from(sortedMonths).map(([month, entries]) => (
          <div
            key={month}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "1rem",
              minWidth: "300px",
              background: "#fafafa",
            }}
          >
            <h2>{month}</h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Daily Payment
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Monthly Payment
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.date}>
                    <td>{entry.date}</td>
                    <td style={{ textAlign: "right" }}>
                      {entry.dailyAmount.toLocaleString()}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {entry.monthlyAmount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
