import { useState } from "react";
import { motion } from "motion/react";
import Spinner from "../onboarding-v2/components/Spinner";
import WindowChrome from "../onboarding-v2/components/WindowChrome";
import FigmaTextField from "./FigmaTextField";
import SignInEncryptionGrid from "./sign-in/SignInEncryptionGrid";
import { useReducedMotion } from "../onboarding-v2/versions/lib/useReducedMotion";
import protonVpnLogoUrl from "../assets/proton-vpn-logo-signin.svg";
import windowsWallpaperUrl from "../assets/windows-wallpaper.png";

/** Centralized, i18n-ready copy (no i18n framework exists in this codebase
 * yet — same precedent as every other stage's centralized copy object). */
export const SIGN_IN_COPY = {
  wordmark: "Proton VPN",
  title: "Sign in",
  subtitle: "Enter your Proton Account details.",
  emailLabel: "Email or username",
  passwordLabel: "Password",
  signIn: "Sign in",
  signingIn: "Signing in\u2026",
  createAccount: "Create account",
} as const;

/** Centralized timing (ms). */
export const SIGN_IN_TIMING = {
  /** Soft fade for the ambient gradient + glyph grid. */
  backgroundEntranceDuration: 1400,
  /** Logo and sign-in card slide-up + fade. */
  contentEntranceDuration: 1200,
  /** Stagger after mount — logo follows the background. */
  logoEntranceDelay: 750,
  /** Stagger after mount — card follows the logo. */
  panelEntranceDelay: 1100,
  /** Subtle upward travel for logo / card (px). */
  logoEntranceTravel: 10,
  panelEntranceTravel: 12,
  /** How long the "Signing in…" button loader holds before advancing. */
  loadingDurationMs: 2000,
} as const;

/** Gentle deceleration — slow settle, no snap. */
const backgroundEase = [0.33, 0, 0.2, 1] as const;
const contentEase = [0.16, 1, 0.3, 1] as const;

const sec = (ms: number): number => ms / 1000;

// Prefilled, fully editable/clearable defaults — happy-path only, no
// validation exists anywhere on this screen (confirmed scope: "Sign in"
// always proceeds regardless of field contents).
const DEFAULT_EMAIL = "user@proton.me";
const DEFAULT_PASSWORD = "Passw0rd1";

interface SignInScreenProps {
  /** Fires once the 2s "Signing in…" loader completes — advances to Stage 1
   * (the connection screen), exactly where "Start onboarding experience"
   * used to go directly. */
  onSignIn: () => void;
  /** Fired by the window chrome's "X" close control — same convention as
   * `OnboardingV2`'s own `onClose`: returns to the prototype's initial
   * start screen. */
  onClose: () => void;
}

/** Full-screen Sign In step, inserted between the start screen's "Start
 * onboarding experience" button and Stage 1 — rendered inside the app
 * window chrome (`OnboardingV2`'s own outer-wrapper convention: the native
 * Windows wallpaper backdrop, a centered bordered window box,
 * `WindowChrome`'s titlebar), not a raw full-viewport screen, so it reads
 * as one continuous window throughout the whole flow.
 *
 * The window box (1100×750) and every spacing/size/color value inside it
 * — the card's own padding/gap/radius/background/border/shadow, the
 * logo's 45px height, the title/subtitle sizes and gap, and both buttons'
 * padding/radius/colors/text size — are pulled directly from Figma (file
 * `VPN | Windows | Explorations`, `6DnFYq5H71PDiErYp5PtUD`, node
 * 8909-184014 "V1" → its "Split screen"/"Left" card, node 8909-184041),
 * fetched via the `user-figma` MCP once access was restored. The two input
 * fields themselves are `FigmaTextField.tsx` (a separate design-system
 * component, sourced from a different Figma file — see its own doc
 * comment). Every field is real and editable; there is no validation
 * anywhere — "Sign in" always proceeds. "Create account" renders per spec
 * but is intentionally inert (no account-creation flow exists). */
