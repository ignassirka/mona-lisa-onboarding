import { useState } from "react";
import { motion } from "motion/react";
import { CreditCard, Wallet, Bitcoin, Smartphone, Info, Shield, Clock, ChevronDown, Gift, X } from "lucide-react";
import Spinner from "../Spinner";
import { CHECKOUT_COPY } from "../../lib/checkoutCopy";
import { CHECKOUT_PLANS, amountDue, taxAmount, renewalSentence, CREDITS_USD, type CheckoutPlanId } from "../../lib/checkoutPlans";

type PaymentMethodId = "card" | "paypal" | "bitcoin" | "googlePay";

const PAYMENT_METHODS: { id: PaymentMethodId; icon: typeof CreditCard }[] = [
  { id: "card", icon: CreditCard },
  { id: "paypal", icon: Wallet },
  { id: "bitcoin", icon: Bitcoin },
  { id: "googlePay", icon: Smartphone },
];

const money = (n: number) => `US$${n.toFixed(2)}`;

interface CheckoutPageProps {
  billingCountry: string;
  processing: boolean;
  onPay: () => void;
}

/** The embedded "Review subscription and pay" page — a self-contained
 * prototype checkout (real Proton_files contents turned out to be Chargebee/
 * Stripe/hCaptcha payment-processor iframes with no visual checkout UI to
 * reuse; see the Phase 0 discovery — this is built fresh, matching the
 * provided screenshot's copy and numbers exactly, per `checkoutPlans.ts`).
 * Card fields take no validation; "Pay" always succeeds (happy path only). */
