import { useEffect, type ReactNode } from "react";
import { motion, type Variants } from "motion/react";
import { useReducedMotion } from "../onboarding-v2/versions/lib/useReducedMotion";

// ─── Copy (i18n-ready — no framework exists in the repo; centralized here,
// matching the convention every other prototype screen uses, e.g.
// `FlowOverview`'s `COPY`). Every figure below is VERBATIM from the PRD —
// never rounded, recomputed, or invented. ──────────────────────────────────
const COPY = {
  back: "Back",
  title: "PRD overview",

  hero: {
    headline: "Land a privacy punch early, ask why they came, tune the app to the answer.",
    subline: "If it works: more people come back, payers see what they bought, and the later free→paid path is seeded.",
  },

  problemHeading: "The problem",
  problems: [
    "We're a privacy-first VPN — but the app never shows what privacy looks like.",
    "Users arrive with a job; the app feels like a tool to master, not a solution.",
    "Half of payers land in a free-looking app and can't see what they bought.",
    "The upsell is generic: a streamer gets pitched Port Forwarding.",
  ],

  numbersHeading: "The numbers",
  stats: [
    { value: "37% / 42%", caption: "Android / Windows free users still active on day 1" },
    { value: "27% / 28%", caption: "free retention after 1 month — it roughly halves" },
    { value: "~2×", caption: "paid retains about twice as much as free, at every window" },
    { value: "46–60%", caption: "of payers paid before ever opening the app" },
    { value: "96–99%", caption: "of users see the free flow — free retention is the biggest prize" },
    { value: "~16,610 / ~24,709", caption: "new paid per week (Windows / Android)" },
  ],

  targetsHeading: "Success targets",
  targetChips: [
    "Android free D1/1W/1M: 37/48/27% → 42/53/32% (+5pp)",
    "Windows free D1/1W/1M: 42/55/28% → 47/60/33% (+5pp)",
    "Android paid D1/1W/1M: 61/77/50% → 63/79/52% (+2pp)",
    "Windows paid D1/1W/1M: 76/90/70% → 78/92/72% (+2pp)",
  ],
  targetTiles: [
    { value: "≥50%", caption: "onboarding completion (no baseline today)" },
    { value: "≥98%", caption: "first connection success" },
  ],
  targetsFootnote: "+5pp is aggressive for a single onboarding change. At +2–3pp we're still winning. Flat means the hypothesis is wrong, not the targets.",

  principlesHeading: "Six principles",
  principles: [
    { title: "Privacy outranks conversion", line: "No invented threats. Real facts can land hard." },
    { title: "Give before you ask", line: "The privacy moment comes before any survey or upsell." },
    { title: "Tangible and realistic", line: "We show privacy, we don't claim it." },
    { title: "Honest, not market-y", line: "Paid is visible and clearly gated, never hidden." },
    { title: "Never block a willing user", line: "Every step skippable; pay available at every prompt." },
    { title: "The user shapes the app", line: "The need they pick changes the configuration." },
  ],

  risksHeading: "Top risks",
  risks: [
    { risk: "Reveal reads as fear-mongering in some markets", mitigation: "per-market copy calibration; no invented threats." },
    { risk: "ISP name comes back wrong", mitigation: "fall back to 'your internet provider'." },
    { risk: "Mobile users skip before we show value (~89% are guests)", mitigation: "watch per-step drop; iterate if >30%." },
    { risk: "Paywall moves later in the flow on Android", mitigation: "persistent pay entry; staged rollout; rollback ready." },
  ],
} as const;

interface PrdOverviewProps {
  onBack: () => void;
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2
      className="font-['Segoe_UI_Variable',sans-serif] text-[13px] font-semibold uppercase leading-[16px] tracking-wide text-[rgba(255,255,255,0.45)]"
      style={{ fontVariationSettings: "'opsz' 11" }}
    >
      {children}
    </h2>
  );
}

function StatTile({ value, caption }: { value: string; caption: string }) {
  return (
    <div className="flex flex-col gap-[6px] rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-[18px]">
      <span
        className="font-['Segoe_UI_Variable',sans-serif] text-[26px] font-bold leading-[30px] text-white"
        style={{ fontVariationSettings: "'opsz' 24" }}
      >
        {value}
      </span>
      <span className="font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[17px] text-[rgba(255,255,255,0.55)]">{caption}</span>
    </div>
  );
}

/** Full-screen, informational "PRD overview" — a stakeholder-glance diagram
 * of the onboarding PRD's key figures/principles/flow/risks, opened from
 * the start screen's tertiary button. Sibling of `FlowOverview`: same
 * navigation (Back/Escape), same tokens, same one-time staggered entrance. */
