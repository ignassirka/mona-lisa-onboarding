import { useEffect, useState } from "react";
import { motion, type Variants } from "motion/react";
import { ShieldCheck, SlidersHorizontal, Settings2, ChevronRight, ChevronDown } from "lucide-react";
import { ONBOARDING_STAGES, STAGE_ORDER, type OnboardingStage } from "../onboarding-v2/OnboardingV2";
import { useReducedMotion } from "../onboarding-v2/versions/lib/useReducedMotion";
import vpnPlusBadgeUrl from "../onboarding-v2/assets/vpn-plus-badge.svg";
import connectionScreenshot from "../assets/flow-overview/stage-connection.png";
import tuningScreenshot from "../assets/flow-overview/stage-tuning.png";
import upgradeScreenshot from "../assets/flow-overview/stage-upgrade.png";
import personalizationScreenshot from "../assets/flow-overview/stage-personalization.png";

/** A real screenshot per stage — one representative screen from that
 * stage's flow — shown atop each card as a visual anchor. */
const STAGE_SCREENSHOT: Record<OnboardingStage, string> = {
  connection: connectionScreenshot,
  tuning: tuningScreenshot,
  upgrade: upgradeScreenshot,
  personalization: personalizationScreenshot,
};

// ─── Copy (i18n-ready — no framework exists in the repo; centralized here,
// matching the convention every other prototype screen uses, e.g.
// `MakeYoursModal`'s `COPY`) ──────────────────────────────────────────────
const COPY = {
  title: "Onboarding flow overview",
  back: "Back",
  goalLabel: "Goal:",
  howLabel: "How:",
  stages: {
    connection: {
      goal: "Make the user feel why protection matters — and fix it in one click.",
      how: "Show their real exposure (location, IP, provider, visible activity), then transform it live as the VPN connects.",
    },
    tuning: {
      goal: "Make the app feel personally configured for what the user actually cares about.",
      how: "One question — pick what matters — then visibly apply the matching settings one by one; two stay waiting on Plus.",
    },
    upgrade: {
      goal: "Turn the desire built in tuning into an upgrade — honestly, without pressure.",
      how: "Show what Plus completes for their chosen interest; on upgrade, celebrate and visibly unlock the waiting features.",
    },
    personalization: {
      goal: "End light and rewarding, with protection locked in by default.",
      how: "Two quick choices — theme (applies live) and auto-start — then straight into the app.",
    },
  } as Record<OnboardingStage, { goal: string; how: string }>,
} as const;

interface FlowOverviewProps {
  onBack: () => void;
}

function StageIcon({ stage }: { stage: OnboardingStage }) {
  switch (stage) {
    case "connection":
      return <ShieldCheck size={26} strokeWidth={1.75} />;
    case "tuning":
      return <SlidersHorizontal size={26} strokeWidth={1.75} />;
    case "upgrade":
      // Reuses the real, existing ▽+ badge asset rather than new artwork.
      return <img src={vpnPlusBadgeUrl} alt="" className="h-[20px] w-[33px]" />;
    case "personalization":
      return <Settings2 size={26} strokeWidth={1.75} />;
  }
}

/** Full-screen, informational "Flow overview" — a diagram of the 4
 * onboarding stages (goal + approach only), opened from the start screen's
 * secondary button. Purely informational: no stage jumping, no state. */
