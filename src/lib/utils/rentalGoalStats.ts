export interface PredictionInput {
  wma: number;
  seasonalIdx: number;
  /** Pass Infinity if unknown */
  vacantUnits: number;
  /** WMA of historical move-outs — frees up units during the month */
  predictedMoveOuts: number;
}

/**
 * Weighted moving average on the last 3 months (most recent first).
 * Weights: [0.5, 0.3, 0.2]
 */
export function weightedMovingAverage(months: number[]): number {
  const weights = [0.5, 0.3, 0.2];
  const recent = months.slice(0, 3);
  let sum = 0;
  let weightSum = 0;
  for (let i = 0; i < recent.length; i++) {
    sum += recent[i] * weights[i];
    weightSum += weights[i];
  }
  if (weightSum === 0) return 0;
  return Math.round(sum / weightSum);
}

/**
 * For each calendar month 0–11, compute average rentals for that month
 * divided by the overall monthly average.
 * historicalByMonth: array of years, each year is 12 monthly rental counts.
 */
export function seasonalIndex(historicalByMonth: number[][]): number[] {
  const monthSums = Array(12).fill(0);
  const monthCounts = Array(12).fill(0);

  for (const yearData of historicalByMonth) {
    for (let m = 0; m < 12; m++) {
      if (yearData[m] !== undefined && yearData[m] !== null) {
        monthSums[m] += yearData[m];
        monthCounts[m] += 1;
      }
    }
  }

  const monthAvgs = monthSums.map((sum, m) =>
    monthCounts[m] > 0 ? sum / monthCounts[m] : 0
  );

  const totalAvg =
    monthAvgs.reduce((a, b) => a + b, 0) / monthAvgs.filter((v) => v > 0).length || 1;

  return monthAvgs.map((avg) => (totalAvg > 0 ? avg / totalAvg : 1));
}

/**
 * Predict rentals using WMA × seasonal index.
 * Cap at vacantUnits + predictedMoveOuts: move-outs free up units during
 * the month, so current vacancy understates available capacity.
 * If vacantUnits is Infinity (unknown), returns raw prediction unclamped.
 */
export function predictRentals({
  wma,
  seasonalIdx,
  vacantUnits,
  predictedMoveOuts,
}: PredictionInput): number {
  const raw = Math.round(wma * seasonalIdx);
  if (isFinite(vacantUnits)) {
    return Math.min(raw, vacantUnits + predictedMoveOuts);
  }
  return raw;
}

/**
 * Classify trend by comparing last 3-month avg to prior 3-month avg.
 */
export function classifyTrend(months: number[]): "up" | "down" | "stable" {
  if (months.length < 6) return "stable";
  const last3 = months.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  const prior3 = months.slice(3, 6).reduce((a, b) => a + b, 0) / 3;
  if (last3 > prior3 * 1.05) return "up";
  if (last3 < prior3 * 0.95) return "down";
  return "stable";
}
