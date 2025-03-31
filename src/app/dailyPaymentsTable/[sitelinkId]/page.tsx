import { db } from "@/db";
import { dailyPayments, bankTransaction, bankAccount } from "@/db/schema";
import { BankTransaction, Payment, columns } from "./columns";
import { DataTable } from "./data-table";
import { auth } from "@/auth";
import { sql, desc, eq, and } from "drizzle-orm";

async function getData(sitelinkId: string): Promise<Payment[]> {
  const session = await auth();
  if (!session || !session.user) {
    throw Error("User not found");
  }
  const { user } = session;

  const unmatchedDailyPayments = await db
    .select({
      sitelinkDate: dailyPayments.date,
      facilityId: dailyPayments.facilityId,
      cash: dailyPayments.cash,
      check: dailyPayments.check,
      cashCheckDeposit: sql`(${dailyPayments.cash} + ${dailyPayments.check})`,
      visa: dailyPayments.visa,
      mastercard: dailyPayments.mastercard,
      discover: dailyPayments.discover,
      americanExpress: dailyPayments.americanExpress,
      ach: dailyPayments.ach,
      dinersClub: dailyPayments.dinersClub,
      debit: dailyPayments.debit,
      creditCardDeposit: sql`(
      ${dailyPayments.visa} + ${dailyPayments.mastercard} + 
      ${dailyPayments.discover} + ${dailyPayments.americanExpress} + 
      ${dailyPayments.ach} + ${dailyPayments.dinersClub} + ${dailyPayments.debit}
    )`,
      dailyTotal: sql`(
      ${dailyPayments.visa} + ${dailyPayments.mastercard} + 
      ${dailyPayments.discover} + ${dailyPayments.americanExpress} + 
      ${dailyPayments.ach} + ${dailyPayments.dinersClub} + ${dailyPayments.debit}+${dailyPayments.cash} + ${dailyPayments.check})`,
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

  // const unmatchedBankTransactions = await db.query.bankAccount.findMany({
  //   where: (bankAccount, { and, eq, or }) =>
  //     and(
  //       eq(bankAccount.sitelinkId, sitelinkId),
  //       or(
  //         eq(bankAccount.bankAccountType, "all"),
  //         eq(bankAccount.bankAccountType, "cash"),
  //         eq(bankAccount.bankAccountType, "creditCard")
  //       )
  //     ),
  //   with: { bankTransactions: true },
  // });

  // const potentialMatchedTransactions= unmatchedBankTransactions.map((dp)=>{
  //   const potentialMatch= unmatchedBankTransactions[0].bankTransactions.filter((bt) =>
  //     Math.abs(new Date(bt.) - new Date(dp.date)) <= 10 * 86400000

  // })

  const transformedPayments: Payment[] = unmatchedDailyPayments.map(
    (payment) => {
      const bankTransactions = payment.bankTransactions as BankTransaction[];
      const cashBankTransactions = bankTransactions.filter(
        (transaction) => transaction.transactionType === "cash"
      );

      const hasCashBankTransaction =
        cashBankTransactions.length > 0 ||
        Number(payment.cashCheckDeposit) === 0;

      const creditCardTransactions = bankTransactions.filter(
        (transaction) => transaction.transactionType === "creditCard"
      );

      const hasCreditCardBankTransaction =
        creditCardTransactions.length > 0 ||
        Number(payment.creditCardDeposit) === 0;

      return {
        sitelinkDate: new Date(payment.sitelinkDate), // Convert string to Date
        facilityId: payment.facilityId,
        cash: payment.cash ?? 0, // Provide default values for null
        check: payment.check ?? 0,
        visa: payment.visa ?? 0,
        mastercard: payment.mastercard ?? 0,
        discover: payment.discover ?? 0,
        americanExpress: payment.americanExpress ?? 0,
        ach: payment.ach ?? 0,
        dinersClub: payment.dinersClub ?? 0,
        debit: payment.debit ?? 0,
        cashCheckDeposit: Number(payment.cashCheckDeposit), // Cast unknown to number
        creditCardDeposit: Number(payment.creditCardDeposit), // Cast unknown to number
        dailyTotal: Number(payment.dailyTotal),
        cashBankTransactions,
        hasCashBankTransaction,
        creditCardTransactions,
        hasCreditCardBankTransaction,
        bankTransactions: payment.bankTransactions as BankTransaction[],
      };
    }
  );
  console.log(transformedPayments[22]);
  return transformedPayments;
}

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
      <DataTable columns={columns} data={data} />
    </div>
  );
}