export default function FlowOverview({ onBack }: FlowOverviewProps) {
  const reduced = useReducedMotion();
  // Which card (if any) the pointer is currently over — drives the
  // "focus one card" hover effect: the hovered card scales up, every
  // other card dims. Purely a hover affordance, disabled entirely under
  // `prefers-reduced-motion` (no scale, no dimming).
  const [hoveredStage, setHoveredStage] = useState<OnboardingStage | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onBack]);

  const containerVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduced ? 0 : 0.07 } },
  };
  const cardVariants: Variants = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: reduced ? 0.3 : 0.25 } },
  };
  const connectorVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: reduced ? 0.3 : 0.25 } },
  };

  return (
    <div className="relative flex h-screen w-screen flex-col items-center overflow-y-auto bg-[#0a0a0f] px-[24px] py-[64px]">
      <button
        onClick={onBack}
        aria-label={`${COPY.back} to start`}
        className="absolute left-[24px] top-[24px] z-10 flex items-center gap-[6px] rounded-[4px] px-[8px] py-[6px] font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] text-[rgba(255,255,255,0.6)] outline-none transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)] hover:text-white focus-visible:ring-1 focus-visible:ring-white/30"
        style={{ fontVariationSettings: "'opsz' 11" }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {COPY.back}
      </button>

      <div className="mt-[16px] flex max-w-[720px] flex-col items-center gap-[8px] text-center">
        <h1
          className="font-['Segoe_UI_Variable',sans-serif] text-[28px] font-semibold leading-[36px] text-white"
          style={{ fontVariationSettings: "'opsz' 24" }}
        >
          {COPY.title}
        </h1>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="mt-[48px] flex w-full max-w-[1800px] flex-col items-center gap-[10px] lg:flex-row lg:items-stretch lg:justify-center lg:gap-[16px]"
      >
        {STAGE_ORDER.flatMap((stage, i) => {
          const isHovered = hoveredStage === stage;
          const isDimmed = !reduced && hoveredStage !== null && !isHovered;

          const card = (
            // Outer wrapper owns the entrance stagger (opacity/y via
            // `cardVariants`) and the flex sizing — kept separate from the
            // hover effect below so the two never fight over the same
            // animated properties.
            <motion.div
              key={stage}
              variants={cardVariants}
              className="flex w-full max-w-[420px] shrink-0 flex-col lg:max-w-none lg:flex-1"
            >
              {/* Inner wrapper owns the "focus this card" hover effect:
                  scales up on hover; every OTHER card's inner wrapper dims
                  via `isDimmed` (driven by the shared `hoveredStage` state
                  above, not a per-card `whileHover`, since dimming siblings
                  requires knowing what's hovered elsewhere). Disabled
                  entirely under reduced motion. */}
              <motion.div
                className={`relative flex h-full flex-col gap-[14px] overflow-hidden rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-[24px] ${isHovered ? "z-20" : "z-0"}`}
                animate={{ opacity: isDimmed ? 0.4 : 1 }}
                whileHover={reduced ? undefined : { scale: 1.1 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                onMouseEnter={() => setHoveredStage(stage)}
                onMouseLeave={() => setHoveredStage(null)}
              >
                <img
                  src={STAGE_SCREENSHOT[stage]}
                  alt={`${ONBOARDING_STAGES[stage].name} screenshot`}
                  className="-m-[24px] mb-0 aspect-[4/3] w-[calc(100%+48px)] max-w-none border-b border-[rgba(255,255,255,0.08)] object-cover object-top"
                />

                <div className="flex flex-col items-start gap-[12px] text-[rgba(255,255,255,0.85)]">
                  <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[10px] bg-[rgba(255,255,255,0.06)]">
                    <StageIcon stage={stage} />
                  </div>
                  <span className="font-['Segoe_UI_Variable',sans-serif] text-[19px] font-semibold leading-[24px] text-white">
                    {STAGE_ORDER.indexOf(stage) + 1} · {ONBOARDING_STAGES[stage].name}
                  </span>
                </div>

                <p className="font-['Segoe_UI_Variable',sans-serif] text-[15px] leading-[20px] text-white">
                  <span className="font-semibold">{COPY.goalLabel} </span>
                  {COPY.stages[stage].goal}
                </p>
                <p className="font-['Segoe_UI_Variable',sans-serif] text-[15px] leading-[20px] text-[rgba(255,255,255,0.6)]">
                  <span className="font-semibold text-[rgba(255,255,255,0.75)]">{COPY.howLabel} </span>
                  {COPY.stages[stage].how}
                </p>
              </motion.div>
            </motion.div>
          );

          if (i === 0) return [card];

          const connector = (
            <motion.div
              key={`connector-${stage}`}
              variants={connectorVariants}
              className="flex shrink-0 items-center justify-center text-[rgba(255,255,255,0.3)]"
              aria-hidden="true"
            >
              <ChevronDown size={32} className="lg:hidden" />
              <ChevronRight size={32} className="hidden lg:block" />
            </motion.div>
          );
          return [connector, card];
        })}
      </motion.div>
    </div>
  );
}