export default function CheckoutPage({ billingCountry, processing, onPay }: CheckoutPageProps) {
  const [planId, setPlanId] = useState<CheckoutPlanId>("24mo");
  const [method, setMethod] = useState<PaymentMethodId>("card");
  const [whatDoIGetOpen, setWhatDoIGetOpen] = useState(false);

  const plan = CHECKOUT_PLANS.find((p) => p.id === planId)!;
  const due = amountDue(plan);
  const tax = taxAmount(plan);

  return (
    <div className="mx-auto max-w-[820px] px-[28px] py-[28px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-['Inter',sans-serif] text-[22px] font-semibold leading-[28px] text-[#0c0c14]">
            {CHECKOUT_COPY.page.heading}
          </h1>
          <p className="mt-[2px] font-['Inter',sans-serif] text-[13px] leading-[18px] text-[#6b6a70]">
            you@protonmail.com
          </p>
        </div>
        {/* Decorative close — happy path only, no cancel/abandon handling. */}
        <span aria-hidden="true" className="cursor-default text-[#8f8d8a]">
          <X size={18} strokeWidth={2} />
        </span>
      </div>

      <div className="mt-[24px] flex gap-[24px]">
        {/* ── Left column ── */}
        <div className="min-w-0 flex-1">
          <h2 className="font-['Inter',sans-serif] text-[15px] font-semibold leading-[20px] text-[#0c0c14]">
            {CHECKOUT_COPY.page.subscriptionOptionsHeading}
          </h2>
          <div className="mt-[10px] flex flex-col gap-[8px]">
            {CHECKOUT_PLANS.map((p) => {
              const selected = p.id === planId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlanId(p.id)}
                  className={`flex items-center justify-between rounded-[8px] border px-[14px] py-[11px] text-left transition-colors ${
                    selected ? "border-[#6d4aff] bg-[rgba(109,74,255,0.04)]" : "border-[#e3e2e5] hover:border-[#c9c7cc]"
                  }`}
                >
                  <div className="flex items-center gap-[10px]">
                    <span
                      className={`flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full border-2 ${
                        selected ? "border-[#6d4aff]" : "border-[#c9c7cc]"
                      }`}
                    >
                      {selected && <span className="h-[7px] w-[7px] rounded-full bg-[#6d4aff]" />}
                    </span>
                    <span className="font-['Inter',sans-serif] text-[14px] font-semibold leading-[18px] text-[#0c0c14]">
                      {p.label}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-[1px]">
                    <span className="font-['Inter',sans-serif] text-[13px] font-semibold leading-[16px] text-[#6d4aff]">
                      For {money(p.totalPrice)}
                    </span>
                    <span className="font-['Inter',sans-serif] text-[12px] leading-[15px] text-[#6b6a70]">
                      US${p.monthlyPrice.toFixed(2)} /month
                    </span>
                    {p.saveAmount !== null && (
                      <span className="font-['Inter',sans-serif] text-[12px] font-semibold leading-[15px] text-[#1a9c6b]">
                        Save {money(p.saveAmount)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <h2 className="mt-[24px] font-['Inter',sans-serif] text-[15px] font-semibold leading-[20px] text-[#0c0c14]">
            {CHECKOUT_COPY.page.paymentDetailsHeading}
          </h2>
          <div className="mt-[10px] flex flex-col gap-[6px]">
            {PAYMENT_METHODS.map(({ id, icon: Icon }) => {
              const selected = id === method;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMethod(id)}
                  className="flex items-center gap-[10px] py-[3px] text-left"
                >
                  <span
                    className={`flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full border-2 ${
                      selected ? "border-[#6d4aff]" : "border-[#c9c7cc]"
                    }`}
                  >
                    {selected && <span className="h-[7px] w-[7px] rounded-full bg-[#6d4aff]" />}
                  </span>
                  <Icon size={16} strokeWidth={2} className="text-[#6b6a70]" aria-hidden="true" />
                  <span className="font-['Inter',sans-serif] text-[14px] leading-[18px] text-[#0c0c14]">
                    {CHECKOUT_COPY.page.paymentMethods[id]}
                  </span>
                </button>
              );
            })}
          </div>

          {method === "card" && (
            <>
              <h2 className="mt-[20px] font-['Inter',sans-serif] text-[15px] font-semibold leading-[20px] text-[#0c0c14]">
                {CHECKOUT_COPY.page.cardDetailsHeading}
              </h2>
              <div className="mt-[10px] flex flex-col gap-[8px]">
                <input
                  type="text"
                  placeholder={CHECKOUT_COPY.page.cardNumberPlaceholder}
                  className="h-[38px] rounded-[6px] border border-[#d1cfcd] px-[12px] font-['Inter',sans-serif] text-[13px] text-[#0c0c14] outline-none placeholder:text-[#8f8d8a] focus:border-[#6d4aff]"
                />
                <div className="flex gap-[8px]">
                  <input
                    type="text"
                    placeholder={CHECKOUT_COPY.page.cardExpiryPlaceholder}
                    className="h-[38px] flex-1 rounded-[6px] border border-[#d1cfcd] px-[12px] font-['Inter',sans-serif] text-[13px] text-[#0c0c14] outline-none placeholder:text-[#8f8d8a] focus:border-[#6d4aff]"
                  />
                  <input
                    type="text"
                    placeholder={CHECKOUT_COPY.page.cardCvcPlaceholder}
                    className="h-[38px] flex-1 rounded-[6px] border border-[#d1cfcd] px-[12px] font-['Inter',sans-serif] text-[13px] text-[#0c0c14] outline-none placeholder:text-[#8f8d8a] focus:border-[#6d4aff]"
                  />
                </div>
              </div>
            </>
          )}

          <p className="mt-[16px] font-['Inter',sans-serif] text-[13px] leading-[18px] text-[#0c0c14]">
            <span className="font-semibold">{CHECKOUT_COPY.page.billingCountryLabel}</span>{" "}
            <span className="text-[#6d4aff] underline">{billingCountry}</span>
          </p>

          <p className="mt-[16px] text-center font-['Inter',sans-serif] text-[12px] leading-[16px] text-[#8f8d8a]">
            {CHECKOUT_COPY.page.threeDSecureNote}
          </p>
          <div className="mt-[6px] flex items-center justify-center gap-[8px] font-['Inter',sans-serif] text-[10px] font-semibold text-[#8f8d8a]">
            <span className="rounded-[3px] border border-[#e3e2e5] px-[6px] py-[3px]">VISA</span>
            <span className="rounded-[3px] border border-[#e3e2e5] px-[6px] py-[3px]">Mastercard</span>
            <span className="rounded-[3px] border border-[#e3e2e5] px-[6px] py-[3px]">Discover</span>
            <span className="rounded-[3px] border border-[#e3e2e5] px-[6px] py-[3px]">JCB</span>
          </div>

          {/* Decorative — leaving checkout is out of scope (happy path only). */}
          <button
            type="button"
            aria-hidden="true"
            className="mt-[20px] cursor-default rounded-[6px] border border-[#d1cfcd] px-[16px] py-[8px] font-['Inter',sans-serif] text-[13px] font-semibold text-[#0c0c14]"
          >
            {CHECKOUT_COPY.page.backButton}
          </button>
        </div>

        {/* ── Right — Summary panel ── */}
        <div className="w-[280px] shrink-0 rounded-[10px] bg-[#eeedf1] p-[18px]">
          <div className="flex items-center justify-between">
            <h2 className="font-['Inter',sans-serif] text-[15px] font-semibold leading-[20px] text-[#0c0c14]">
              {CHECKOUT_COPY.summary.heading}
            </h2>
            <span className="rounded-[5px] border border-[#d1cfcd] bg-white px-[8px] py-[3px] font-['Inter',sans-serif] text-[11px] font-semibold text-[#6b6a70]">
              {CHECKOUT_COPY.summary.currency}
            </span>
          </div>

          <div className="mt-[12px] flex items-center gap-[8px]">
            <span className="font-['Inter',sans-serif] text-[14px] font-semibold leading-[18px] text-[#0c0c14]">
              {CHECKOUT_COPY.summary.planName}
            </span>
            {plan.savePercent !== null && (
              <span className="rounded-full bg-[#1a9c6b] px-[7px] py-[1px] font-['Inter',sans-serif] text-[11px] font-semibold text-white">
                -{plan.savePercent}%
              </span>
            )}
          </div>
          <p className="mt-[1px] font-['Inter',sans-serif] text-[12px] leading-[16px] text-[#8f8d8a]">
            {plan.termSummaryLabel}
          </p>

          <div className="mt-[10px] flex items-center justify-between font-['Inter',sans-serif] text-[13px] leading-[18px] text-[#0c0c14]">
            <span>{CHECKOUT_COPY.summary.usersLabel}</span>
            <span>US${plan.monthlyPrice.toFixed(2)} /month</span>
          </div>

          <div className="my-[12px] h-px bg-[#d9d8dc]" />

          <div className="flex items-center justify-between font-['Inter',sans-serif] text-[13px] font-semibold leading-[18px] text-[#0c0c14]">
            <span>
              {CHECKOUT_COPY.summary.totalLabelPrefix} {plan.label}
            </span>
            <span>{money(plan.totalPrice)}</span>
          </div>
          <div className="mt-[6px] flex items-center justify-between font-['Inter',sans-serif] text-[13px] leading-[18px] text-[#0c0c14]">
            <span>{CHECKOUT_COPY.summary.creditsLabel}</span>
            <span>-US${CREDITS_USD}</span>
          </div>

          <div className="my-[12px] h-px bg-[#d9d8dc]" />

          <div className="flex items-center justify-between font-['Inter',sans-serif] text-[15px] font-semibold leading-[20px] text-[#0c0c14]">
            <span>{CHECKOUT_COPY.summary.amountDueLabel}</span>
            <span>{money(due)}</span>
          </div>

          <button
            type="button"
            onClick={onPay}
            disabled={processing}
            className="mt-[14px] flex h-[40px] w-full items-center justify-center gap-[8px] rounded-[6px] bg-[#6d4aff] font-['Inter',sans-serif] text-[14px] font-semibold text-white transition-colors hover:bg-[#7c5cff] disabled:cursor-default disabled:opacity-70"
          >
            {processing ? (
              <>
                <Spinner size={16} />
                {CHECKOUT_COPY.summary.processingLabel}
              </>
            ) : (
              <>
                {CHECKOUT_COPY.summary.payButtonPrefix} {money(due)} {CHECKOUT_COPY.summary.payButtonSuffix}
              </>
            )}
          </button>
          <p className="mt-[8px] text-center font-['Inter',sans-serif] text-[11px] leading-[14px] text-[#8f8d8a]">
            {CHECKOUT_COPY.summary.taxNotePrefix} {(tax > 0 ? 21 : 0)}% {CHECKOUT_COPY.summary.taxNoteMiddle} {money(tax)}
          </p>

          <button
            type="button"
            aria-hidden="true"
            className="mt-[12px] flex cursor-default items-center gap-[5px] font-['Inter',sans-serif] text-[12px] font-semibold text-[#6d4aff] underline"
          >
            <Gift size={13} strokeWidth={2} />
            {CHECKOUT_COPY.summary.giftCodeLabel}
          </button>

          <div className="my-[14px] h-px bg-[#d9d8dc]" />

          <div className="flex flex-col gap-[10px]">
            <div className="flex items-start gap-[7px] font-['Inter',sans-serif] text-[11px] leading-[15px] text-[#6b6a70]">
              <Info size={13} strokeWidth={2} className="mt-[1px] shrink-0" />
              <span>
                {renewalSentence(plan)}{" "}
                <span className="cursor-default underline">{CHECKOUT_COPY.summary.termsLinkText}</span>.
              </span>
            </div>
            <div className="flex items-start gap-[7px] font-['Inter',sans-serif] text-[11px] leading-[15px] text-[#6b6a70]">
              <Shield size={13} strokeWidth={2} className="mt-[1px] shrink-0" />
              <span>{CHECKOUT_COPY.summary.trustTls}</span>
            </div>
            <div className="flex items-start gap-[7px] font-['Inter',sans-serif] text-[11px] leading-[15px] text-[#6b6a70]">
              <Clock size={13} strokeWidth={2} className="mt-[1px] shrink-0" />
              <span>{CHECKOUT_COPY.summary.trustGuarantee}</span>
            </div>
          </div>

          <div className="my-[14px] h-px bg-[#d9d8dc]" />

          <button
            type="button"
            onClick={() => setWhatDoIGetOpen((o) => !o)}
            className="flex w-full items-center justify-between font-['Inter',sans-serif] text-[13px] font-semibold text-[#0c0c14]"
          >
            {CHECKOUT_COPY.summary.whatDoIGet}
            <motion.span animate={{ rotate: whatDoIGetOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={16} strokeWidth={2} />
            </motion.span>
          </button>
          {whatDoIGetOpen && (
            <motion.ul
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.2 }}
              className="mt-[8px] flex flex-col gap-[5px] overflow-hidden"
            >
              {CHECKOUT_COPY.summary.whatDoIGetItems.map((item) => (
                <li
                  key={item}
                  className="font-['Inter',sans-serif] text-[12px] leading-[16px] text-[#6b6a70]"
                >
                  • {item}
                </li>
              ))}
            </motion.ul>
          )}
        </div>
      </div>
    </div>
  );
}
