// Daily Payment Aggregation
export {
  calculateCashCheckTotal,
  calculateCreditCardTotal,
  calculateTotalAmount,
  aggregateDailyPayment,
  getDailyPaymentTotals,
  getFacilityMonthlyTotals,
  getAllFacilitiesMonthlyTotals,
  getFacilityMonthlyTotalsSQL,
  validateDailyPaymentForReconciliation,
} from "./dailyPaymentAggregation";

export type {
  DailyPaymentTotals,
  FacilityMonthlyTotals,
} from "./dailyPaymentAggregation";

// Date Utilities
export {
  getMonthStart,
  getMonthEnd,
  getMonthYear,
  formatDate,
  getMonthName,
  isDateInMonth,
  getDatesInMonth,
  daysBetween,
  isSameDate,
  getCurrentMonthYear,
  getPreviousMonthYear,
  getNextMonthYear,
} from "./dateUtils";

// Automatic Matching
export {
  runAutomaticMatchingForFacility,
  runAutomaticMatchingForAllFacilities,
  getBestMatches,
  getMatchesNeedingReview,
} from "./automaticMatching";

export type {
  PotentialMatch,
  MatchingSummary,
  AutoMatchingResult,
} from "./automaticMatching";

// Manual Matching
export {
  validateManualMatch,
  createManualMatch,
  createPartialMatch,
  createMultiDayMatch,
  unmatchTransaction,
  getMatchesForReconciliation,
} from "./manualMatching";

export type {
  ManualMatchRequest,
  PartialMatchRequest,
  MultiDayMatchRequest,
  MatchValidationResult,
  UnmatchRequest,
} from "./manualMatching";