export default function PrdOverview({ onBack }: PrdOverviewProps) {
  const reduced = useReducedMotion();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onBack]);

  const containerVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduced ? 0 : 0.08 } },
  };
  const sectionVariants: Variants = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: reduced ? 0.3 : 0.3 } },
  };

  const cardClass = "rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-[24px]";

  return (
    <div className="relative flex h-screen w-screen flex-col items-center overflow-y-auto bg-[#0a0a0f] px-[24px] py-[64px]">
      <button
        onClick={onBack}
        aria-label={`${COPY.back} to start`}
        className="fixed left-[24px] top-[24px] z-20 flex items-center gap-[6px] rounded-[4px] px-[8px] py-[6px] font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[20px] text-[rgba(255,255,255,0.6)] outline-none transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)] hover:text-white focus-visible:ring-1 focus-visible:ring-white/30"
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

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="mt-[40px] flex w-full max-w-[1100px] flex-col gap-[40px] pb-[40px]">
        {/* 1 — Hero: the bet */}
        <motion.section variants={sectionVariants} className={`${cardClass} flex flex-col items-center gap-[16px] text-center`}>
          <h3
            className="max-w-[640px] font-['Segoe_UI_Variable',sans-serif] text-[24px] font-semibold leading-[30px] text-white"
            style={{ fontVariationSettings: "'opsz' 22" }}
          >
            {COPY.hero.headline}
          </h3>
          <p className="max-w-[560px] font-['Segoe_UI_Variable',sans-serif] text-[15px] leading-[20px] text-[rgba(255,255,255,0.6)]">
            {COPY.hero.subline}
          </p>
        </motion.section>

        {/* 2 — The problem: 4 statement cards */}
        <motion.section variants={sectionVariants} className="flex flex-col gap-[16px]">
          <SectionHeading>{COPY.problemHeading}</SectionHeading>
          <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2">
            {COPY.problems.map((p) => (
              <div key={p} className={`${cardClass} p-[18px]`}>
                <p className="font-['Segoe_UI_Variable',sans-serif] text-[15px] leading-[20px] text-white">{p}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* 3 — The numbers: stat tiles */}
        <motion.section variants={sectionVariants} className="flex flex-col gap-[16px]">
          <SectionHeading>{COPY.numbersHeading}</SectionHeading>
          <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2 lg:grid-cols-3">
            {COPY.stats.map((s) => (
              <StatTile key={s.caption} value={s.value} caption={s.caption} />
            ))}
          </div>
        </motion.section>

        {/* 4 — Success targets: now→target chips + tiles + guardrail + footnote */}
        <motion.section variants={sectionVariants} className="flex flex-col gap-[16px]">
          <SectionHeading>{COPY.targetsHeading}</SectionHeading>
          <div className="flex flex-col gap-[8px]">
            {COPY.targetChips.map((t) => (
              <div
                key={t}
                className="w-full rounded-[8px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-[14px] py-[10px] font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.8)]"
              >
                {t}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-stretch gap-[12px]">
            {COPY.targetTiles.map((tile) => (
              <div key={tile.caption} className="min-w-[200px] flex-1">
                <StatTile value={tile.value} caption={tile.caption} />
              </div>
            ))}
          </div>
          <p className="font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.4)]">
            {COPY.targetsFootnote}
          </p>
        </motion.section>

        {/* 5 — Six principles: 2x3 numbered grid */}
        <motion.section variants={sectionVariants} className="flex flex-col gap-[16px]">
          <SectionHeading>{COPY.principlesHeading}</SectionHeading>
          <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2 lg:grid-cols-3">
            {COPY.principles.map((p, i) => (
              <div key={p.title} className={`${cardClass} flex flex-col gap-[6px] p-[18px]`}>
                <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold text-[rgba(255,255,255,0.35)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-['Segoe_UI_Variable',sans-serif] text-[15px] font-semibold leading-[20px] text-white">{p.title}</span>
                <span className="font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.55)]">{p.line}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* 6 — Top risks: risk → mitigation rows */}
        <motion.section variants={sectionVariants} className="flex flex-col gap-[16px]">
          <SectionHeading>{COPY.risksHeading}</SectionHeading>
          <div className="flex flex-col gap-[8px]">
            {COPY.risks.map((r) => (
              <div
                key={r.risk}
                className="flex flex-col gap-[4px] rounded-[8px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-[16px] py-[12px] sm:flex-row sm:items-baseline sm:gap-[10px]"
              >
                <span className="font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[19px] text-white">{r.risk}</span>
                <span className="shrink-0 font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[19px] text-[rgba(255,255,255,0.4)]">→</span>
                <span className="font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[19px] text-[rgba(255,255,255,0.6)]">{r.mitigation}</span>
              </div>
            ))}
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}
