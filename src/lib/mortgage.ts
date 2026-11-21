/**
 * Mortgage arithmetic for the calculator page. Fully amortized, fixed rate,
 * monthly payments. All money in dollars, rates as percentages (6.5 = 6.5%).
 */

/** Monthly principal and interest on `loan` at `ratePct` for `years`. */
export function monthlyPI(loan: number, ratePct: number, years: number): number {
  const n = Math.round(years * 12);
  if (loan <= 0 || n <= 0) return 0;
  const r = ratePct / 100 / 12;
  if (r === 0) return loan / n;
  return (loan * r) / (1 - Math.pow(1 + r, -n));
}

/** Largest loan whose monthly principal and interest is `payment`. */
export function loanForPayment(payment: number, ratePct: number, years: number): number {
  const n = Math.round(years * 12);
  if (payment <= 0 || n <= 0) return 0;
  const r = ratePct / 100 / 12;
  if (r === 0) return payment * n;
  return (payment * (1 - Math.pow(1 + r, -n))) / r;
}

export type PaymentInput = {
  price: number;
  down: number; // dollars
  ratePct: number;
  years: number;
  taxRatePct: number; // annual, of price
  insurancePerYear: number;
  hoaPerMonth: number;
};

export function paymentBreakdown(i: PaymentInput) {
  const loan = Math.max(0, i.price - i.down);
  const pi = monthlyPI(loan, i.ratePct, i.years);
  const tax = (i.price * i.taxRatePct) / 100 / 12;
  const insurance = i.insurancePerYear / 12;
  const hoa = i.hoaPerMonth;
  const total = pi + tax + insurance + hoa;
  const totalInterest = pi * Math.round(i.years * 12) - loan;
  return { loan, pi, tax, insurance, hoa, total, totalInterest: Math.max(0, totalInterest) };
}

export type AffordInput = {
  incomePerYear: number;
  debtsPerMonth: number;
  down: number;
  ratePct: number;
  years: number;
  taxRatePct: number;
  insurancePerYear: number;
  hoaPerMonth: number;
  /** Housing cost cap as a share of gross monthly income (front-end ratio). */
  frontPct?: number;
  /** All debts including housing as a share of income (back-end ratio). */
  backPct?: number;
};

/**
 * Price the buyer can afford under the common 28% / 36% rule of thumb. Tax
 * depends on price, so solve price = loan(P&I budget) + down where the P&I
 * budget = housing budget − tax(price) − insurance − HOA. That is linear in
 * price, so a few fixed-point iterations converge.
 */
export function affordablePrice(i: AffordInput) {
  const monthly = i.incomePerYear / 12;
  const housing = Math.max(0, Math.min(monthly * (i.frontPct ?? 28) / 100, monthly * (i.backPct ?? 36) / 100 - i.debtsPerMonth));
  let price = i.down;
  for (let k = 0; k < 50; k++) {
    const tax = (price * i.taxRatePct) / 100 / 12;
    const piBudget = housing - tax - i.insurancePerYear / 12 - i.hoaPerMonth;
    const next = Math.max(0, loanForPayment(Math.max(0, piBudget), i.ratePct, i.years)) + i.down;
    if (Math.abs(next - price) < 1) {
      price = next;
      break;
    }
    price = next;
  }
  return { price: Math.max(i.down, price), housingBudget: housing };
}
