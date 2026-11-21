import { describe, expect, it } from "vitest";

import { affordablePrice, loanForPayment, monthlyPI, paymentBreakdown } from "@/lib/mortgage";

describe("monthlyPI", () => {
  it("matches the standard amortization formula", () => {
    // $400,000 at 6% for 30 years is $2,398.20 a month.
    expect(monthlyPI(400_000, 6, 30)).toBeCloseTo(2398.2, 1);
  });
  it("handles a zero rate and an empty loan", () => {
    expect(monthlyPI(360_000, 0, 30)).toBeCloseTo(1000, 6);
    expect(monthlyPI(0, 6, 30)).toBe(0);
  });
  it("is the inverse of loanForPayment", () => {
    expect(loanForPayment(monthlyPI(1_250_000, 6.75, 30), 6.75, 30)).toBeCloseTo(1_250_000, 2);
  });
});

describe("paymentBreakdown", () => {
  it("adds tax, insurance and HOA to principal and interest", () => {
    const b = paymentBreakdown({ price: 2_000_000, down: 400_000, ratePct: 6, years: 30, taxRatePct: 1.2, insurancePerYear: 2400, hoaPerMonth: 100 });
    expect(b.loan).toBe(1_600_000);
    expect(b.tax).toBeCloseTo(2000, 6);
    expect(b.insurance).toBeCloseTo(200, 6);
    expect(b.total).toBeCloseTo(b.pi + 2000 + 200 + 100, 6);
  });
});

describe("affordablePrice", () => {
  it("spends exactly the housing budget at the price it returns", () => {
    const input = { incomePerYear: 300_000, debtsPerMonth: 500, down: 300_000, ratePct: 6.5, years: 30, taxRatePct: 1.2, insurancePerYear: 2000, hoaPerMonth: 0 };
    const { price, housingBudget } = affordablePrice(input);
    const b = paymentBreakdown({ price, down: input.down, ratePct: input.ratePct, years: input.years, taxRatePct: input.taxRatePct, insurancePerYear: input.insurancePerYear, hoaPerMonth: 0 });
    expect(housingBudget).toBeCloseTo(7000, 6); // min(28% of 25,000, 36% of 25,000 − 500)
    expect(b.total).toBeCloseTo(housingBudget, 0);
  });
  it("never goes below the down payment", () => {
    expect(affordablePrice({ incomePerYear: 0, debtsPerMonth: 0, down: 50_000, ratePct: 6, years: 30, taxRatePct: 1, insurancePerYear: 0, hoaPerMonth: 0 }).price).toBe(50_000);
  });
});
