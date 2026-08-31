import React, { useState, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import chipSvgPaths from "../../imports/svg-6mqrghog0w";
import tabSvgPaths from "../../imports/svg-gr3yl27tf4";
import searchSvgPaths from "../../imports/svg-m0k6r02h9x";
import Fastest from "../../imports/Fastest";
import { getFlagUrl } from "./flagComponents";
import profileIconStreaming from "../../imports/profile-icons/profile-icon-streaming.svg";
import profileIconGaming from "../../imports/profile-icons/profile-icon-gaming.svg";
import profileIconP2p from "../../imports/profile-icons/profile-icon-p2p.svg";
import profileIconAnticensorship from "../../imports/profile-icons/profile-icon-anticensorship.svg";
import profileIconSecurity from "../../imports/profile-icons/profile-icon-security.svg";
import profileIconBusiness from "../../imports/profile-icons/profile-icon-business.svg";
import icPlus20 from "../../imports/profile-icons/ic-plus-20.svg";
import icInfoCircle from "../../imports/profile-icons/ic-info-circle-filled.svg";
import icArrowRightLeft from "../../imports/profile-icons/ic-arrow-right-arrow-left.svg";
import recentsEmptyIcon from "../../imports/recents-empty-icon.svg";
import checkmarkCircleFilled from "../onboarding-v2/assets/checkmark-circle-filled.svg";
import vpnPlusBadgeUrl from "../onboarding-v2/assets/vpn-plus-badge.svg";
import { type JtbdId } from "../onboarding-v2/lib/jtbdData";
import { JTBD_PROFILES, sidebarSubtitle } from "../onboarding-v2/lib/jtbdProfiles";
import { useReducedMotion } from "../onboarding-v2/versions/lib/useReducedMotion";
import type { SessionPlan } from "../lib/sessionPlan";

// ─── Styles ───────────────────────────────────────────────────────────────────

const fontSemibold: React.CSSProperties = {
  fontVariationSettings: "'opsz' 10.5",
  fontFeatureSettings: "'fina', 'init'",
};

const fontRegular: React.CSSProperties = {
  fontVariationSettings: "'opsz' 10.5",
  fontFeatureSettings: "'rclt' 0",
};

// ─── Chip Section Nav Icons (from Figma) ──────────────────────────────────────

function ClockIcon({ active }: { active: boolean }) {
  return (
    <div className="relative shrink-0 size-[16px]">
      <div className="absolute inset-[9.38%_9.39%_9.38%_0.01%]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.4956 13">
          <path clipRule="evenodd" d={chipSvgPaths.p25f71c80} fill="white" fillOpacity={active ? 1 : 0.7} fillRule="evenodd" />
        </svg>
      </div>
    </div>
  );
}

function EarthIcon({ active }: { active: boolean }) {
  return (
    <div className="relative shrink-0 size-[16px]">
      <div className="absolute inset-[6.25%]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
          <path clipRule="evenodd" d={chipSvgPaths.p634fa00} fill="white" fillOpacity={active ? 1 : 0.7} fillRule="evenodd" />
        </svg>
      </div>
    </div>
  );
}

function TerminalIcon({ active }: { active: boolean }) {
  return (
    <div className="relative shrink-0 size-[16px]">
      <div className="absolute inset-[12.5%_6.25%]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 12">
          <path clipRule="evenodd" d={chipSvgPaths.p21917200} fill="white" fillOpacity={active ? 1 : 0.7} fillRule="evenodd" />
        </svg>
      </div>
    </div>
  );
}

function ChipIndicator({ visible }: { visible: boolean }) {
  return (
    <div className="absolute h-[17px] left-0 top-[6px] w-[3px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 17">
        <path d={chipSvgPaths.p147ee00} fill="white" opacity={visible ? 1 : 0} />
      </svg>
    </div>
  );
}

// ─── Country name → ISO 2-letter code mapping ────────────────────────────────

const countryToIso: Record<string, string> = {
  Albania: "AL", Algeria: "DZ", Angola: "AO", Argentina: "AR", Armenia: "AM",
  Australia: "AU", Austria: "AT", Azerbaijan: "AZ", Bangladesh: "BD", Belarus: "BY",
  Belgium: "BE", Bolivia: "BO", "Bosnia and Herzegovina": "BA", Brazil: "BR", Bulgaria: "BG",
  Cambodia: "KH", Cameroon: "CM", Canada: "CA", Chile: "CL", China: "CN",
  Colombia: "CO", "Costa Rica": "CR", Croatia: "HR", Cyprus: "CY", "Czech Republic": "CZ",
  Denmark: "DK", Ecuador: "EC", Egypt: "EG", "El Salvador": "SV", Estonia: "EE",
  Finland: "FI", France: "FR", Georgia: "GE", Germany: "DE", Ghana: "GH",
  Greece: "GR", Honduras: "HN", "Hong Kong": "HK", Hungary: "HU", Iceland: "IS",
  India: "IN", Indonesia: "ID", Iran: "IR", Ireland: "IE", "Isle of Man": "IM",
  Israel: "IL", Italy: "IT", Japan: "JP", Kazakhstan: "KZ", Kenya: "KE",
  Latvia: "LV", Lithuania: "LT", Luxembourg: "LU", Malaysia: "MY", Mexico: "MX",
  Moldova: "MD", Mongolia: "MN", Morocco: "MA", Netherlands: "NL", "New Zealand": "NZ",
  Nigeria: "NG", "North Macedonia": "MK", Norway: "NO", Pakistan: "PK", Panama: "PA",
  Peru: "PE", Philippines: "PH", Poland: "PL", Portugal: "PT", Romania: "RO",
  Russia: "RU", "Saudi Arabia": "SA", Senegal: "SN", Serbia: "RS", Singapore: "SG",
  Slovakia: "SK", Slovenia: "SI", "South Africa": "ZA", "South Korea": "KR", Spain: "ES",
  "Sri Lanka": "LK", Sweden: "SE", Switzerland: "CH", Taiwan: "TW", Thailand: "TH",
  Turkey: "TR", Ukraine: "UA", "United Arab Emirates": "AE", "United Kingdom": "GB",
  "United States": "US", Uruguay: "UY", Venezuela: "VE", Vietnam: "VN",
};

// Full country list
const allCountries = [
  "Albania", "Algeria", "Angola", "Argentina", "Armenia",
  "Australia", "Austria", "Azerbaijan", "Bangladesh", "Belarus",
  "Belgium", "Bolivia", "Bosnia and Herzegovina", "Brazil", "Bulgaria",
  "Cambodia", "Cameroon", "Canada", "Chile", "China",
  "Colombia", "Costa Rica", "Croatia", "Cyprus", "Czech Republic",
  "Denmark", "Ecuador", "Egypt", "El Salvador", "Estonia",
  "Finland", "France", "Georgia", "Germany", "Ghana",
  "Greece", "Honduras", "Hong Kong", "Hungary", "Iceland",
  "India", "Indonesia", "Iran", "Ireland", "Isle of Man",
  "Israel", "Italy", "Japan", "Kazakhstan", "Kenya",
  "Latvia", "Lithuania", "Luxembourg", "Malaysia", "Mexico",
  "Moldova", "Mongolia", "Morocco", "Netherlands", "New Zealand",
  "Nigeria", "North Macedonia", "Norway", "Pakistan", "Panama",
  "Peru", "Philippines", "Poland", "Portugal", "Romania",
  "Russia", "Saudi Arabia", "Senegal", "Serbia", "Singapore",
  "Slovakia", "Slovenia", "South Africa", "South Korea", "Spain",
  "Sri Lanka", "Sweden", "Switzerland", "Taiwan", "Thailand",
  "Turkey", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Uruguay", "Venezuela", "Vietnam",
];

// Secure Core countries (privacy-focused)
const secureCoreCountries = [
  "Iceland", "Sweden", "Switzerland",
];

// P2P-friendly countries
const p2pCountries = [
  "Argentina", "Austria", "Brazil", "Canada", "Denmark",
  "Finland", "France", "Germany", "Iceland", "Ireland",
  "Luxembourg", "Netherlands", "New Zealand", "Norway",
  "Poland", "Portugal", "Romania", "Singapore", "Spain",
  "Sweden", "Switzerland", "United Kingdom", "United States",
];

// Tor-friendly countries
const torCountries = [
  "France", "Germany", "Hong Kong", "Iceland",
  "Sweden", "Switzerland", "United States",
];

// ─── Flag renderer (SVG component or emoji fallback) ──────────────────────────

function CountryFlag({ name }: { name: string }) {
  const url = getFlagUrl(name);
  if (url) {
    return (
      <img
        src={url}
        alt={`${name} flag`}
        width={30}
        height={20}
        loading="lazy"
        className="w-[30px] h-[20px] shrink-0 rounded-[4px] object-cover"
      />
    );
  }

  // Fallback: placeholder
  return (
    <div className="w-[30px] h-[20px] rounded-[4px] bg-[rgba(255,255,255,0.12)] shrink-0" />
  );
}

// ─── Active dot (Figma component) ─────────────────────────────────────────────

function ActiveDot() {
  return (
    <div className="relative shrink-0" style={{ width: 16, height: 16 }}>
      {/* Outer pulsing ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "rgba(44,255,204,0.2)",
          animation: "activeDotPulse 2.4s ease-in-out infinite",
        }}
      />
      {/* Inner solid dot */}
      <div
        className="absolute rounded-full"
        style={{
          width: 8,
          height: 8,
          top: 4,
          left: 4,
          background: "#2CFFCC",
          boxShadow: "0 0 6px rgba(44,255,204,0.7)",
        }}
      />
      <style>{`
        @keyframes activeDotPulse {
          0%, 100% { transform: scale(0.85); opacity: 0.6; }
          50%       { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Country row (Figma-accurate) ─────────────────────────────────────────────

export type CountryRowVpnProps = {
  variant?: "vpn";
  name: string;
  isFastest?: boolean;
  /** When set (e.g. sorted VPN picks), shown as muted index before the flag. */
  rank?: number;
  vpnStatus: VpnStatus;
  isConnected: boolean;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect?: () => void;
  /** Right-side hint on hover; defaults to "Connect". */
  actionLabel?: string;
  disabled?: boolean;
};

export type CountryRowNavigateProps = {
  variant: "navigate";
  name: string;
  isFastest?: boolean;
  rank?: number;
  onNavigate: () => void;
  /** Right-side hint on hover; defaults to "Explore". */
  actionLabel?: string;
};

export type CountryRowProps = CountryRowVpnProps | CountryRowNavigateProps;

export function CountryRow(props: CountryRowProps) {
  const [hovered, setHovered] = useState(false);
  const isNavigate = props.variant === "navigate";
  const disabled = !isNavigate && props.disabled;

  const handleClick = () => {
    if (disabled) return;
    if (isNavigate) {
      props.onNavigate();
      return;
    }
    if (props.isConnected || props.isConnecting) {
      props.onDisconnect?.();
    } else {
      props.onConnect();
    }
  };

  const actionLabel = isNavigate
    ? (props.actionLabel ?? "Explore")
    : (props.actionLabel ?? "Connect");

  const isConnected = !isNavigate && props.isConnected;
  const isConnecting = !isNavigate && props.isConnecting;
  const showActionHint = isNavigate || (!isConnected && !isConnecting);

  const rowBg =
    !disabled && hovered && (isNavigate || (!isConnected && !isConnecting))
      ? "rgba(255,255,255,0.1)"
      : "transparent";

  const { name, isFastest = false, rank } = props;

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => { if (!disabled) setHovered(true); }}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      className={`flex items-center w-full rounded-[8px] transition-colors duration-150 ${disabled ? "cursor-default" : "cursor-pointer"}`}
      style={{
        padding: "12px",
        gap: "12px",
        height: 44,
        justifyContent: "space-between",
        background: rowBg,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {/* Left: optional rank + flag + name + active dot (VPN only) */}
      <div className="flex items-center shrink-0 min-w-0 flex-1" style={{ gap: 12 }}>
        {rank != null && (
          <span
            style={{ ...fontRegular, fontSize: 12, lineHeight: "16px" }}
            className="text-[rgba(255,255,255,0.35)] w-[20px] shrink-0 text-center tabular-nums"
          >
            {rank}
          </span>
        )}
        <div className="shrink-0" style={{ width: 30, height: 20 }}>
          {isFastest ? <Fastest variant="unprotected" /> : <CountryFlag name={name} />}
        </div>
        <span
          style={{ ...fontRegular, fontSize: 16, lineHeight: "20px", color: "white" }}
          className="whitespace-nowrap truncate min-w-0"
        >
          {name}
        </span>
        {isConnected && <ActiveDot />}
      </div>

      {/* Right: Connect / Explore on hover */}
      <div className="shrink-0 flex items-center" style={{ height: 20 }}>
        {!disabled && showActionHint && (
          <span
            style={{
              ...fontSemibold,
              fontSize: 16,
              lineHeight: "20px",
              color: "white",
              opacity: hovered ? 1 : 0,
              transition: "opacity 120ms ease",
            }}
          >
            {actionLabel}
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Profiles data ────────────────────────────────────────────────────────────

type ProfileEntry = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  p2p?: boolean;
};

const profilesList: ProfileEntry[] = [
  { id: "streaming-us", title: "Streaming US",          subtitle: "United States",                  icon: profileIconStreaming },
  { id: "gaming",       title: "Gaming",                subtitle: "Fastest country",                icon: profileIconGaming },
  { id: "p2p",          title: "P2P",                   subtitle: "Fastest country",                icon: profileIconP2p,    p2p: true },
  { id: "anticensors",  title: "Anti-censorship",       subtitle: "Fastest (excluding my country)", icon: profileIconAnticensorship },
  { id: "max-security", title: "Maximum security",      subtitle: "Fastest - Secure Core",          icon: profileIconSecurity },
  { id: "work-school",  title: "Work and school",       subtitle: "Fastest country",                icon: profileIconBusiness },
];

// Maps each onboarding JTBD to the existing profile entry (above) that best
// matches its intent — no new profile entries/artwork invented, just
// reordering/filtering the SAME 6 that already exist. Mirrors the mapping
// the tuning-result data already implies (e.g. travel's paid "Home country
// profile" already uses this exact "business" glyph).
const JTBD_TO_PROFILE_ID: Record<JtbdId, string> = {
  streaming: "streaming-us",
  gaming: "gaming",
  downloading: "p2p",
  bypass: "anticensors",
  privacy: "max-security",
  travel: "work-school",
};

/** The exact inverse of `JTBD_TO_PROFILE_ID` — bijective, since each of the
 * 6 static `profilesList` entries maps to exactly one JTBD. Lets ANY
 * displayed profile (an onboarding-generated one, or a static default-list
 * row shown when onboarding was skipped) resolve back to the `JtbdId`
 * `JTBD_PROFILES` needs for its destination — without adding a `jtbd` field
 * to `ProfileEntry`, since `id` already carries the same information. */
const PROFILE_ID_TO_JTBD: Record<string, JtbdId> = Object.fromEntries(
  (Object.entries(JTBD_TO_PROFILE_ID) as [JtbdId, string][]).map(([jtbd, id]) => [id, jtbd]),
);

// ─── Onboarding-profiles banner (i18n-ready copy; centralized here per the
// project's established precedent — no i18n framework exists yet). ─────────
const PROFILES_ONBOARDING_BANNER_COPY = {
  message: "Connect through one of your personalized profiles - each one is already tuned for what you do online.",
  dismissLabel: "Dismiss",
} as const;

const PROFILES_PLUS_TEASER_BANNER_COPY = {
  message: "Unlock these profiles with VPN Plus",
  supporting: "One-tap setups for everything you picked — available on VPN Plus.",
  dismissLabel: "Dismiss",
} as const;

/** Persists whether the user has dismissed the onboarding-profiles banner —
 * once set, it never reappears on any future visit/launch. Separate key
 * from every other one-time flag in the app (`makeYoursModalShown`,
 * `welcomeBannerShown`), confirmed at checkpoint. */
const PROFILES_ONBOARDING_BANNER_DISMISSED_KEY = "profilesOnboardingBannerDismissed";

// ─── Three-dots icon ──────────────────────────────────────────────────────────

/** Always mounted so the Secondary hit target stays a stable 20×20 box.
 * Opacity is driven entirely by CSS (see `PROFILE_ROW_CSS`) — invisible at
 * rest, 70% under Primary hover, 100% under Secondary hover. */
function ThreeDotsIcon() {
  return (
    <svg
      width="4"
      height="16"
      viewBox="0 0 4 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="profile-row__dots shrink-0"
      aria-hidden
    >
      <circle cx="2" cy="2"  r="1.5" fill="white" />
      <circle cx="2" cy="8"  r="1.5" fill="white" />
      <circle cx="2" cy="14" r="1.5" fill="white" />
    </svg>
  );
}

/** Rendered once for the whole Profiles list (see `<ProfileRowStyles />`
 * below `displayedProfiles.map`), not per row. Hover here is pure CSS
 * (`:hover` / `:has()`) rather than React state — a row's hover feedback
 * this way can never be broken by a stale closure, a Fast Refresh hook-shape
 * mismatch, or a re-render race; the browser owns it entirely. `:has()` has
 * been supported in every evergreen browser (Chrome 105+, Safari 15.4+,
 * Firefox 121+) since well before this prototype's target audience. */
const PROFILE_ROW_CSS = `
  .profile-row { border-radius: 8px; background: transparent; transition: background-color 150ms; }
  .profile-row:has(.profile-row__secondary:hover) { background: rgba(255,255,255,0.1); }
  .profile-row__primary { border-radius: 8px; background: transparent; transition: background-color 150ms; }
  .profile-row__primary:hover { background: rgba(255,255,255,0.1); }
  .profile-row__hover-only { opacity: 0; transition: opacity 150ms; }
  .profile-row__primary:hover .profile-row__hover-only { opacity: 1; }
  .profile-row__dots circle { opacity: 0; transition: opacity 150ms; }
  /* The dots sit in the Secondary region, a SIBLING of Primary — so Primary
     hover has to reach them through the row, not descend into itself. */
  .profile-row:has(.profile-row__primary:hover) .profile-row__dots circle { opacity: 0.7; }
  .profile-row__secondary:hover .profile-row__dots circle { opacity: 1; }
`;

// ─── Profile row ──────────────────────────────────────────────────────────────

/** One row in the sidebar's Profiles list. Ported from Figma node
 * 22866-161142, which defines two INDEPENDENTLY hoverable regions rather
 * than one whole-row hover:
 * - **Primary** (icon + title/subtitle) — hovering it highlights only that
 *   region (`rgba(255,255,255,0.1)`) and reveals a dimmed (70% white)
 *   three-dot affordance in the Secondary slot, plus either a "Connect"
 *   label (a profile this plan can actually run) or the VPN Plus badge +
 *   an explanatory tooltip (a locked, free-plan profile) — so hovering the
 *   row always tells you what clicking it would do.
 * - **Secondary** (the three-dot menu button) — hovering it highlights the
 *   WHOLE row instead, and brightens the three-dot icon to full white,
 *   since the menu affordance is what's directly under the pointer there.
 *
 * Locked profiles (`disabled`) stay fully hoverable rather than
 * `pointer-events-none` — the point of the badge/tooltip is to explain WHY
 * a profile is locked, which a row that refuses the pointer entirely can
 * never do. Only the title/subtitle/tag colors and the icon's opacity dim
 * to the design's "hint" treatment; nothing here uses a blanket row
 * opacity.
 *
 * Clicking Primary while runnable (`!disabled`) calls `onConnect`/
 * `onDisconnect` — whichever applies given `isConnected`/`isConnecting` —
 * exactly like `CountryRow` already does for the Countries tab. Locked
 * rows have no `onClick` at all (only the hover tooltip explains why),
 * matching `CountryRow`'s own `disabled` handling. */
function ProfileRow({
  profile,
  disabled = false,
  isConnected = false,
  isConnecting = false,
  onConnect,
  onDisconnect,
}: {
  profile: ProfileEntry;
  disabled?: boolean;
  isConnected?: boolean;
  isConnecting?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
}) {
  // text/hint vs text/norm, text/hint vs text/weak — locked profiles read
  // dimmed regardless of which region (if any) is hovered.
  const titleColor = disabled ? "rgba(255,255,255,0.5)" : "white";
  const subtitleColor = disabled ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.7)";
  const showConnectHint = !isConnected && !isConnecting;

  const handlePrimaryClick = () => {
    if (disabled) return;
    if (isConnected || isConnecting) onDisconnect?.();
    else onConnect?.();
  };

  return (
    <div className="profile-row flex items-stretch w-full" aria-disabled={disabled || undefined}>
      {/* Primary: icon + titles — its own hover region/highlight */}
      <div
        onClick={handlePrimaryClick}
        className={`profile-row__primary flex flex-1 min-w-0 items-center ${disabled ? "cursor-default" : "cursor-pointer"}`}
        style={{ gap: 8, padding: 12 }}
      >
        {/* Profile icon 30x30 */}
        <img
          src={profile.icon}
          alt={profile.title}
          width={30}
          height={30}
          className="shrink-0"
          style={{ width: 30, height: 30, opacity: disabled ? 0.5 : 1 }}
        />

        {/* Title stack */}
        <div className="flex flex-col flex-1 min-w-0" style={{ gap: 2 }}>
          {/* Top title */}
          <div className="flex items-center w-full" style={{ gap: 8 }}>
            <span
              className="whitespace-nowrap overflow-hidden text-ellipsis"
              style={{ ...fontRegular, fontSize: 16, lineHeight: "20px", color: titleColor }}
            >
              {profile.title}
            </span>
            {isConnected && <ActiveDot />}
          </div>

          {/* 2nd line: subtitle + optional P2P tag */}
          <div className="flex items-center" style={{ gap: 4 }}>
            <span
              className="whitespace-nowrap overflow-hidden text-ellipsis"
              style={{ ...fontRegular, fontSize: 14, lineHeight: "20px", color: subtitleColor }}
            >
              {profile.subtitle}
            </span>

            {profile.p2p && (
              <div
                className="flex items-center shrink-0 rounded-[4px]"
                style={{ background: "rgba(255,255,255,0.05)", gap: 2, padding: "2px 6px" }}
              >
                <img src={icArrowRightLeft} alt="P2P" width={14} height={14} style={{ opacity: disabled ? 0.5 : 1 }} />
                <span
                  className="shrink-0"
                  style={{ ...fontSemibold, fontSize: 12, lineHeight: "16px", color: disabled ? "rgba(255,255,255,0.5)" : "white" }}
                >
                  P2P
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Hover affordance, Primary region only — "Connect" for a runnable
            profile, or the VPN Plus badge + tooltip for a locked one. Always
            mounted (opacity-driven by CSS) rather than conditionally
            rendered, so appearing on hover can't shift the row's layout. */}
        {!disabled && (
          <span
            className="profile-row__hover-only shrink-0 whitespace-nowrap"
            style={{ ...fontSemibold, fontSize: 16, lineHeight: "20px", color: "white" }}
          >
            {showConnectHint ? "Connect" : "Disconnect"}
          </span>
        )}

        {disabled && (
          <div className="profile-row__hover-only relative shrink-0 flex items-center justify-center">
            <div
              className="absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-[4px] border"
              style={{
                bottom: "calc(100% + 8px)",
                background: "#292733",
                borderColor: "rgba(255,255,255,0.2)",
                boxShadow: "0px 4px 4px rgba(0,0,0,0.26)",
                padding: "4px 8px",
              }}
            >
              <span style={{ ...fontRegular, fontSize: 12, lineHeight: "16px", color: "white" }}>
                Server available with VPN Plus
              </span>
            </div>
            <img src={vpnPlusBadgeUrl} alt="" width={22} height={13} className="shrink-0" />
          </div>
        )}
      </div>

      {/* Secondary: three-dots menu button — Figma wraps this in a self-stretch
          column so the 44×44 target spans the full row height. */}
      <div className="flex flex-row items-center self-stretch shrink-0">
        <div
          className="profile-row__secondary flex h-full w-[44px] shrink-0 items-center justify-center rounded-[8px] cursor-pointer"
          style={{ padding: 12 }}
        >
          <ThreeDotsIcon />
        </div>
      </div>
    </div>
  );
}

// ─── Tab types ────────────────────────────────────────────────────────────────

type NavItem = "recents" | "countries" | "profiles";
type FilterTab = "all" | "secure-core" | "p2p" | "tor";

// ─── VPN props ────────────────────────────────────────────────────────────────

export type VpnStatus = "unprotected" | "connecting" | "protected";

type CountryBrowserProps = {
  vpnStatus?: VpnStatus;
  vpnConnectedCountry?: string | null;
  onVpnConnect?: (country: string) => void;
  onVpnDisconnect?: () => void;
  physicalCountry?: string;
  /** The JTBDs selected in onboarding (`App.tsx`'s `onboardingJtbds`), first-
   * selected first. When present and non-empty: the Profiles tab is
   * selected by default (instead of Countries) and the Profiles list is
   * generated from these intents (via `JTBD_TO_PROFILE_ID`) rather than
   * showing all 6 defaults. Omitted/empty (e.g. onboarding was skipped, or
   * `skipOnboarding` bypassed onboarding entirely) falls back to this
   * component's entire pre-existing behavior, byte-for-byte. */
  onboardingJtbds?: JtbdId[];
  /** The Plus-plan country picked during onboarding (`App.tsx`'s
   * `onboardingCountry`), or null for "Fastest country". Overrides the
   * destination line on generated profiles that target a FIXED country — see
   * `sidebarSubtitle`. Always null on Free, which never sees a selector. */
  onboardingCountry?: string | null;
  /** Free vs. paid landing — disables onboarding-generated profiles on Free. */
  sessionPlan?: SessionPlan;
  /** Increment to switch to the Countries tab (free-tier "Change server"). */
  countriesTabFocusKey?: number;
  /** Attached to the Profiles tab's content block (header → "New profile"),
   * so `App.tsx` can measure it for the post-onboarding spotlight. */
  profilesSectionRef?: React.Ref<HTMLDivElement>;
  /** `App.tsx`'s live profile-connection identity — lets a profile row know
   * whether IT is the one currently connected, so it can show the active
   * dot and swap its hover label to "Disconnect". Unrelated to
   * `vpnConnectedCountry`, which a plain country/"Fastest" connect also
   * sets — a row only reads as connected when BOTH match this jtbd AND
   * `vpnStatus` isn't `"unprotected"`. */
  connectedProfileJtbd?: JtbdId | null;
  /** Fired when a profile row's Primary region is clicked while runnable
   * (Plus, or a Free-runnable destination) and not already connected/
   * connecting to it. Absent → rows render their hover affordance but
   * clicking does nothing, matching every pre-existing default. */
  onProfileConnect?: (jtbd: JtbdId) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CountryBrowser({
  vpnStatus = "unprotected",
  vpnConnectedCountry,
  onVpnConnect,
  onVpnDisconnect,
  physicalCountry = "Belarus",
  onboardingJtbds,
  onboardingCountry = null,
  sessionPlan = "plus",
  countriesTabFocusKey = 0,
  profilesSectionRef,
  connectedProfileJtbd = null,
  onProfileConnect,
}: CountryBrowserProps = {}) {
  const hasOnboardingIntents = !!onboardingJtbds && onboardingJtbds.length > 0;
  const isFreePlan = sessionPlan === "free";
  const profilesLocked = isFreePlan && hasOnboardingIntents;
  /** Free + disconnected — individual country picks are Plus-only; fastest row stays active. */
  const countriesLocked = isFreePlan && vpnStatus === "unprotected";
  const [activeNav, setActiveNav] = useState<NavItem>(hasOnboardingIntents ? "profiles" : "countries");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const reducedMotion = useReducedMotion();

  // Onboarding-profiles banner — shown only while there's at least one
  // onboarding-created profile in the list (`hasOnboardingIntents` IS that
  // signal in this prototype: every displayed profile is either entirely
  // onboarding-derived or entirely the static default set — see Phase 0
  // discovery, no per-profile marker needed) AND the user hasn't dismissed
  // it before.
  const [bannerDismissed, setBannerDismissed] = useState(
    () => typeof localStorage !== "undefined" && localStorage.getItem(PROFILES_ONBOARDING_BANNER_DISMISSED_KEY) === "true",
  );
  const showOnboardingBanner = hasOnboardingIntents && !bannerDismissed;
  const showPlusTeaserBanner = showOnboardingBanner && isFreePlan;
  const showPaidOnboardingBanner = showOnboardingBanner && !isFreePlan;
  const dismissOnboardingBanner = () => {
    localStorage.setItem(PROFILES_ONBOARDING_BANNER_DISMISSED_KEY, "true");
    setBannerDismissed(true);
  };

  useEffect(() => {
    if (countriesTabFocusKey > 0) {
      setActiveNav("countries");
    }
  }, [countriesTabFocusKey]);

  // Profile items generated from the onboarding selection, in selection
  // order — reorders/filters the SAME 6 hardcoded profiles above (id and the
  // P2P tag untouched), never invents new ones.
  //
  // Title, destination and glyph all come from `JTBD_PROFILES`, the same
  // source the tuning stage reads, so what a user was shown while tuning is
  // what they find here. That matters for two intents specifically: `privacy`
  // and `downloading`, whose default subtitles ("Fastest - Secure Core",
  // "Fastest country") contradicted the destinations tuning names
  // (Switzerland, Netherlands). The title is still `JTBD_PROFILE_LABEL` —
  // `TunedProfile.name` reads from it — so the existing renaming behaviour is
  // preserved rather than replaced, and the icons resolve to the same six
  // `profile-icon-*.svg` assets `profilesList` already imports.
  //
  // Falls back to the full default list, byte-for-byte, when there's no
  // onboarding selection to draw from (skipped onboarding, `skipOnboarding`,
  // the connection-failure exits).
  const displayedProfiles = useMemo(() => {
    if (!hasOnboardingIntents) return profilesList;
    const byId = new Map(profilesList.map((p) => [p.id, p]));
    const seen = new Set<string>();
    const mapped: ProfileEntry[] = [];
    for (const jtbd of onboardingJtbds!) {
      const base = byId.get(JTBD_TO_PROFILE_ID[jtbd]);
      const profile = JTBD_PROFILES[jtbd];
      if (base && profile && !seen.has(base.id)) {
        seen.add(base.id);
        mapped.push({
          ...base,
          title: profile.name,
          subtitle: sidebarSubtitle(profile, onboardingCountry),
          icon: profile.icon,
        });
      }
    }
    return mapped.length > 0 ? mapped : profilesList;
  }, [hasOnboardingIntents, onboardingJtbds, onboardingCountry]);

  const filteredCountries = useMemo(() => {
    let list: string[];
    switch (activeFilter) {
      case "secure-core":
        list = secureCoreCountries;
        break;
      case "p2p":
        list = p2pCountries;
        break;
      case "tor":
        list = torCountries;
        break;
      default:
        list = allCountries;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => c.toLowerCase().includes(q));
    }
    return list;
  }, [activeFilter, searchQuery]);

  const navItems: { key: NavItem; label: string; icon: React.ReactNode; shortcut: string }[] = [
    {
      key: "recents",
      label: "Recents",
      icon: <ClockIcon active={activeNav === "recents"} />,
      shortcut: "ctrl + 1",
    },
    {
      key: "countries",
      label: "Countries",
      icon: <EarthIcon active={activeNav === "countries"} />,
      shortcut: "ctrl + 2",
    },
    {
      key: "profiles",
      label: "Profiles",
      icon: <TerminalIcon active={activeNav === "profiles"} />,
      shortcut: "ctrl + 3",
    },
  ];

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "secure-core", label: "Secure Core" },
    { key: "p2p", label: "P2P" },
    { key: "tor", label: "Tor" },
  ];

  return (
    <div className="flex flex-col w-full h-full">
      {/* Search bar — Figma-exact */}
      <div className="shrink-0 px-[12px] pt-[14px] pb-[8px]">
        <div className="bg-[rgba(255,255,255,0.05)] content-stretch flex items-center justify-between px-[8px] py-[10px] relative rounded-[4px] w-full">
          <div className="content-stretch flex gap-[8px] items-center relative flex-1 min-w-0">
            <div className="relative shrink-0 size-[16px]">
              <div className="absolute inset-[6.25%_12.5%_12.5%_6.25%]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
                  <path clipRule="evenodd" d={searchSvgPaths.p1d2e30f0} fill="white" fillOpacity="0.5" fillRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="content-stretch flex items-end relative flex-1 min-w-0">
              <input
                type="text"
                placeholder="Browse from..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none w-full text-[14px] text-white leading-[20px] placeholder:text-[rgba(255,255,255,0.5)] whitespace-nowrap"
                style={{ fontVariationSettings: "'opsz' 10.5", fontFeatureSettings: "'rclt' 0" }}
              />
            </div>
          </div>
          <p
            className="relative shrink-0 text-[12px] text-[rgba(255,255,255,0.5)] leading-[16px] whitespace-nowrap"
            style={{ fontVariationSettings: "'opsz' 8" }}
          >
            ctrl + F
          </p>
        </div>
      </div>

      {/* Navigation — Chip Section (Figma-exact) */}
      <div className="shrink-0 flex flex-col gap-[4px] px-[12px] py-[8px]">
        {navItems.map((item) => {
          const isActive = activeNav === item.key;
          return (
            <div
              key={item.key}
              onClick={() => setActiveNav(item.key)}
              className="flex items-center justify-between relative shrink-0 w-full cursor-pointer"
            >
              <div
                className={`relative shrink-0 rounded-[4px] transition-colors duration-150 ease-out ${
                  isActive
                    ? "bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.28)]"
                    : "hover:bg-[rgba(255,255,255,0.1)]"
                }`}
              >
                <div className="flex flex-row items-center size-full">
                  <div className="flex gap-[4px] items-center pb-[5px] pt-[4px] px-[8px] relative">
                    {item.icon}
                    <div
                      style={{
                        fontVariationSettings: "'opsz' 10.5",
                        fontFeatureSettings: "'rclt' 0",
                      }}
                      className={`flex flex-col justify-end leading-[0] relative shrink-0 text-[16px] text-center whitespace-nowrap ${
                        isActive ? "text-white" : "text-[rgba(255,255,255,0.7)]"
                      }`}
                    >
                      <p className="leading-[20px]">{item.label}</p>
                    </div>
                    <ChipIndicator visible={isActive} />
                  </div>
                </div>
              </div>
              <div
                style={{ fontVariationSettings: "'opsz' 8" }}
                className="flex flex-col justify-end leading-[0] relative shrink-0 text-[12px] text-[rgba(255,255,255,0.5)] text-center whitespace-nowrap"
              >
                <p className="leading-[16px]">{item.shortcut}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter tabs — Figma ServerFeatures exact */}
      {activeNav === "countries" && (
        <div className="content-stretch flex items-start relative shrink-0 w-full px-[8px] py-[0px]">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className="content-stretch flex flex-col gap-[8px] items-center pt-[8px] px-[12px] relative rounded-[8px] shrink-0 cursor-pointer"
              >
                <div
                  style={{
                    fontVariationSettings: "'opsz' 10.5",
                    fontFeatureSettings: "'rclt' 0",
                  }}
                  className={`flex flex-col justify-center leading-[0] relative shrink-0 text-[14px] whitespace-nowrap ${
                    isActive ? "text-white" : "text-[rgba(255,255,255,0.7)]"
                  }`}
                >
                  <p className="leading-[20px]">{tab.label}</p>
                </div>
                <div className="h-[3px] relative shrink-0 w-[16px]">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 3">
                    <path
                      d={tabSvgPaths.p39dfd5a0}
                      fill="white"
                      opacity={isActive ? 1 : 0}
                    />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Country list */}
      {activeNav === "countries" && (
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Section header */}
          <div className="shrink-0 px-[16px] pt-[12px] pb-[6px]">
            <span style={fontSemibold} className="text-[rgba(255,255,255,0.5)] text-[14px] leading-[16px] font-semibold">
              {activeFilter === "all"
                ? `All countries (${filteredCountries.length})`
                : activeFilter === "secure-core"
                ? `Secure Core (${filteredCountries.length})`
                : activeFilter === "p2p"
                ? `P2P (${filteredCountries.length})`
                : `Tor (${filteredCountries.length})`}
            </span>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 min-h-0 overflow-y-auto px-[8px] pb-[8px]">
            {/* Fastest country row — hidden while disconnected; free users pick
                via the connection card instead. */}
            {activeFilter === "all" && !searchQuery && vpnStatus !== "unprotected" && (
              <CountryRow
                name="Fastest country"
                isFastest
                vpnStatus={vpnStatus}
                isConnected={vpnStatus === "protected" && vpnConnectedCountry === physicalCountry}
                isConnecting={vpnStatus === "connecting" && vpnConnectedCountry === physicalCountry}
                onConnect={() => onVpnConnect?.(physicalCountry)}
                onDisconnect={onVpnDisconnect}
              />
            )}

            {/* Country rows */}
            {filteredCountries.map((name) => (
              <CountryRow
                key={name}
                name={name}
                vpnStatus={vpnStatus}
                isConnected={vpnStatus === "protected" && vpnConnectedCountry === name}
                isConnecting={vpnStatus === "connecting" && vpnConnectedCountry === name}
                onConnect={() => onVpnConnect?.(name)}
                onDisconnect={onVpnDisconnect}
                disabled={countriesLocked}
              />
            ))}

            {filteredCountries.length === 0 && (
              <div className="flex items-center justify-center py-[32px]">
                <span style={fontRegular} className="text-[rgba(255,255,255,0.35)] text-[13px]">
                  No countries found
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recents — Figma "0 recents" empty state */}
      {activeNav === "recents" && (
        <div className="flex-1 min-h-0 overflow-y-auto py-[24px] px-[8px]">
          {/* Centered column matching Figma: px-64 inner padding, 8px gap between icon and text */}
          <div className="flex flex-col items-center gap-[8px] px-[64px]">
            {/* small/recents icon — taken as-is from Figma (64×64) */}
            <img
              src={recentsEmptyIcon}
              alt=""
              width={64}
              height={64}
              className="shrink-0 select-none"
              draggable={false}
            />
            {/* Text stack — 172px wide, centered, 4px gap (Figma exact) */}
            <div className="flex flex-col gap-[4px] text-center" style={{ width: 172 }}>
              <p
                className="text-[14px] leading-[20px] text-white"
                style={{ fontFamily: "'Segoe UI Variable', sans-serif", fontWeight: 600, fontVariationSettings: "'opsz' 10.5", fontFeatureSettings: "'fina', 'init'" }}
              >
                No recents yet
              </p>
              <p
                className="text-[14px] leading-[20px] text-[rgba(255,255,255,0.7)]"
                style={{ fontFamily: "'Segoe UI Variable', sans-serif", fontWeight: 400, fontVariationSettings: "'opsz' 10.5", fontFeatureSettings: "'rclt' 0" }}
              >
                View your connection history here.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Profiles section */}
      {activeNav === "profiles" && (
        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto px-[8px]">
          {/* Content block — everything from the header down to "New profile",
              wrapped so it can be measured as one region (the scroll container
              above stretches to the panel's full height, which would make the
              spotlight ring the empty space below the list too). */}
          <div ref={profilesSectionRef} className="shrink-0 flex flex-col">
            {/* Section header */}
            <div
              className="shrink-0 flex items-center"
              style={{ gap: 8, padding: "16px 8px 8px" }}
            >
              <span
                style={{ ...fontSemibold, fontSize: 14, lineHeight: "20px", color: "rgba(255,255,255,0.7)" }}
              >
                Profiles ({displayedProfiles.length})
              </span>
              <img src={icInfoCircle} alt="info" width={16} height={16} className="shrink-0" />
            </div>

            {/* Onboarding-profiles banner — inline note, not a floating toast;
                sits directly beneath the title, above the first row. Never
                blocks selecting a profile or "New profile" below it. */}
            {showPlusTeaserBanner && (
              <motion.div
                className="shrink-0 flex items-start rounded-[8px]"
                style={{ gap: 8, padding: 12, margin: "0 8px 8px", background: "rgba(255,255,255,0.05)" }}
                initial={reducedMotion ? undefined : { opacity: 0 }}
                animate={reducedMotion ? undefined : { opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <img src={vpnPlusBadgeUrl} alt="" width={30} height={18} className="shrink-0 mt-[2px]" />
                <div className="flex-1 flex flex-col" style={{ gap: 4 }}>
                  <span
                    style={{ ...fontSemibold, fontSize: 13, lineHeight: "18px", color: "rgba(255,255,255,0.9)" }}
                  >
                    {PROFILES_PLUS_TEASER_BANNER_COPY.message}
                  </span>
                  <span
                    style={{ ...fontRegular, fontSize: 13, lineHeight: "18px", color: "rgba(255,255,255,0.7)" }}
                  >
                    {PROFILES_PLUS_TEASER_BANNER_COPY.supporting}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={dismissOnboardingBanner}
                  aria-label={PROFILES_PLUS_TEASER_BANNER_COPY.dismissLabel}
                  className="shrink-0 flex items-center justify-center rounded-[4px] cursor-pointer transition-colors duration-150"
                  style={{ width: 20, height: 20, background: "transparent" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L9 9M9 1L1 9" stroke="white" strokeOpacity="0.6" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </button>
              </motion.div>
            )}

            {showPaidOnboardingBanner && (
              <motion.div
                className="shrink-0 flex items-start rounded-[8px]"
                style={{ gap: 8, padding: 12, margin: "0 8px 8px", background: "rgba(255,255,255,0.05)" }}
                initial={reducedMotion ? undefined : { opacity: 0 }}
                animate={reducedMotion ? undefined : { opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <img src={checkmarkCircleFilled} alt="" width={16} height={16} className="shrink-0 mt-[2px]" />
                <span
                  className="flex-1"
                  style={{ ...fontRegular, fontSize: 13, lineHeight: "18px", color: "#ffffff" }}
                >
                  {PROFILES_ONBOARDING_BANNER_COPY.message}
                </span>
                <button
                  type="button"
                  onClick={dismissOnboardingBanner}
                  aria-label={PROFILES_ONBOARDING_BANNER_COPY.dismissLabel}
                  className="shrink-0 flex items-center justify-center rounded-[4px] cursor-pointer transition-colors duration-150"
                  style={{ width: 20, height: 20, background: "transparent" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L9 9M9 1L1 9" stroke="white" strokeOpacity="0.6" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </button>
              </motion.div>
            )}

            {/* Profile rows — hover CSS shared by every row, defined once here
                rather than duplicated per `<ProfileRow>` instance. */}
            <style>{PROFILE_ROW_CSS}</style>
            {displayedProfiles.map((profile) => {
              const jtbd = PROFILE_ID_TO_JTBD[profile.id];
              const isThisProfile = !!jtbd && connectedProfileJtbd === jtbd;
              const isConnected = isThisProfile && vpnStatus === "protected";
              const isConnecting = isThisProfile && vpnStatus === "connecting";
              return (
                <ProfileRow
                  key={profile.id}
                  profile={profile}
                  disabled={profilesLocked}
                  isConnected={isConnected}
                  isConnecting={isConnecting}
                  onConnect={jtbd ? () => onProfileConnect?.(jtbd) : undefined}
                  onDisconnect={onVpnDisconnect}
                />
              );
            })}

            {/* New profile button — sits directly after the last row */}
            <div className="shrink-0" style={{ padding: "4px 0px 8px" }}>
              <button
                className="flex items-center justify-center rounded-[4px] transition-colors duration-150 cursor-pointer"
                style={{ gap: 8, padding: 8, background: "transparent" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <img src={icPlus20} alt="plus" width={20} height={20} className="shrink-0" />
                <span
                  style={{ ...fontSemibold, fontSize: 16, lineHeight: "20px", color: "#9880FF" }}
                >
                  New profile
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}