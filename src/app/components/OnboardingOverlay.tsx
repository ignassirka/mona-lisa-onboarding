import { useEffect, useState, useCallback, useRef } from "react";
import { physicalCountryData } from "../../imports/ConnectionDetails";
import SurveillanceSimulation from "./SurveillanceSimulation";
import OnboardingCountryPicker from "./OnboardingCountryPicker";
import type { VpnStatus } from "../App";
import type L from "leaflet";

// ─── Timing constants ────────────────────────────────────────────────────────

const T_BLACK_FADE_START = 600;
const T_BLACK_FADE_DURATION = 1200;
const T_FLY_START = T_BLACK_FADE_START + T_BLACK_FADE_DURATION; // 1800
const T_FLY_DURATION = 2000;
const T_PIN_SHOW = T_FLY_START + T_FLY_DURATION; // 3800
const T_DETAILS_SHOW = T_PIN_SHOW + 800; // 4600
const T_TEXT_START = T_DETAILS_SHOW + 400; // 5000

const TEXT_STAGGER = 380;
const TEXT_ITEM_DURATION = 900;
const TEXT_EASING = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";

const S1_EXIT_DURATION = 800;
const S2_BEAT_PAUSE = 600;
const S2_BUTTON_DELAY = 1500;
const S2_EXIT_DURATION = 800;

// ─── Onboarding phases communicated to WorldMap ──────────────────────────────

export type OnboardingPhase =
  | "black"
  | "fade-map"
  | "fly-to"
  | "show-pin"
  | "show-details"
  | "show-text"
  | "simulation"
  | "screen2"
  | "connecting"
  | "done";

type Screen = 1 | "s1-exit" | "sim" | "sim-exit" | 2 | "s2-exit" | "picker" | "connecting" | "complete";

interface OnboardingOverlayProps {
  physicalCountry: string;
  vpnStatus: VpnStatus;
  mapRef: React.RefObject<L.Map | null>;
  onPhaseChange: (phase: OnboardingPhase) => void;
  onConnect: (country: string) => void;
  onContinue: () => void;
}

// ─── Stagger animation item ─────────────────────────────────────────────────

