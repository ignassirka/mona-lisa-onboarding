import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import VPNPlusUpsell from "../VPNPlusUpsell";
import BrowserWindowChrome from "./BrowserWindowChrome";
import CheckoutPage from "./CheckoutPage";
import CheckoutSuccess from "./CheckoutSuccess";
import { useReducedMotion } from "../../versions/lib/useReducedMotion";
import { CHECKOUT_COPY } from "../../lib/checkoutCopy";
import { CHECKOUT_TIMING } from "./checkoutTiming";
import type { JTBDKey } from "../../lib/jtbdTuningResult";

interface SimulatedWebCheckoutProps {
  jtbdKey: JTBDKey;
  billingCountry: string;
  /** Fires once the browser's exit animation completes, AFTER a successful
   * payment and the user's click on the app behind — resumes the EXISTING
   * "Completing checkout…" loader → "Welcome to VPN Plus" (both unchanged). */
  onReturnToApp: () => void;
}

const noop = () => {};

/** Stage-3 web-checkout simulation, slotted between the upsell CTA and the
 * existing checkout loader. Shows the upsell screen dimmed behind (still
 * "there", per the Scope Lock — not unmounted) with a Chrome-style browser
 * window on top containing the checkout page. Happy path only: pre-success
 * clicks on the app behind do nothing; window controls are decorative. */
export default function SimulatedWebCheckout({ jtbdKey, billingCountry, onReturnToApp }: SimulatedWebCheckoutProps) {
  const reduced = useReducedMotion();
  const [pageLoading, setPageLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [returning, setReturning] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // The browser "loads" the page for a beat before the actual checkout
  // content appears — same simulated-navigation convention as a real
  // browser, regardless of reduced motion (this is a page-load delay, not a
  // decorative animation preference).
  useEffect(() => {
    const t = window.setTimeout(() => setPageLoading(false), CHECKOUT_TIMING.pageLoadDuration);
    timers.current.push(t);
    return () => window.clearTimeout(t);
  }, []);

  const handlePay = () => {
    setProcessing(true);
    timers.current.push(
      window.setTimeout(() => {
        setProcessing(false);
        setSuccess(true);
      }, CHECKOUT_TIMING.payProcessingDuration),
    );
  };

  const handleReturnClick = () => {
    if (!success || returning) return;
    setReturning(true);
    timers.current.push(window.setTimeout(onReturnToApp, reduced ? 0 : CHECKOUT_TIMING.windowExitDuration));
  };

  return (
    <div className="isolate absolute inset-0 overflow-hidden">
      {/* App behind — same upsell screen, still visibly "there" (Scope Lock:
          not unmounted). `z-0` creates a local stacking context that traps
          `VPNPlusUpsell`'s own z-[1000] inside this background layer, so it
          cannot paint over the overlay/browser siblings below. */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true" inert>
        <VPNPlusUpsell jtbdKey={jtbdKey} onUpgrade={noop} onContinueFree={noop} onBack={noop} />
      </div>

      {/* Dimming overlay — doubles as the "click app behind to return" target,
          only live once `success`. */}
      <button
        type="button"
        onClick={handleReturnClick}
        disabled={!success}
        aria-hidden={!success}
        tabIndex={success ? 0 : -1}
        aria-label={success ? CHECKOUT_COPY.returnHint : undefined}
        className={`absolute inset-0 z-10 transition-colors duration-300 ${
          success ? "cursor-pointer bg-black/15 hover:bg-black/5" : "cursor-default bg-black/45"
        }`}
      />

      {success && !returning && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="pointer-events-none absolute bottom-[36px] left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full bg-[rgba(0,0,0,0.75)] px-[16px] py-[8px] font-['Inter',sans-serif] text-[13px] leading-[16px] text-white"
        >
          {CHECKOUT_COPY.returnHint}
        </motion.p>
      )}

      <AnimatePresence>
        {!returning && (
          <BrowserWindowChrome key="browser" reduced={reduced}>
            <AnimatePresence mode="wait">
              {pageLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex h-full min-h-[420px] items-center justify-center"
                >
                  <span className="size-[32px] shrink-0 animate-spin rounded-full border-[3px] border-[rgba(12,12,20,0.1)] border-t-[#6d4aff]" aria-hidden="true" />
                </motion.div>
              ) : success ? (
                <CheckoutSuccess key="success" />
              ) : (
                <CheckoutPage key="page" billingCountry={billingCountry} processing={processing} onPay={handlePay} />
              )}
            </AnimatePresence>
          </BrowserWindowChrome>
        )}
      </AnimatePresence>
    </div>
  );
}
