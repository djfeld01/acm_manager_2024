import { describe, it, expect } from "vitest";
import {
  calculateCashCheckTotal,
  calculateCreditCardTotal,
  calculateTotalAmount,
  aggregateDailyPayment,
  validateDailyPaymentForReconciliation,
} from "../dailyPaymentAggregation";

// Mock daily payment data
const mockDailyPayment = {
  Id: 1,
  facilityId: "FAC001",
  date: "2024-09-15",
  cash: 150.5,
  check: 75.25,
  visa: 200.0,
  mastercard: 125.75,
  americanExpress: 50.0,
  discover: 25.5,
  ach: 100.0,
  dinersClub: 10.0,
  debit: 75.0,
  cashCheckCommitted: true,
  creditCardCommitted: true,
};

const mockEmptyPayment = {
  Id: 2,
  facilityId: "FAC002",
  date: "2024-09-16",
  cash: null,
  check: null,
  visa: null,
  mastercard: null,
  americanExpress: null,
  discover: null,
  ach: null,
  dinersClub: null,
  debit: null,
  cashCheckCommitted: false,
  creditCardCommitted: false,
};

describe("Daily Payment Aggregation", () => {
  describe("calculateCashCheckTotal", () => {
    it("should calculate cash + check total correctly", () => {
      const result = calculateCashCheckTotal(mockDailyPayment);
      expect(result).toBe(225.75); // 150.50 + 75.25
    });

    it("should handle null values", () => {
      const result = calculateCashCheckTotal(mockEmptyPayment);
      expect(result).toBe(0);
    });

    it("should handle partial null values", () => {
      const partialPayment = { ...mockDailyPayment, cash: null };
      const result = calculateCashCheckTotal(partialPayment);
      expect(result).toBe(75.25); // 0 + 75.25
    });
  });

  describe("calculateCreditCardTotal", () => {
    it("should calculate all credit card totals correctly", () => {
      const result = calculateCreditCardTotal(mockDailyPayment);
      expect(result).toBe(586.25); // 200 + 125.75 + 50 + 25.50 + 100 + 10 + 75
    });

    it("should handle null values", () => {
      const result = calculateCreditCardTotal(mockEmptyPayment);
      expect(result).toBe(0);
    });

    it("should handle partial null values", () => {
      const partialPayment = {
        ...mockDailyPayment,
        visa: null,
        mastercard: null,
      };
      const result = calculateCreditCardTotal(partialPayment);
      expect(result).toBe(260.5); // 50 + 25.50 + 100 + 10 + 75
    });
  });

  describe("calculateTotalAmount", () => {
    it("should calculate total amount correctly", () => {
      const result = calculateTotalAmount(mockDailyPayment);
      expect(result).toBe(812.0); // 225.75 + 586.25
    });

    it("should handle empty payment", () => {
      const result = calculateTotalAmount(mockEmptyPayment);
      expect(result).toBe(0);
    });
  });

  describe("aggregateDailyPayment", () => {
    it("should aggregate daily payment correctly", () => {
      const result = aggregateDailyPayment(mockDailyPayment);

      expect(result).toEqual({
        facilityId: "FAC001",
        date: "2024-09-15",
        cashCheckTotal: 225.75,
        creditCardTotal: 586.25,
        totalAmount: 812.0,
        cashCheckCommitted: true,
        creditCardCommitted: true,
      });
    });

    it("should handle empty payment", () => {
      const result = aggregateDailyPayment(mockEmptyPayment);

      expect(result).toEqual({
        facilityId: "FAC002",
        date: "2024-09-16",
        cashCheckTotal: 0,
        creditCardTotal: 0,
        totalAmount: 0,
        cashCheckCommitted: false,
        creditCardCommitted: false,
      });
    });
  });

  describe("validateDailyPaymentForReconciliation", () => {
    it("should validate correct payment", () => {
      const result = validateDailyPaymentForReconciliation(mockDailyPayment);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it("should detect missing required fields", () => {
      const invalidPayment = { ...mockDailyPayment, facilityId: "", date: "" };
      const result = validateDailyPaymentForReconciliation(invalidPayment);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Missing facility ID");
      expect(result.errors).toContain("Missing date");
    });

    it("should detect negative amounts", () => {
      const negativePayment = {
        ...mockDailyPayment,
        cash: -50.0,
        visa: -100.0,
      };
      const result = validateDailyPaymentForReconciliation(negativePayment);

      expect(result.isValid).toBe(true); // Warnings don't make it invalid
      expect(result.warnings).toContain("Negative amount in cash: -50");
      expect(result.warnings).toContain("Negative amount in visa: -100");
    });

    it("should detect zero amounts", () => {
      const result = validateDailyPaymentForReconciliation(mockEmptyPayment);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain("All payment amounts are zero");
    });

    it("should detect uncommitted amounts", () => {
      const uncommittedPayment = {
        ...mockDailyPayment,
        cashCheckCommitted: false,
        creditCardCommitted: false,
      };
      const result = validateDailyPaymentForReconciliation(uncommittedPayment);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain("Cash/check amounts not committed");
      expect(result.warnings).toContain("Credit card amounts not committed");
    });
  });

  describe("Edge Cases", () => {
    it("should handle very small amounts correctly", () => {
      const smallAmountPayment = {
        ...mockDailyPayment,
        cash: 0.01,
        check: 0.02,
        visa: 0.03,
      };

      const cashCheckTotal = calculateCashCheckTotal(smallAmountPayment);
      const creditCardTotal = calculateCreditCardTotal(smallAmountPayment);

      expect(cashCheckTotal).toBe(0.03);
      expect(creditCardTotal).toBe(0.03); // Only visa has value
    });

    it("should handle large amounts correctly", () => {
      const largeAmountPayment = {
        ...mockDailyPayment,
        cash: 999999.99,
        visa: 888888.88,
      };

      const cashCheckTotal = calculateCashCheckTotal(largeAmountPayment);
      const creditCardTotal = calculateCreditCardTotal(largeAmountPayment);

      expect(cashCheckTotal).toBe(1000075.24); // 999999.99 + 75.25
      expect(creditCardTotal).toBe(1175013.13); // 888888.88 + other cards
    });

    it("should handle floating point precision", () => {
      const precisionPayment = {
        ...mockDailyPayment,
        cash: 10.1,
        check: 20.2,
        visa: 30.3,
      };

      const cashCheckTotal = calculateCashCheckTotal(precisionPayment);
      expect(cashCheckTotal).toBe(30.3); // Should handle floating point correctly
    });
  });
});
