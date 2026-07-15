import { motion } from "motion/react";
import { Check } from "lucide-react";
import { CHECKOUT_COPY } from "../../lib/checkoutCopy";
import { CHECKOUT_TIMING, sec } from "./checkoutTiming";

/** Replaces the checkout page's content once "Pay" succeeds (happy path
 * only — no failure state exists in this prototype). Light-themed to match
 * the rest of the simulated browser page. */
export default function CheckoutSuccess() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: sec(CHECKOUT_TIMING.successFadeDuration) }}
      className="flex h-full min-h-[420px] flex-col items-center justify-center gap-[16px] px-[40px] text-center"
    >
      <span className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[rgba(26,156,107,0.12)] text-[#1a9c6b]">
        <Check size={28} strokeWidth={3} />
      </span>
      <h1 className="font-['Inter',sans-serif] text-[22px] font-semibold leading-[28px] text-[#0c0c14]">
        {CHECKOUT_COPY.success.heading}
      </h1>
      <p className="max-w-[360px] font-['Inter',sans-serif] text-[14px] leading-[20px] text-[#6b6a70]">
        {CHECKOUT_COPY.success.returnLine}
      </p>
    </motion.div>
  );
}
