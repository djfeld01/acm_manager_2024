import { db } from "@/db";
import {
  storageFacilities,
  tenantActivities,
  dailyPayments,
  userDetails,
  bonus,
} from "@/db/schema";
import { eq, sql, desc, and, ne } from "drizzle-orm";
import { TriviaClient } from "./_components/TriviaClient";

export type TriviaQuestion = {
  id: string;
  question: string;
  answer: string;
  detail?: string;
};

export default async function TriviaPage() {
  const questions: TriviaQuestion[] = [];

  // Q1: Longest-tenured active employee
  const longestEmployee = await db
    .select({
      fullName: userDetails.fullName,
      hireDate: userDetails.hireDate,
    })
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
      id: "longest-employee",
      question: "Which active employee has worked for the company the longest?",
      answer: longestEmployee[0].fullName ?? "Unknown",
      detail: `${years} years · hired ${hireDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}${longestEmployee[1] ? ` · Runner-up: ${longestEmployee[1].fullName}` : ""}`,
    });
  }

  // Q2: All-time best collection month
  const bestMonth = await db
    .select({
      month: sql<string>`DATE_TRUNC('month', ${dailyPayments.date})`,
      total: sql<number>`SUM(${dailyPayments.cash} + ${dailyPayments.check} + ${dailyPayments.visa} + ${dailyPayments.mastercard} + ${dailyPayments.americanExpress} + ${dailyPayments.discover} + ${dailyPayments.ach} + ${dailyPayments.dinersClub} + ${dailyPayments.debit})`,
    })
    .from(dailyPayments)
    .groupBy(sql`DATE_TRUNC('month', ${dailyPayments.date})`)
    .orderBy(
      desc(
        sql`SUM(${dailyPayments.cash} + ${dailyPayments.check} + ${dailyPayments.visa} + ${dailyPayments.mastercard} + ${dailyPayments.americanExpress} + ${dailyPayments.discover} + ${dailyPayments.ach} + ${dailyPayments.dinersClub} + ${dailyPayments.debit})`,
      ),
    )
    .limit(1);

  if (bestMonth[0]) {
    const d = new Date(bestMonth[0].month);
    const fmt$ = (n: number) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(n);
    questions.push({
      id: "best-collection-month",
      question: "What is the highest-grossing month in company history?",
      answer: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      detail: fmt$(bestMonth[0].total),
    });
  }

  // Q3: Employee with the most move-ins ever
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
      question: "Which employee has processed the most move-ins?",
      answer: topMoveInEmployee[0].fullName ?? "Unknown",
      detail: `${topMoveInEmployee[0].count} move-ins${topMoveInEmployee[1] ? ` · Runner-up: ${topMoveInEmployee[1].fullName} (${topMoveInEmployee[1].count})` : ""}`,
    });
  }

  // Q4: Facility with most total move-ins
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
      question: "Which facility has had the most move-ins of all time?",
      answer: topMoveInFacility[0].facilityName,
      detail: `${topMoveInFacility[0].count} move-ins${topMoveInFacility[1] ? ` · Runner-up: ${topMoveInFacility[1].facilityName} (${topMoveInFacility[1].count})` : ""}`,
    });
  }

  // Q5: Most common lead source for move-ins
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
      id: "top-lead-source",
      question: "What is our #1 source for new customers?",
      answer: topLeadSource[0].leadSource ?? "Unknown",
      detail: `${topLeadSource[0].count} move-ins${topLeadSource[1] ? ` · #2: ${topLeadSource[1].leadSource} (${topLeadSource[1].count})` : ""}`,
    });
  }

  // Q6: Highest single-day collection ever
  const bestDay = await db
    .select({
      date: dailyPayments.date,
      facilityId: dailyPayments.facilityId,
      total: sql<number>`${dailyPayments.cash} + ${dailyPayments.check} + ${dailyPayments.visa} + ${dailyPayments.mastercard} + ${dailyPayments.americanExpress} + ${dailyPayments.discover} + ${dailyPayments.ach} + ${dailyPayments.dinersClub} + ${dailyPayments.debit}`,
    })
    .from(dailyPayments)
    .orderBy(
      desc(
        sql`${dailyPayments.cash} + ${dailyPayments.check} + ${dailyPayments.visa} + ${dailyPayments.mastercard} + ${dailyPayments.americanExpress} + ${dailyPayments.discover} + ${dailyPayments.ach} + ${dailyPayments.dinersClub} + ${dailyPayments.debit}`,
      ),
    )
    .limit(1);

  if (bestDay[0]) {
    const facilityRow = await db
      .select({ facilityName: storageFacilities.facilityName })
      .from(storageFacilities)
      .where(eq(storageFacilities.sitelinkId, bestDay[0].facilityId))
      .limit(1);

    const fmt$ = (n: number) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(n);
    const d = new Date(bestDay[0].date!);
    questions.push({
      id: "best-single-day",
      question: "What is the highest amount ever collected in a single day?",
      answer: fmt$(bestDay[0].total),
      detail: `${d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · ${facilityRow[0]?.facilityName ?? "Unknown facility"}`,
    });
  }

  // Q7: Total number of move-ins ever
  const totalMoveIns = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(tenantActivities)
    .where(eq(tenantActivities.activityType, "MoveIn"));

  questions.push({
    id: "total-move-ins",
    question: "How many total move-ins has the company ever processed?",
    answer: totalMoveIns[0]?.count.toLocaleString() ?? "0",
  });

  // Q8: Most bonuses earned by a single employee
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
    const fmt$ = (n: number) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(n);
    questions.push({
      id: "top-bonus-earner",
      question: "Which employee has earned the most in bonuses?",
      answer: topBonusEmployee[0].fullName ?? "Unknown",
      detail: `${fmt$(topBonusEmployee[0].totalBonus)} across ${topBonusEmployee[0].count} bonuses${topBonusEmployee[1] ? ` · Runner-up: ${topBonusEmployee[1].fullName} (${fmt$(topBonusEmployee[1].totalBonus)})` : ""}`,
    });
  }

  // Q9: Day of week with most move-ins
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
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    questions.push({
      id: "move-in-day-of-week",
      question: "What day of the week do we get the most move-ins?",
      answer: days[moveInsByDay[0].dayOfWeek],
      detail: `${moveInsByDay[0].count} move-ins`,
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
    answer: activeEmployeeCount[0]?.count.toString() ?? "0",
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="bg-primary text-primary-foreground rounded-lg p-5">
        <h1 className="text-2xl font-bold">Staff Trivia</h1>
        <p className="text-primary-foreground/80 mt-0.5">
          Pin the questions you want to use · export pinned to CSV when ready
        </p>
      </div>
      <TriviaClient questions={questions} />
    </div>
  );
}