function FadeSlideItem({
  delay,
  children,
  className = "",
}: {
  delay: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        opacity: 0,
        transform: "translateY(20px)",
        filter: "blur(6px)",
        animation: `onb-fade-slide ${TEXT_ITEM_DURATION}ms ${TEXT_EASING} ${delay}ms forwards`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Detail pill ─────────────────────────────────────────────────────────────

function DetailPill({ label, value, delay }: { label: string; value: string; delay: number }) {
  return (
    <FadeSlideItem delay={delay}>
      <div className="flex items-baseline gap-[16px] py-[8px]">
        <span
          className="text-[14px] leading-[20px] text-[rgba(255,255,255,0.5)] font-['Segoe_UI_Variable',sans-serif] w-[100px] shrink-0"
          style={{ fontVariationSettings: "'opsz' 10.5" }}
        >
          {label}
        </span>
        <span
          className="text-[16px] leading-[20px] text-white font-semibold font-['Segoe_UI_Variable',sans-serif]"
          style={{ fontVariationSettings: "'opsz' 12", fontFeatureSettings: "'fina', 'init'" }}
        >
          {value}
        </span>
      </div>
    </FadeSlideItem>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function OnboardingOverlay({
  physicalCountry,
  vpnStatus,
  mapRef,
  onPhaseChange,
  onConnect,
  onContinue,
}: OnboardingOverlayProps) {
  const [blackOpacity, setBlackOpacity] = useState(1);
  const [showText, setShowText] = useState(false);
  const [screen, setScreen] = useState<Screen>(1);
  const [showS2Text, setShowS2Text] = useState(false);
  const [showS2Button, setShowS2Button] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const pcd = physicalCountryData[physicalCountry] ?? physicalCountryData["Belarus"]!;

  const deviceLabel = (() => {
    const ua = navigator.userAgent;
    const macMatch = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
    const winMatch = ua.match(/Windows NT ([\d.]+)/);
    if (macMatch) return `macOS ${macMatch[1].replace(/_/g, ".")}`;
    if (winMatch) return winMatch[1].startsWith("10.0") ? "Windows 10" : `Windows ${winMatch[1]}`;
    if (/Linux/.test(ua)) return "Linux";
    return "Unknown OS";
  })();

  const emitPhase = useCallback(
    (phase: OnboardingPhase, delayMs: number) => {
      return setTimeout(() => onPhaseChange(phase), delayMs);
    },
    [onPhaseChange],
  );

  // Screen 1 intro timers
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(emitPhase("fade-map", T_BLACK_FADE_START));
    timers.push(setTimeout(() => setBlackOpacity(0), T_BLACK_FADE_START));
    timers.push(emitPhase("fly-to", T_FLY_START));
    timers.push(emitPhase("show-pin", T_PIN_SHOW));
    timers.push(emitPhase("show-details", T_DETAILS_SHOW));
    timers.push(
      setTimeout(() => {
        setShowText(true);
        onPhaseChange("show-text");
      }, T_TEXT_START),
    );

    timersRef.current = timers;
    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle Continue click — transition to surveillance simulation
  const handleContinue = useCallback(() => {
    setScreen("s1-exit");

    const t1 = setTimeout(() => {
      setShowText(false);
      setScreen("sim");
      onPhaseChange("simulation");
    }, S1_EXIT_DURATION);

    timersRef.current.push(t1);
  }, [onPhaseChange]);

  // Handle simulation complete — transition to Screen 2
  const handleSimComplete = useCallback(() => {
    setScreen("sim-exit");
    onPhaseChange("screen2");

    const t1 = setTimeout(() => {
      setScreen(2);
    }, 400);

    const t2 = setTimeout(() => {
      setShowS2Text(true);
    }, 400 + S2_BEAT_PAUSE);

    const t3 = setTimeout(() => {
      setShowS2Button(true);
    }, 400 + S2_BEAT_PAUSE + S2_BUTTON_DELAY);

    timersRef.current.push(t1, t2, t3);
  }, [onPhaseChange]);

  // Handle Screen 2 Continue — show country picker
  const handleShowPicker = useCallback(() => {
    setScreen("s2-exit");

    const t = setTimeout(() => {
      setShowS2Text(false);
      setShowS2Button(false);
      setScreen("picker");
    }, S2_EXIT_DURATION);

    timersRef.current.push(t);
  }, []);

  // Handle country selection from picker
  const handlePickerConnect = useCallback((country: string) => {
    onPhaseChange("connecting");
    onConnect(country);
    setScreen("connecting");
  }, [onConnect, onPhaseChange]);

  // Detect VPN connected — complete onboarding
  useEffect(() => {
    if (screen !== "connecting" || vpnStatus !== "protected") return;

    const t = setTimeout(() => {
      setScreen("complete");
      onPhaseChange("done");
    }, 1500);

    timersRef.current.push(t);
    return () => clearTimeout(t);
  }, [screen, vpnStatus, onPhaseChange]);

  // Cleanup all timers
  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  // Screen 1 stagger counter
  let d = 0;
  const nextDelay = () => {
    const current = d;
    d += TEXT_STAGGER;
    return current;
  };

  const isS1Exiting = screen === "s1-exit";
  const isS2Exiting = screen === "s2-exit";

  return (
    <>
      <style>{`
        @keyframes onb-fade-slide {
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0px);
          }
        }
        @keyframes onb-fade-out {
          to {
            opacity: 0;
            transform: translateY(-10px);
            filter: blur(6px);
          }
        }
      `}</style>

      {/* Black overlay */}
      <div
        className="absolute inset-0 z-[1100] pointer-events-none"
        style={{
          background: "#0f0d14",
          opacity: blackOpacity,
          transition: `opacity ${T_BLACK_FADE_DURATION}ms ease-out`,
        }}
      />

      {/* ── Screen 1: "They know who you are" ── */}
      {showText && (
        <div
          className="absolute inset-0 z-[1200] pointer-events-none"
          style={isS1Exiting ? {
            animation: `onb-fade-out ${S1_EXIT_DURATION}ms ${TEXT_EASING} forwards`,
          } : undefined}
        >
          <div className="absolute left-[80px] top-0 bottom-0 flex flex-col justify-center max-w-[480px] pointer-events-auto">
            <FadeSlideItem delay={nextDelay()}>
              <h1
                className="text-[40px] leading-[48px] font-bold text-white tracking-[-0.02em] font-['Segoe_UI_Variable',sans-serif]"
                style={{ fontVariationSettings: "'opsz' 36" }}
              >
                They know who you are
              </h1>
            </FadeSlideItem>

            <FadeSlideItem delay={nextDelay()} className="mt-[16px]">
              <p
                className="text-[16px] leading-[24px] text-[rgba(255,255,255,0.7)] font-['Segoe_UI_Variable',sans-serif]"
                style={{ fontVariationSettings: "'opsz' 12" }}
              >
                Your internet provider &ldquo;{pcd.provider}&rdquo; uses your IP to track
                your activity, your location, and your habits.
              </p>
            </FadeSlideItem>

            <div className="flex flex-col mt-[28px]">
              <DetailPill label="IP address" value={pcd.ip} delay={nextDelay()} />
              <DetailPill label="Country" value={physicalCountry} delay={nextDelay()} />
              <DetailPill label="Coordinates" value={pcd.coordinates} delay={nextDelay()} />
              <DetailPill label="Device" value={deviceLabel} delay={nextDelay()} />
            </div>

            <FadeSlideItem delay={nextDelay()} className="mt-[24px]">
              <p
                className="text-[15px] leading-[22px] text-[rgba(255,255,255,0.6)] font-['Segoe_UI_Variable',sans-serif]"
                style={{ fontVariationSettings: "'opsz' 11" }}
              >
                They can see everything you do, sell that data, or hand it
                over to other entitites.
              </p>
            </FadeSlideItem>

            <FadeSlideItem delay={nextDelay()} className="mt-[28px]">
              <button
                onClick={handleContinue}
                className="px-[32px] py-[12px] rounded-[8px] bg-[#6d4aff] text-white text-[15px] leading-[20px] font-semibold font-['Segoe_UI_Variable',sans-serif] cursor-pointer transition-all duration-200 hover:bg-[#7c5cff] active:scale-[0.97]"
                style={{ fontVariationSettings: "'opsz' 11" }}
              >
                Continue
              </button>
            </FadeSlideItem>
          </div>
        </div>
      )}

      {/* ── Surveillance simulation ── */}
      {(screen === "sim" || screen === "sim-exit") && (
        <SurveillanceSimulation
          mapRef={mapRef}
          onProtect={handleSimComplete}
        />
      )}

      {/* ── Screen 2: "What if you could disappear?" ── */}
      {(screen === 2 || screen === "s2-exit") && (
        <div
          className="absolute inset-0 z-[1200] pointer-events-none"
          style={isS2Exiting ? {
            animation: `onb-fade-out ${S2_EXIT_DURATION}ms ${TEXT_EASING} forwards`,
          } : undefined}
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto" style={{ paddingTop: "12%" }}>
            <div className="flex flex-col items-center">
              {showS2Text && (
                <div
                  style={{
                    opacity: 0,
                    transform: "translateY(20px)",
                    filter: "blur(6px)",
                    animation: `onb-fade-slide ${TEXT_ITEM_DURATION}ms ${TEXT_EASING} 0ms forwards`,
                  }}
                >
                  <h1
                    className="text-[44px] leading-[52px] font-bold text-white tracking-[-0.02em] font-['Segoe_UI_Variable',sans-serif] text-center"
                    style={{ fontVariationSettings: "'opsz' 36" }}
                  >
                    What if none of them knew who you are?
                  </h1>
                </div>
              )}

              <div
                className="mt-[32px]"
                style={{
                  opacity: 0,
                  transform: "translateY(20px)",
                  filter: "blur(6px)",
                  visibility: showS2Button ? "visible" : "hidden",
                  animation: showS2Button ? `onb-fade-slide ${TEXT_ITEM_DURATION}ms ${TEXT_EASING} 0ms forwards` : "none",
                }}
              >
                <button
                  onClick={handleShowPicker}
                  className="px-[40px] py-[14px] rounded-[10px] bg-[#6d4aff] text-white text-[16px] leading-[22px] font-semibold font-['Segoe_UI_Variable',sans-serif] cursor-pointer transition-all duration-200 hover:bg-[#7c5cff] hover:shadow-[0_0_30px_rgba(109,74,255,0.4)] active:scale-[0.97]"
                  style={{ fontVariationSettings: "'opsz' 12" }}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Screen 3: Country picker ── */}
      {screen === "picker" && (
        <OnboardingCountryPicker onConnect={handlePickerConnect} />
      )}
    </>
  );
}
