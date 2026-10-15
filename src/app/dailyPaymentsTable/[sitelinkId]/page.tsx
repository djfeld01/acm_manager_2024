import { db } from "@/db";
import {
  dailyPayments,
  bankTransaction,
  bankAccount,
  storageFacilities,
} from "@/db/schema";
import { BankTransaction, Payment, columns } from "./columns";
import { DataTable } from "./data-table";
import { auth } from "@/auth";
import { sql, desc, eq, and } from "drizzle-orm";
import { Row } from "@tanstack/react-table";
import LocationHeader from "@/app/location2/_components/LocationHeader";
import { exactCents, exactCentsSum } from "@/lib/exactCents";

const creditCardColumns = [
  dailyPayments.visa,
  dailyPayments.mastercard,
  dailyPayments.discover,
  dailyPayments.americanExpress,
  dailyPayments.ach,
  dailyPayments.dinersClub,
  dailyPayments.debit,
];

// exactCents values arrive as numeric strings (or null).
const toAmount = (value: string | null) => Number(value ?? 0);

async function getData(sitelinkId: string): Promise<Payment[]> {
  const session = await auth();
  if (!session || !session.user) {
    throw Error("User not found");
  }
  const { user } = session;

  //const committedPayments = await db.select({});
  const unmatchedDailyPayments = await db
    .select({
      dailyPaymentId: dailyPayments.Id,
      sitelinkDate: dailyPayments.date,
      facilityId: dailyPayments.facilityId,
      cash: exactCents(dailyPayments.cash),
      check: exactCents(dailyPayments.check),
      cashCheckDeposit: exactCentsSum(dailyPayments.cash, dailyPayments.check),
      visa: exactCents(dailyPayments.visa),
      mastercard: exactCents(dailyPayments.mastercard),
      discover: exactCents(dailyPayments.discover),
      americanExpress: exactCents(dailyPayments.americanExpress),
      ach: exactCents(dailyPayments.ach),
      dinersClub: exactCents(dailyPayments.dinersClub),
      debit: exactCents(dailyPayments.debit),
      creditCardDeposit: exactCentsSum(...creditCardColumns),
      dailyTotal: exactCentsSum(
        ...creditCardColumns,
        dailyPayments.cash,
        dailyPayments.check
      ),
      bankTransactions: sql`
      COALESCE(
        json_agg(
          json_build_object(
            'bankAccountName', ${bankAccount.bankName},
            'bankTransactionId', ${bankTransaction.bankTransactionId},
            'transactionDate', ${bankTransaction.transactionDate},
            'transactionAmount', ${bankTransaction.transactionAmount},
            'transactionType', ${bankTransaction.transactionType}
          )
        ) FILTER (WHERE ${bankTransaction.bankTransactionId} IS NOT NULL), '[]'
      )::json
    `,
    })
    .from(dailyPayments)
    .leftJoin(
      bankTransaction,
      sql`
        (
          (${bankTransaction.transactionAmount} BETWEEN ${dailyPayments.cash} + ${dailyPayments.check} - .01 AND ${dailyPayments.cash} + ${dailyPayments.check}+.01) AND
          ${bankTransaction.transactionDate} BETWEEN ${dailyPayments.date} - INTERVAL '15 days' AND ${dailyPayments.date} + INTERVAL '15 days'
        )
        OR 
        (
          (${bankTransaction.transactionAmount} BETWEEN 
          ${dailyPayments.visa} + ${dailyPayments.mastercard} + ${dailyPayments.discover} + 
           ${dailyPayments.americanExpress} + ${dailyPayments.ach} + 
           ${dailyPayments.dinersClub} + ${dailyPayments.debit} - .01 AND ${dailyPayments.visa} + ${dailyPayments.mastercard} + ${dailyPayments.discover} + 
           ${dailyPayments.americanExpress} + ${dailyPayments.ach} + 
           ${dailyPayments.dinersClub} + ${dailyPayments.debit} + .01)
          AND ${bankTransaction.transactionDate} 
          BETWEEN ${dailyPayments.date} - INTERVAL '7 days' AND ${dailyPayments.date} + INTERVAL '7 days'
        )
      `
    )
    .leftJoin(
      bankAccount,
      and(
        eq(bankAccount.bankAccountId, bankTransaction.bankAccountId),
        eq(bankAccount.sitelinkId, dailyPayments.facilityId)
      )
    )

    .where(eq(dailyPayments.facilityId, sitelinkId))
    .groupBy(dailyPayments.Id)
    .orderBy(desc(dailyPayments.date));

  console.log("unmatchedDailyPayments", unmatchedDailyPayments);
  const transformedPayments: Payment[] = unmatchedDailyPayments.map(
    (payment) => {
      const bankTransactions = payment.bankTransactions as BankTransaction[];
      const cashBankTransactions = bankTransactions.filter(
        (transaction) => transaction.transactionType === "cash"
      );

      const hasCashBankTransaction = cashBankTransactions.length > 0;
      // ||
      // Number(payment.cashCheckDeposit) === 0;

      const creditCardTransactions = bankTransactions.filter(
        (transaction) => transaction.transactionType === "creditCard"
      );

      const hasCreditCardBankTransaction = creditCardTransactions.length > 0;
      // ||
      // Number(payment.creditCardDeposit) === 0;

      return {
        dailyPaymentId: payment.dailyPaymentId,
        sitelinkDate: new Date(`${payment.sitelinkDate}T00:00:00`), // Convert string to Date
        facilityId: payment.facilityId,
        cash: toAmount(payment.cash),
        check: toAmount(payment.check),
        visa: toAmount(payment.visa),
        mastercard: toAmount(payment.mastercard),
        discover: toAmount(payment.discover),
        americanExpress: toAmount(payment.americanExpress),
        ach: toAmount(payment.ach),
        dinersClub: toAmount(payment.dinersClub),
        debit: toAmount(payment.debit),
        cashCheckDeposit: toAmount(payment.cashCheckDeposit),
        creditCardDeposit: toAmount(payment.creditCardDeposit),
        dailyTotal: toAmount(payment.dailyTotal),
        cashBankTransactions,
        hasCashBankTransaction,
        creditCardTransactions,
        hasCreditCardBankTransaction,
        bankTransactions: payment.bankTransactions as BankTransaction[],
      };
    }
  );
  return transformedPayments;
}

// async function renderSubComponent({ row }: { row: Row<Payment> }) {
//   "use server";
//   const { cashBankTransactions, creditCardTransactions } =
//     row.original as Payment;
//   return (
//     <div className="grid gap-4">
//       <div className="grid grid-cols-2 gap-4">
//         <h3 className="text-lg font-bold">Cash Bank Transactions</h3>
//         <h3 className="text-lg font-bold">Credit Card Bank Transactions</h3>
//       </div>
//       <div className="grid grid-cols-2 gap-4">
//         <DataTable columns={columns} data={cashBankTransactions} />
//         <DataTable columns={columns} data={creditCardTransactions} />
//       </div>
//     </div>
//   );
// }

export default async function dailyPaymentsPage({
  params,
}: {
  params: Promise<{ sitelinkId: string }>;
}) {
  const sitelinkId = (await params).sitelinkId;
  const session = await auth();
  if (!session || !session.user) {
    return <p>Please Log On</p>;
  }
  const { user } = session;

  const data = await getData(sitelinkId);

  return (
    <div className="container mx-auto py-10">
      <LocationHeader facilityId={sitelinkId} />
      <DataTable
        columns={columns}
        data={data}
        //renderSubComponent={renderSubComponent}
      />
    </div>
  );
}
