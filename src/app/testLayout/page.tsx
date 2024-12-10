import GoalChart from "@/components/GoalChart";
import { db } from "@/db";
import {
  dailyManagementActivity,
  dailyManagementOccupancy,
  dailyManagementPaymentReceipt,
  dailyManagementReceivable,
  dailyPayments,
  monthlyGoals,
  payPeriod,
  sitelinkLogons,
  tenantActivities,
} from "@/db/schema";
import { and, between, desc, eq, lt, sql } from "drizzle-orm";
// import { parse as parseOFX } from "ofx-js";

function generatePayPeriods(startDate: string, endYear: number) {
  const payPeriods = [];
  let currentDate = new Date(startDate);

  while (currentDate.getFullYear() <= endYear) {
    payPeriods.push({
      startDate: currentDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
      status: "Future",
    });
    // Increment by 14 days
    currentDate.setDate(currentDate.getDate() + 14);
  }

  return payPeriods;
}
export default async function YourPage() {
  const locations = await db.query.storageFacilities.findMany({
    where: (storageFacilities, { eq }) =>
      eq(storageFacilities.currentClient, true),
  });
  // const toAdd = generatePayPeriods("2024-11-24", 2027);

  // const addPayroll = await db
  //   .insert(payPeriod)
  //   .values(toAdd)
  //   .onConflictDoNothing();
  // // console.log("🚀 ~ YourPage ~ addPayroll:", addPayroll);

  // const updateDB = await db
  //   .update(tenantActivities)
  //   .set({
  //     commisionHasBeenPaid: true,
  //     payPeriodId: "d6a07933-5846-48b6-9e0a-4f0c4825eb87",
  //   })
  //   .where(
  //     and(
  //       lt(tenantActivities.date, new Date("2024-11-01")),
  //       eq(tenantActivities.activityType, "MoveIn")
  //     )
  //   );
  // console.log("🚀 ~ YourPage ~ updateDB:", updateDB);

  // const insuranceSignups = await db.query.storageFacilities.findMany({
  //   with: {
  //     tenantActivities: {
  //       where: (tenantActivities, { eq, and, gte }) =>
  //         and(
  //           eq(tenantActivities.activityType, "MoveIn"),
  //           gte(tenantActivities.date, new Date("01-01-2023"))
  //         ),
  //     },
  //   },
  // });

  // const storeArray = insuranceSignups
  //   .map((location) => {
  //     return {
  //       location: location.facilityAbbreviation,
  //       percentageWithInsurance:
  //         (location.tenantActivities.filter((moveIn) => moveIn.hasInsurance)
  //           .length /
  //           location.tenantActivities.length) *
  //         100,
  //       totalMoveins: location.tenantActivities.length,
  //     };
  //   })
  //   .sort((a, b) => a.percentageWithInsurance - b.percentageWithInsurance);
  // console.log(
  //   "🚀 ~ YourPage ~ storeArray:",
  //   JSON.stringify(storeArray, null, 4)
  // );

  // const findDuplicates = await db
  //   .select({
  //     tenant_unit: tenantActivities.unitName,
  //     date: tenantActivities.date,
  //     count: sql<number>`COUNT(*)`, // Use raw SQL for the COUNT function
  //   })
  //   .from(tenantActivities)
  //   .groupBy(tenantActivities.unitName, tenantActivities.date)
  //   .having(sql`COUNT(*) > 1`); // Filter groups with more than one occurrence

  // console.log("🚀 ~ YourPage ~ findDuplicates:", findDuplicates);

  //   function parseQFXDate(dtPosted: string) {
  //     // Extract the numeric portion before the `[0:GMT]`
  //     const dateString = dtPosted.split("[")[0];

  //     // Extract components from the date string
  //     const year = parseInt(dateString.slice(0, 4), 10);
  //     const month = parseInt(dateString.slice(4, 6), 10) - 1; // JavaScript months are 0-based
  //     const day = parseInt(dateString.slice(6, 8), 10);
  //     const hours = parseInt(dateString.slice(8, 10), 10);
  //     const minutes = parseInt(dateString.slice(10, 12), 10);
  //     const seconds = parseInt(dateString.slice(12, 14), 10);

  //     // Create a Date object in UTC
  //     return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
  //   }

  //   const ofxString = `
  // OFXHEADER:100
  // DATA:OFXSGML
  // VERSION:102
  // SECURITY:NONE
  // ENCODING:USASCII
  // CHARSET:1252
  // COMPRESSION:NONE
  // OLDFILEUID:NONE
  // NEWFILEUID:NONE
  // <OFX>
  // <SIGNONMSGSRSV1>
  // <SONRS>
  // <STATUS>
  // <CODE>0
  // <SEVERITY>INFO
  // </STATUS>
  // <DTSERVER>20241127120000[0:GMT]
  // <LANGUAGE>ENG
  // <FI>
  // <ORG>B1
  // <FID>10898
  // </FI>
  // <INTU.BID>2430
  // </SONRS>
  // </SIGNONMSGSRSV1>
  // <BANKMSGSRSV1>
  // <STMTTRNRS>
  // <TRNUID>1
  // <STATUS>
  // <CODE>0
  // <SEVERITY>INFO
  // <MESSAGE>Success
  // </STATUS>
  // <STMTRS>
  // <CURDEF>USD
  // <BANKACCTFROM>
  // <BANKID>322271627
  // <ACCTID>360951807
  // <ACCTTYPE>CHECKING
  // </BANKACCTFROM>
  // <BANKTRANLIST>
  // <DTSTART>20241121120000[0:GMT]
  // <DTEND>20241126120000[0:GMT]
  // <STMTTRN>
  // <TRNTYPE>CREDIT
  // <DTPOSTED>20241126120000[0:GMT]
  // <TRNAMT>281.00
  // <FITID>202411260
  // <NAME>ORIG CO NAME:MerchPayout SV9T
  // <MEMO>ORIG ID:1043575881 DESC DATE:241
  // </STMTTRN>
  // <STMTTRN>
  // <TRNTYPE>CHECK
  // <DTPOSTED>20241126120000[0:GMT]
  // <TRNAMT>-70.00
  // <FITID>202411261
  // <CHECKNUM>4195
  // <NAME>CHECK 4195
  // </STMTTRN>
  // <STMTTRN>
  // <TRNTYPE>CHECK
  // <DTPOSTED>20241126120000[0:GMT]
  // <TRNAMT>-278.71
  // <FITID>202411262
  // <CHECKNUM>4199
  // <NAME>CHECK 4199
  // </STMTTRN>
  // <STMTTRN>
  // <TRNTYPE>CHECK
  // <DTPOSTED>20241126120000[0:GMT]
  // <TRNAMT>-30.00
  // <FITID>202411263
  // <CHECKNUM>4192
  // <NAME>CHECK 4192
  // </STMTTRN>
  // <STMTTRN>
  // <TRNTYPE>CHECK
  // <DTPOSTED>20241126120000[0:GMT]
  // <TRNAMT>-342.31
  // <FITID>202411264
  // <CHECKNUM>4193
  // <NAME>CHECK 4193
  // </STMTTRN>
  // <STMTTRN>
  // <TRNTYPE>CREDIT
  // <DTPOSTED>20241125120000[0:GMT]
  // <TRNAMT>680.52
  // <FITID>202411250
  // <NAME>DEPOSIT
  // </STMTTRN>
  // <STMTTRN>
  // <TRNTYPE>CREDIT
  // <DTPOSTED>20241125120000[0:GMT]
  // <TRNAMT>1176.63
  // <FITID>202411251
  // <NAME>ORIG CO NAME:MerchPayout SV9T
  // <MEMO>ORIG ID:1043575881 DESC DATE:241
  // </STMTTRN>
  // <STMTTRN>
  // <TRNTYPE>CREDIT
  // <DTPOSTED>20241125120000[0:GMT]
  // <TRNAMT>949.15
  // <FITID>202411252
  // <NAME>ORIG CO NAME:MerchPayout SV9T
  // <MEMO>ORIG ID:1043575881 DESC DATE:241
  // </STMTTRN>
  // <STMTTRN>
  // <TRNTYPE>CREDIT
  // <DTPOSTED>20241125120000[0:GMT]
  // <TRNAMT>753.32
  // <FITID>202411253
  // <NAME>ORIG CO NAME:MerchPayout SV9T
  // <MEMO>ORIG ID:1043575881 DESC DATE:241
  // </STMTTRN>
  // <STMTTRN>
  // <TRNTYPE>DEBIT
  // <DTPOSTED>20241125120000[0:GMT]
  // <TRNAMT>-11.15
  // <FITID>202411254
  // <NAME>ORIG CO NAME:QUILL CORPORATIO
  // <MEMO>ORIG ID:3629529041 DESC DATE:112
  // </STMTTRN>
  // <STMTTRN>
  // <TRNTYPE>DEBIT
  // <DTPOSTED>20241125120000[0:GMT]
  // <TRNAMT>-101.56
  // <FITID>202411255
  // <NAME>ORIG CO NAME:NIPSCO ACCOUNTS
  // <MEMO>ORIG ID:0000000160 DESC DATE:241
  // </STMTTRN>
  // <STMTTRN>
  // <TRNTYPE>CHECK
  // <DTPOSTED>20241125120000[0:GMT]
  // <TRNAMT>-84.00
  // <FITID>202411256
  // <CHECKNUM>4196
  // <NAME>CHECK 4196
  // </STMTTRN>
  // <STMTTRN>
  // <TRNTYPE>CREDIT
  // <DTPOSTED>20241122120000[0:GMT]
  // <TRNAMT>102.00
  // <FITID>202411220
  // <NAME>DEPOSIT
  // </STMTTRN>
  // <STMTTRN>
  // <TRNTYPE>CREDIT
  // <DTPOSTED>20241122120000[0:GMT]
  // <TRNAMT>73.00
  // <FITID>202411221
  // <NAME>DEPOSIT
  // </STMTTRN>
  // <STMTTRN>
  // <TRNTYPE>CREDIT
  // <DTPOSTED>20241122120000[0:GMT]
  // <TRNAMT>200.96
  // <FITID>202411222
  // <NAME>ORIG CO NAME:MerchPayout SV9T
  // <MEMO>ORIG ID:1043575881 DESC DATE:241
  // </STMTTRN>
  // <STMTTRN>
  // <TRNTYPE>CREDIT
  // <DTPOSTED>20241121120000[0:GMT]
  // <TRNAMT>122.50
  // <FITID>202411210
  // <NAME>ORIG CO NAME:MerchPayout SV9T
  // <MEMO>ORIG ID:1043575881 DESC DATE:241
  // </STMTTRN>
  // <STMTTRN>
  // <TRNTYPE>CHECK
  // <DTPOSTED>20241121120000[0:GMT]
  // <TRNAMT>-900.00
  // <FITID>202411211
  // <CHECKNUM>4190
  // <NAME>CHECK 4190
  // </STMTTRN>
  // </BANKTRANLIST>
  // <LEDGERBAL>
  // <BALAMT>112105.13
  // <DTASOF>20241127120000[0:GMT]
  // </LEDGERBAL>
  // <AVAILBAL>
  // <BALAMT>110736.90
  // <DTASOF>20241127120000[0:GMT]
  // </AVAILBAL>
  // </STMTRS>
  // </STMTTRNRS>
  // </BANKMSGSRSV1>
  // </OFX>`;

  //   const { transactionStatement, accountId } = await parseOFX(ofxString).then(
  //     (ofxData) => {
  //       const statementResponse = ofxData.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS;
  //       const accountId = statementResponse.BANKACCTFROM.ACCTID;
  //       //const currencyCode = (currencyCode = statementResponse.CURDEF);
  //       const transactionStatement = statementResponse.BANKTRANLIST.STMTTRN;
  //       // do something...

  //       return { transactionStatement, accountId };
  //     }
  //   );

  //   const deposits = transactionStatement.filter(
  //     (transaction) => transaction.NAME === "DEPOSIT"
  //   );
  //   const transactionJSON = transactionStatement.map((transaction) => ({
  //     ID: transaction.FITID,
  //     Date: parseQFXDate(transaction.DTPOSTED),
  //     type: transaction.TRNTYPE,
  //     amount: transaction.TRNAMT,
  //     account: accountId,
  //   }));

  // console.log("🚀 ~ transactionJSON ~ transactionJSON:", transactionJSON);

  const getMonthlyStuff = await db.query.storageFacilities.findMany({
    columns: { facilityAbbreviation: true, sitelinkId: true },
    with: {
      dailyManagementReceivable: {
        limit: 3,
        orderBy: desc(dailyManagementReceivable.date),
        where: (dailyManagementReceivable, { and, lte }) =>
          and(
            lte(dailyManagementReceivable.date, "2024-11-30"),
            lte(dailyManagementReceivable.upperDayRange, 60)
          ),
        columns: {
          delinquentTotal: true,
          delinquentUnits: true,
          upperDayRange: true,
        },
      },
      dailyManagementOccupancy: {
        limit: 1,
        orderBy: desc(dailyManagementOccupancy.date),
        where: (dailyManagementOccupancy, { lte }) =>
          lte(dailyManagementOccupancy.date, "2024-11-30"),
        columns: { unitOccupancy: true },
      },
      dailyManagementActivity: {
        limit: 1,
        orderBy: desc(dailyManagementActivity.date),
        where: (dailyManagementActivity, { and, lte, eq }) =>
          and(
            lte(dailyManagementActivity.date, "2024-11-30"),
            eq(dailyManagementActivity.activityType, "Move-Ins")
          ),
        columns: { monthlyTotal: true },
      },
      monthlyGoals: {
        where: (monthlyGoals, { eq }) =>
          eq(monthlyGoals.month, new Date("2024-11-01")),
      },
      dailyManagementPaymentReceipt: {
        limit: 1,
        orderBy: desc(dailyManagementPaymentReceipt.date),
        where: (dailyManagementPaymentReceipt, { and, lte, eq }) =>
          and(
            lte(dailyManagementPaymentReceipt.date, "2024-11-30"),
            eq(dailyManagementPaymentReceipt.description, "Merchandise")
          ),
        columns: {
          description: true,
          monthlyAmount: true,
        },
      },
    },
  });
  // console.log(
  //   "🚀 ~ YourPage ~ getMonthlyStuff:",
  //   JSON.stringify(getMonthlyStuff, null, 4)
  // );

  // //days worked query
  // const result = await db
  //   .select({
  //     sitelinkEmployeeId: sitelinkLogons.sitelinkEmployeeId,
  //     loginDays: sql`COUNT(DISTINCT DATE(${sitelinkLogons.dateTime}))`.as(
  //       "login_days"
  //     ),
  //   })
  //   .from(sitelinkLogons)
  //   .where(
  //     sql`${sitelinkLogons.dateTime} BETWEEN ${sql.param(
  //       "2024-11-01"
  //     )} AND ${sql.param("2024-11-30")}`
  //   )
  //   .groupBy(sitelinkLogons.sitelinkEmployeeId);

  //cash+check AND CC query
  const result = await db
    .select({
      facilityId: dailyPayments.facilityId,
      date: dailyPayments.date,
      cash: dailyPayments.cash,
      check: dailyPayments.check,
      visa: dailyPayments.visa,
      mastercard: dailyPayments.mastercard,
      americanExpress: dailyPayments.americanExpress,
      ach: dailyPayments.ach,
      dinersClub: dailyPayments.dinersClub,
      debit: dailyPayments.debit,
      cashCheckTotal: sql`
      COALESCE(SUM(${dailyPayments.cash}), 0) + COALESCE(SUM(${dailyPayments.check}), 0)
    `.as("cash_check_total"),
      creditCardsTotal: sql`
      COALESCE(SUM(${dailyPayments.visa}), 0) +
      COALESCE(SUM(${dailyPayments.mastercard}), 0) +
      COALESCE(SUM(${dailyPayments.americanExpress}), 0) +
      COALESCE(SUM(${dailyPayments.discover}), 0) +
      COALESCE(SUM(${dailyPayments.ach}), 0) +
      COALESCE(SUM(${dailyPayments.dinersClub}), 0) +
      COALESCE(SUM(${dailyPayments.debit}), 0)
    `.as("credit_cards_total"),
    })
    .from(dailyPayments)
    .where(
      and(
        between(dailyPayments.date, "2024-11-01", "2024-11-30"),
        eq(dailyPayments.facilityId, "35")
      )
    )
    .groupBy(
      dailyPayments.facilityId,
      dailyPayments.date,
      dailyPayments.cash,
      dailyPayments.check,
      dailyPayments.ach,
      dailyPayments.mastercard,
      dailyPayments.visa,
      dailyPayments.dinersClub,
      dailyPayments.discover,
      dailyPayments.americanExpress,
      dailyPayments.debit
    );

  return (
    <div className="container mx-auto p-4">
      {/* Banner Section */}
      <div className="bg-blue-600 text-white p-6 rounded-lg mb-8 text-center">
        <h1 className="text-2xl font-bold">Storage Facility Name</h1>
        <p>1234 Main Street, City, State</p>
        <p>Email: facility@example.com | Phone: (123) 456-7890</p>
      </div>

      {/* Stats Section */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 mb-8">
        <div className="bg-gray-100 p-6 rounded-lg flex-1 text-center">
          <GoalChart
            facilityName={"TEST DATA"}
            monthlyRentals={23}
            rentalGoal={24}
          />
        </div>
        <div className="bg-gray-100 p-6 rounded-lg flex-1 text-center">
          Stat2 Component
        </div>
        <div className="bg-gray-100 p-6 rounded-lg flex-1 text-center">
          Stat3 Component
        </div>
      </div>

      {/* Graph Section */}
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-6">Locations</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="text-left p-4 font-semibold text-gray-600">
                  Facility Name
                </th>
                <th className="text-left p-4 font-semibold text-gray-600">
                  City
                </th>
                <th className="text-left p-4 font-semibold text-gray-600">
                  State
                </th>
                <th className="text-left p-4 font-semibold text-gray-600">
                  Website
                </th>
                <th className="text-left p-4 font-semibold text-gray-600">
                  Domain Registrar
                </th>
              </tr>
            </thead>
            <tbody>
              {/* {locations.map((location, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="p-4 text-gray-700">{location.facilityName}</td>
                  <td className="p-4 text-gray-700">{location.city}</td>
                  <td className="p-4 text-gray-700">{location.state}</td>
                  <td className="p-4">
                    <a
                      href={location.website ?? ""}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {location.website}
                    </a>
                  </td>
                  <td className="p-4 text-gray-700">
                    {location.domainRegistrar}
                  </td>
                </tr>
              ))} */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
