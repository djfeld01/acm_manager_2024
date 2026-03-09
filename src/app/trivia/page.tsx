import { db } from "@/db";
import {
  storageFacilities,
  tenantActivities,
  dailyPayments,
  userDetails,
  bonus,
  inquiry,
} from "@/db/schema";
import { eq, sql, desc, and, ne } from "drizzle-orm";
import { TriviaClient } from "./_components/TriviaClient";

export type TriviaQuestion = {
  id: string;
  question: string;
  answer: string; // always a number (count, $amount, years, etc.)
  detail?: string; // host context: who/what/where the answer refers to
};

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0];
}

const fmt$ = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const totalPayments = sql<number>`
  ${dailyPayments.cash} + ${dailyPayments.check} + ${dailyPayments.visa} +
  ${dailyPayments.mastercard} + ${dailyPayments.americanExpress} +
  ${dailyPayments.discover} + ${dailyPayments.ach} +
  ${dailyPayments.dinersClub} + ${dailyPayments.debit}`;

export default async function TriviaPage() {
  const questions: TriviaQuestion[] = [];

  // Q1: How many years has our longest-tenured active employee worked here?
  const longestEmployee = await db
    .select({ fullName: userDetails.fullName, hireDate: userDetails.hireDate })
    .from(userDetails)
    .where(
      and(
        eq(userDetails.isActiveEmployee, true),
        sql`${userDetails.hireDate} IS NOT NULL`,
      ),
    )
    .orderBy(userDetails.hireDate)
    .limit(2);

  if (longestEmployee[0]) {
    const hireDate = new Date(longestEmployee[0].hireDate!);
    const years = Math.floor(
      (Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
    );
    questions.push({
      id: "longest-employee-years",
      question:
        "How many years has our longest-tenured active employee worked here?",
      answer: String(years),
      detail: `${longestEmployee[0].fullName} · hired ${hireDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}${longestEmployee[1] ? ` · Runner-up: ${longestEmployee[1].fullName}` : ""}`,
    });
  }

  // Q2: How much did we collect in our best single month ever?
  const bestMonth = await db
    .select({
      month: sql<string>`DATE_TRUNC('month', ${dailyPayments.date})`,
      total: sql<number>`SUM(${totalPayments})`,
    })
    .from(dailyPayments)
    .groupBy(sql`DATE_TRUNC('month', ${dailyPayments.date})`)
    .orderBy(desc(sql`SUM(${totalPayments})`))
    .limit(1);

  if (bestMonth[0]) {
    const d = new Date(bestMonth[0].month);
    questions.push({
      id: "best-collection-month",
      question: "How much did we collect across all stores in our best month ever?",
      answer: fmt$(bestMonth[0].total),
      detail: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    });
  }

  // Q3: How many move-ins has our top-performing employee processed?
  const topMoveInEmployee = await db
    .select({
      fullName: userDetails.fullName,
      count: sql<number>`COUNT(*)`,
    })
    .from(tenantActivities)
    .innerJoin(userDetails, eq(tenantActivities.employeeId, userDetails.id))
    .where(eq(tenantActivities.activityType, "MoveIn"))
    .groupBy(userDetails.fullName)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(2);

  if (topMoveInEmployee[0]) {
    questions.push({
      id: "most-move-ins-employee",
      question: "How many move-ins has our top-performing employee ever processed?",
      answer: String(topMoveInEmployee[0].count),
      detail: `${topMoveInEmployee[0].fullName}${topMoveInEmployee[1] ? ` · Runner-up: ${topMoveInEmployee[1].fullName} (${topMoveInEmployee[1].count})` : ""}`,
    });
  }

  // Q4: How many move-ins has our busiest facility had all time?
  const topMoveInFacility = await db
    .select({
      facilityName: storageFacilities.facilityName,
      count: sql<number>`COUNT(*)`,
    })
    .from(tenantActivities)
    .innerJoin(
      storageFacilities,
      eq(tenantActivities.facilityId, storageFacilities.sitelinkId),
    )
    .where(
      and(
        eq(tenantActivities.activityType, "MoveIn"),
        eq(storageFacilities.isCorporate, false),
      ),
    )
    .groupBy(storageFacilities.facilityName)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(2);

  if (topMoveInFacility[0]) {
    questions.push({
      id: "most-move-ins-facility",
      question: "How many move-ins has our busiest facility had all time?",
      answer: String(topMoveInFacility[0].count),
      detail: `${topMoveInFacility[0].facilityName}${topMoveInFacility[1] ? ` · Runner-up: ${topMoveInFacility[1].facilityName} (${topMoveInFacility[1].count})` : ""}`,
    });
  }

  // Q5: How many of our all-time move-ins came from our #1 lead source?
  const topLeadSource = await db
    .select({
      leadSource: tenantActivities.leadSource,
      count: sql<number>`COUNT(*)`,
    })
    .from(tenantActivities)
    .where(
      and(
        eq(tenantActivities.activityType, "MoveIn"),
        sql`${tenantActivities.leadSource} IS NOT NULL`,
        ne(tenantActivities.leadSource, ""),
      ),
    )
    .groupBy(tenantActivities.leadSource)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(2);

  if (topLeadSource[0]) {
    questions.push({
      id: "top-lead-source-count",
      question: "How many of our all-time move-ins came from our #1 lead source?",
      answer: String(topLeadSource[0].count),
      detail: `Lead source: ${topLeadSource[0].leadSource}${topLeadSource[1] ? ` · #2: ${topLeadSource[1].leadSource} (${topLeadSource[1].count})` : ""}`,
    });
  }

  // Q6: What is the most ever collected in a single day?
  const bestDay = await db
    .select({
      date: dailyPayments.date,
      facilityId: dailyPayments.facilityId,
      total: sql<number>`${totalPayments}`,
    })
    .from(dailyPayments)
    .orderBy(desc(sql`${totalPayments}`))
    .limit(1);

  if (bestDay[0]) {
    const facilityRow = await db
      .select({ facilityName: storageFacilities.facilityName })
      .from(storageFacilities)
      .where(eq(storageFacilities.sitelinkId, bestDay[0].facilityId))
      .limit(1);

    const d = new Date(bestDay[0].date!);
    questions.push({
      id: "best-single-day",
      question: "What is the most we have ever collected in a single day at one store?",
      answer: fmt$(bestDay[0].total),
      detail: `${d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · ${facilityRow[0]?.facilityName ?? ""}`,
    });
  }

  // Q7: Total move-ins ever
  const totalMoveIns = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(tenantActivities)
    .where(eq(tenantActivities.activityType, "MoveIn"));

  questions.push({
    id: "total-move-ins",
    question: "How many total move-ins has the company processed across all stores?",
    answer: Number(totalMoveIns[0]?.count ?? 0).toLocaleString(),
  });

  // Q8: How much has our top bonus earner made in total bonuses?
  const topBonusEmployee = await db
    .select({
      fullName: userDetails.fullName,
      totalBonus: sql<number>`SUM(${bonus.bonusAmount})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(bonus)
    .innerJoin(userDetails, eq(bonus.employeeId, userDetails.id))
    .groupBy(userDetails.fullName)
    .orderBy(desc(sql`SUM(${bonus.bonusAmount})`))
    .limit(2);

  if (topBonusEmployee[0]) {
    questions.push({
      id: "top-bonus-total",
      question: "How much has our top bonus earner made in total bonuses?",
      answer: fmt$(topBonusEmployee[0].totalBonus),
      detail: `${topBonusEmployee[0].fullName} · ${topBonusEmployee[0].count} bonuses${topBonusEmployee[1] ? ` · Runner-up: ${topBonusEmployee[1].fullName} (${fmt$(topBonusEmployee[1].totalBonus)})` : ""}`,
    });
  }

  // Q9: How many move-ins have happened on our busiest day of the week?
  const moveInsByDay = await db
    .select({
      dayOfWeek: sql<number>`EXTRACT(DOW FROM ${tenantActivities.date})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(tenantActivities)
    .where(eq(tenantActivities.activityType, "MoveIn"))
    .groupBy(sql`EXTRACT(DOW FROM ${tenantActivities.date})`)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(1);

  if (moveInsByDay[0]) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    questions.push({
      id: "move-in-day-of-week-count",
      question: "How many of our all-time move-ins happened on our busiest day of the week?",
      answer: String(moveInsByDay[0].count),
      detail: `${days[moveInsByDay[0].dayOfWeek]}s`,
    });
  }

  // Q10: How many active employees
  const activeEmployeeCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(userDetails)
    .where(eq(userDetails.isActiveEmployee, true));

  questions.push({
    id: "active-employees",
    question: "How many active employees does the company currently have?",
    answer: String(activeEmployeeCount[0]?.count ?? 0),
  });

  // Q11: Which day of the month gets the most rentals? (by lease_date)
  const rentalsByDayOfMonth = await db
    .select({
      day: sql<number>`EXTRACT(DAY FROM ${inquiry.leaseDate})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(inquiry)
    .where(sql`${inquiry.leaseDate} IS NOT NULL`)
    .groupBy(sql`EXTRACT(DAY FROM ${inquiry.leaseDate})`)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(5);

  if (rentalsByDayOfMonth[0]) {
    const top5 = rentalsByDayOfMonth
      .map((r, i) => `#${i + 1}: ${r.day}${ordinal(r.day)} (${r.count})`)
      .join(" · ");
    questions.push({
      id: "rentals-by-day-of-month",
      question: "What day of the month do we rent the most storage units?",
      answer: String(rentalsByDayOfMonth[0].day),
      detail: top5,
    });
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="bg-primary text-primary-foreground rounded-lg p-5">
        <h1 className="text-2xl font-bold">Staff Trivia</h1>
        <p className="text-primary-foreground/80 mt-0.5">
          All answers are numbers · pin questions you want to use · export to CSV when ready
        </p>
      </div>
      <TriviaClient questions={questions} />
    </div>
  );
}