export default function SignInScreen({ onSignIn, onClose }: SignInScreenProps) {
  const reduced = useReducedMotion();
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [loading, setLoading] = useState(false);

  const handleSignIn = () => {
    if (loading) return;
    setLoading(true);
    window.setTimeout(onSignIn, SIGN_IN_TIMING.loadingDurationMs);
  };

  return (
    // Same "desktop behind the window" convention as `OnboardingV2`'s own
    // outer wrapper — the native Windows wallpaper, centered, 24px padding.
    <div className="flex h-screen w-screen items-center justify-center bg-cover bg-center p-[24px]" style={{ backgroundImage: `url(${windowsWallpaperUrl})` }}>
      <div
        className="relative overflow-hidden rounded-[8px] border border-[rgba(255,255,255,0.2)] bg-[#16141c] shadow-[0px_2px_32px_0px_rgba(0,0,0,0.37),0px_32px_64px_0px_rgba(0,0,0,0.37)]"
        style={{ width: 1100, height: 750 }}
      >
        {/* Ambient background gradient — fades in first. */}
        <motion.div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: reduced ? 0 : sec(SIGN_IN_TIMING.backgroundEntranceDuration),
            ease: backgroundEase,
          }}
        >
          <div
            className="absolute left-1/2 top-[28%] h-[640px] w-[920px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(109,74,255,0.52) 0%, rgba(109,74,255,0.22) 38%, transparent 72%)",
              filter: "blur(72px)",
            }}
          />
          <div
            className="absolute bottom-[-8%] left-1/2 h-[520px] w-[1100px] -translate-x-1/2 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(45,220,204,0.2) 0%, rgba(45,220,204,0.08) 42%, transparent 72%)",
              filter: "blur(64px)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 820px 640px at 50% 32%, rgba(109,74,255,0.28), transparent 74%), radial-gradient(ellipse 1040px 780px at 50% 100%, rgba(45,220,204,0.12), transparent 70%)",
            }}
          />
        </motion.div>

        {/* Ciphertext glyph grid — fades in with the ambient background. */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-[1]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: reduced ? 0 : sec(SIGN_IN_TIMING.backgroundEntranceDuration),
            ease: backgroundEase,
          }}
        >
          <SignInEncryptionGrid width={1100} height={750} reduced={reduced} className="size-full" />
        </motion.div>

        <WindowChrome onClose={onClose} />

        {/* "Split screen" column (Figma: 450px wide, centered, 32px gap
            between the logo lockup and the card). Nudged upward so the
            block reads optically centered below the title bar. */}
        <div className="relative flex h-full w-full -translate-y-[56px] flex-col items-center justify-center gap-[32px] z-10">
          <motion.img
            src={protonVpnLogoUrl}
            alt={SIGN_IN_COPY.wordmark}
            className="h-[45px] w-auto object-contain"
            initial={{ opacity: 0, y: reduced ? 0 : SIGN_IN_TIMING.logoEntranceTravel }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduced ? 0 : sec(SIGN_IN_TIMING.contentEntranceDuration),
              delay: reduced ? 0 : sec(SIGN_IN_TIMING.logoEntranceDelay),
              ease: contentEase,
            }}
          />

          <motion.div
            className="flex w-[450px] flex-col gap-[24px] rounded-[8px] border border-[rgba(255,255,255,0.04)] bg-[rgba(22,20,28,0.6)] p-[32px] shadow-[0px_0px_200px_0px_rgba(24,22,32,1)] backdrop-blur-[52px]"
            initial={{ opacity: 0, y: reduced ? 0 : SIGN_IN_TIMING.panelEntranceTravel }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduced ? 0 : sec(SIGN_IN_TIMING.contentEntranceDuration),
              delay: reduced ? 0 : sec(SIGN_IN_TIMING.panelEntranceDelay),
              ease: contentEase,
            }}
          >
            {/* Heading — Figma "Heading wrapper": 8px gap; title
                Titles/Title (28px/36px, weight 600, centered); subtitle
                Body/Body (14px/20px, weight 400, centered, rgba(255,255,255,0.7)). */}
            <div className="flex flex-col gap-[8px] text-center">
              <h1
                className="font-['Segoe_UI_Variable',sans-serif] text-[28px] font-semibold leading-[36px] text-white"
                style={{ fontVariationSettings: "'opsz' 24" }}
              >
                {SIGN_IN_COPY.title}
              </h1>
              <p className="font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[20px] text-[rgba(255,255,255,0.7)]">
                {SIGN_IN_COPY.subtitle}
              </p>
            </div>

            {/* Input fields — Figma "Input fields": 16px gap. */}
            <div className="flex flex-col gap-[16px]">
              <FigmaTextField label={SIGN_IN_COPY.emailLabel} value={email} onChange={setEmail} type="text" />
              <FigmaTextField label={SIGN_IN_COPY.passwordLabel} value={password} onChange={setPassword} type="password" />
            </div>

            {/* Buttons — Figma "Buttons": 8px gap. Both share the same
                padding (5px 16px 7px, asymmetric like the input fields)
                and border-radius (4px) and text style (Body/Body Strong:
                14px/20px, weight 600). */}
            <div className="flex flex-col gap-[8px]">
              <button
                type="button"
                onClick={handleSignIn}
                disabled={loading}
                className="flex w-full items-center justify-center gap-[10px] rounded-[4px] bg-[#6d4aff] pb-[7px] pl-[16px] pr-[16px] pt-[5px] font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] text-white transition-all duration-150 hover:bg-[#7c5cff] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-80"
              >
                {loading ? (
                  <>
                    <Spinner size={16} />
                    {SIGN_IN_COPY.signingIn}
                  </>
                ) : (
                  SIGN_IN_COPY.signIn
                )}
              </button>
              <button
                type="button"
                // Intentionally inert — no account-creation flow exists
                // (out of scope, confirmed).
                onClick={undefined}
                className="flex w-full items-center justify-center gap-[8px] rounded-[4px] border border-[rgba(255,255,255,0.1)] bg-[#4a4658] pb-[7px] pl-[16px] pr-[16px] pt-[5px] font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] text-white transition-colors duration-150 hover:bg-[#55516b] active:scale-[0.98]"
              >
                {SIGN_IN_COPY.createAccount}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
