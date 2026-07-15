/**
 * Simulated web-checkout pricing — plan facts + derived summary values.
 *
 * FACTS (from the provided "Review subscription and pay" screenshot, 24-month
 * plan): total US$119.76 (US$4.99/mo), badge -50%, "Save US$120"; Credits
 * -US$1; Amount due US$118.76; tax note "Including 21% tax: US$20.78";
 * renewal: renews after the term, then billed every 12 months at US$83.88.
 * 12mo/1mo monthly rates (US$6.99, US$9.99) and 12mo total (US$83.88) are also
 * screenshot facts. Every other number below is DERIVED from those facts via
 * the formulas documented per-field — nothing is invented.
 */

export type CheckoutPlanId = "24mo" | "12mo" | "1mo";

export interface CheckoutPlan {
  id: CheckoutPlanId;
  /** "24 months" */
  label: string;
  /** Term length in months — also the "renews on" offset from today. */
  termMonths: number;
  /** How the summary panel's second line describes the term ("2 years"). */
  termSummaryLabel: string;
  /** US$/month rate shown on the plan card and in the summary's "1 user" row. */
  monthlyPrice: number;
  /** Full price for the whole term ("For US$119.76"). */
  totalPrice: number;
  /** US$ saved vs. paying the US$9.99 anchor monthly rate for the same term
   * (anchorMonthly * termMonths - totalPrice). Omitted (no "Save" line) when
   * the plan doesn't undercut the anchor rate (1 month). */
  saveAmount: number | null;
  /** Rounded % discount vs. the US$9.99 anchor *monthly* rate — drives the
   * Summary panel's green "-50%" badge. Omitted alongside saveAmount. */
  savePercent: number | null;
  /** Months between renewal charges once the plan recurs (12mo and 24mo both
   * settle into a 12-month renewal cycle per the screenshot; 1mo renews
   * monthly). */
  renewalCycleMonths: number;
  /** US$ charged at each renewal. */
  renewalPrice: number;
}

const ANCHOR_MONTHLY = 9.99; // the 1-month rate — the reference every "Save" figure is measured against

/** VAT-inclusive tax baked into the displayed total, screenshot-verified at
 * 21%: tax = total * 0.21 / 1.21 (checks out: 119.76 * 0.21/1.21 = 20.78). */
const TAX_RATE = 0.21;

const round2 = (n: number) => Math.round(n * 100) / 100;

function buildPlan(input: {
  id: CheckoutPlanId;
  label: string;
  termMonths: number;
  termSummaryLabel: string;
  monthlyPrice: number;
  totalPrice: number;
  renewalCycleMonths: number;
  renewalPrice: number;
}): CheckoutPlan {
  const anchorTotal = ANCHOR_MONTHLY * input.termMonths;
  const saveAmount = round2(anchorTotal - input.totalPrice);
  const savePercent = Math.round(((ANCHOR_MONTHLY - input.monthlyPrice) / ANCHOR_MONTHLY) * 100);
  return {
    ...input,
    saveAmount: saveAmount > 0 ? saveAmount : null,
    savePercent: savePercent > 0 ? savePercent : null,
  };
}

/** Amount due = plan total − US$1 credits (screenshot fact, applied to every plan). */
export const CREDITS_USD = 1;

export const CHECKOUT_PLANS: CheckoutPlan[] = [
  buildPlan({
    id: "24mo",
    label: "24 months",
    termMonths: 24,
    termSummaryLabel: "2 years",
    monthlyPrice: 4.99,
    totalPrice: 119.76, // 4.99 * 24, screenshot fact
    renewalCycleMonths: 12,
    renewalPrice: 83.88,
  }),
  buildPlan({
    id: "12mo",
    label: "12 months",
    termMonths: 12,
    termSummaryLabel: "1 year",
    monthlyPrice: 6.99,
    totalPrice: 83.88, // 6.99 * 12, screenshot fact
    renewalCycleMonths: 12,
    renewalPrice: 83.88,
  }),
  buildPlan({
    id: "1mo",
    label: "1 month",
    termMonths: 1,
    termSummaryLabel: "1 month",
    monthlyPrice: 9.99,
    totalPrice: 9.99, // screenshot fact
    renewalCycleMonths: 1,
    renewalPrice: 9.99,
  }),
];

export function amountDue(plan: CheckoutPlan): number {
  return round2(plan.totalPrice - CREDITS_USD);
}

/** VAT-inclusive tax already baked into `totalPrice` (informational line only,
 * doesn't change what's charged). */
export function taxAmount(plan: CheckoutPlan): number {
  return round2((plan.totalPrice * TAX_RATE) / (1 + TAX_RATE));
}

const ORDINAL = (day: number): string => {
  if (day % 10 === 1 && day !== 11) return "st";
  if (day % 10 === 2 && day !== 12) return "nd";
  if (day % 10 === 3 && day !== 13) return "rd";
  return "th";
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "July 15th, 2028" — computed from the real current date + the plan's term,
 * so this stays correct regardless of when the prototype is run (not a
 * hardcoded date). */
export function formatRenewalDate(monthsFromNow: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsFromNow);
  const day = d.getDate();
  return `${MONTHS[d.getMonth()]} ${day}${ORDINAL(day)}, ${d.getFullYear()}`;
}

/** The renewal sentence shown under the Pay button, following the
 * screenshot's own structure: if the term and the ongoing renewal cycle
 * differ (24mo → settles into 12-month renewals), name both; if they match
 * (12mo, 1mo — the plan already renews on its own cadence), state it once.
 * Returned WITHOUT the trailing "according to terms and conditions" clause —
 * the caller renders that separately as its own (decorative) link, matching
 * the screenshot's underlined link treatment. */
export function renewalSentence(plan: CheckoutPlan): string {
  const date = formatRenewalDate(plan.termMonths);
  if (plan.termMonths !== plan.renewalCycleMonths) {
    return `Your subscription will automatically renew on ${date}. You'll then be billed every ${plan.renewalCycleMonths} months at US$${plan.renewalPrice.toFixed(2)}. You can cancel at any time. Renewal pricing subject to change according to`;
  }
  const cadence = plan.renewalCycleMonths === 1 ? "month" : "year";
  return `Your subscription will automatically renew on ${date} at US$${plan.renewalPrice.toFixed(2)} per ${cadence}. You can cancel at any time. Renewal pricing subject to change according to`;
}
