"use client";

import { useId, useState } from "react";

import { affordablePrice, paymentBreakdown } from "@/lib/mortgage";

const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const num = (s: string) => {
  const n = Number(s.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

function NumberInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-small font-bold">
        {label}
      </label>
      <div className="mt-1 flex items-center rounded-button border border-ink-500/40 bg-white focus-within:outline focus-within:outline-2 focus-within:outline-teal-700">
        {prefix && <span className="pl-3 text-ink-500" aria-hidden="true">{prefix}</span>}
        <input
          id={id}
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className="w-full min-w-0 bg-transparent px-3 py-3 outline-none"
        />
        {suffix && <span className="pr-3 text-ink-500" aria-hidden="true">{suffix}</span>}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-ink-500">
          {hint}
        </p>
      )}
    </div>
  );
}

/**
 * Two tools on one page: the monthly payment for a price, and the price that
 * fits an income. Everything runs in the browser; nothing is sent anywhere.
 */
export function MortgageCalculator() {
  const [mode, setMode] = useState<"payment" | "afford">("payment");
  const [price, setPrice] = useState("2,000,000");
  const [downPct, setDownPct] = useState("20");
  const [rate, setRate] = useState("6.5");
  const [years, setYears] = useState("30");
  const [tax, setTax] = useState("1.2");
  const [ins, setIns] = useState("2,400");
  const [hoa, setHoa] = useState("0");
  const [income, setIncome] = useState("300,000");
  const [debts, setDebts] = useState("500");
  const [downCash, setDownCash] = useState("400,000");

  const p = paymentBreakdown({
    price: num(price),
    down: (num(price) * Math.min(100, num(downPct))) / 100,
    ratePct: num(rate),
    years: num(years) || 30,
    taxRatePct: num(tax),
    insurancePerYear: num(ins),
    hoaPerMonth: num(hoa),
  });
  const a = affordablePrice({
    incomePerYear: num(income),
    debtsPerMonth: num(debts),
    down: num(downCash),
    ratePct: num(rate),
    years: num(years) || 30,
    taxRatePct: num(tax),
    insurancePerYear: num(ins),
    hoaPerMonth: num(hoa),
  });

  const tab = (m: typeof mode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      aria-pressed={mode === m}
      className={`eyebrow rounded-button px-4 py-2 ${mode === m ? "bg-teal-700 text-white" : "text-teal-700 hover:bg-teal-50"}`}
    >
      {label}
    </button>
  );

  const shared = (
    <>
      <NumberInput label="Interest rate" value={rate} onChange={setRate} suffix="%" hint="An example rate. Ask a lender for today's rate." />
      <NumberInput label="Loan term" value={years} onChange={setYears} suffix="years" />
      <NumberInput label="Property tax" value={tax} onChange={setTax} suffix="%/yr" hint="California bills usually run a little over 1% of the purchase price. Ask us for the exact rate." />
      <NumberInput label="Home insurance" value={ins} onChange={setIns} prefix="$" suffix="/yr" />
      <NumberInput label="HOA dues" value={hoa} onChange={setHoa} prefix="$" suffix="/mo" />
    </>
  );

  return (
    <div className="rounded-card bg-white p-6 shadow-card md:p-8">
      <div className="flex flex-wrap gap-2 rounded-button bg-teal-50 p-1" role="group" aria-label="Calculator">
        {tab("payment", "Monthly payment")}
        {tab("afford", "What can I afford?")}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-4 sm:grid-cols-2">
          {mode === "payment" ? (
            <>
              <div className="sm:col-span-2">
                <NumberInput label="Home price" value={price} onChange={setPrice} prefix="$" />
              </div>
              <NumberInput label="Down payment" value={downPct} onChange={setDownPct} suffix="%" hint={usd((num(price) * Math.min(100, num(downPct))) / 100)} />
            </>
          ) : (
            <>
              <NumberInput label="Household income" value={income} onChange={setIncome} prefix="$" suffix="/yr" hint="Before tax" />
              <NumberInput label="Monthly debts" value={debts} onChange={setDebts} prefix="$" hint="Car, student and card payments" />
              <NumberInput label="Cash for down payment" value={downCash} onChange={setDownCash} prefix="$" />
            </>
          )}
          {shared}
        </div>

        <div aria-live="polite" className="rounded-card bg-teal-700 p-6 text-white">
          {mode === "payment" ? (
            <>
              <p className="eyebrow text-teal-50">Estimated monthly payment</p>
              <p className="mt-1 font-heading text-[44px] leading-tight">{usd(p.total)}</p>
              <dl className="mt-5 grid gap-2 text-white">
                {(
                  [
                    ["Principal and interest", p.pi],
                    ["Property tax", p.tax],
                    ["Insurance", p.insurance],
                    ["HOA", p.hoa],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-white/20 pb-2">
                    <dt>{k}</dt>
                    <dd className="font-bold">{usd(v)}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-sm">
                Loan amount {usd(p.loan)}. Interest over {num(years) || 30} years: {usd(p.totalInterest)}.
              </p>
            </>
          ) : (
            <>
              <p className="eyebrow text-teal-50">You could afford about</p>
              <p className="mt-1 font-heading text-[44px] leading-tight">{usd(a.price)}</p>
              <p className="mt-4">
                That keeps housing at {usd(a.housingBudget)} a month: no more than 28% of your gross income, and all debts under 36%. Lenders
                use their own rules, so treat this as a starting point.
              </p>
            </>
          )}
        </div>
      </div>
      <p className="mt-6 text-xs text-ink-500">
        Estimates only, based on a fully amortized fixed-rate loan. They don&rsquo;t include mortgage insurance, closing costs or
        Mello-Roos. Your lender&rsquo;s quote is what counts.
      </p>
    </div>
  );
}
