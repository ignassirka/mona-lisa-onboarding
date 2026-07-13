import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Switch from "@radix-ui/react-switch";
import { motion } from "motion/react";
import { useTheme, type AppTheme } from "../ThemeContext";

// ─── Strings (i18n-ready — all copy lives here) ──────────────────────────────
const COPY = {
  title: "Set it up your way",
  subtitle: "A couple of choices, then you're all set.",
  themeLabel: "Pick your theme",
  themes: { system: "System", dark: "Dark", light: "Light" } as Record<AppTheme, string>,
  autostartTitle: "Stay protected from the start",
  autostartDesc: "Launch Proton VPN and connect automatically every time you start your computer.",
  done: "Apply",
  notNow: "Not now",
} as const;

/** Auto-start defaults ON — the protective choice. "Not now" reverts to this
 * exact value (discarding any toggle change) rather than committing
 * whatever the user staged, so dismissing the modal can never silently leave
 * auto-protection off. */
const AUTOSTART_DEFAULT = true;

// ─── Theme thumbnails (constructed from Figma CSS output) ────────────────────
function DarkThumbScreen() {
  return (
    <div className="relative h-[68.958px] rounded-[8px] w-[90.592px]"
      style={{ backgroundImage: "linear-gradient(200deg, rgb(115,111,131) 4.5%, rgb(32,31,37) 69.8%)" }}>
      {/* Status bar */}
      <div className="absolute bg-[#2ddccc] h-[2.7px] rounded-[4px] top-[7.3px] left-[25px] w-[21.6px]" />
      {/* Card */}
      <div className="absolute bg-[#696678] opacity-50 rounded-[5px] h-[12.2px] left-[15.5px] top-[34.3px] w-[50px]" />
      <div className="absolute bg-[#696678] rounded-[3px] h-[4px] left-[17.4px] top-[37px] w-[16.9px]" />
    </div>
  );
}

function LightThumbScreen() {
  return (
    <div className="relative h-[68.958px] rounded-[8px] w-[90.592px]"
      style={{ backgroundImage: "linear-gradient(200deg, rgb(236,236,236) 4.5%, rgb(255,255,255) 69.8%)" }}>
      <div className="absolute bg-[#1c9c7c] h-[2.7px] rounded-[4px] top-[7.3px] left-[25px] w-[21.6px]" />
      <div className="absolute bg-[#f5f4f2] rounded-[5px] h-[12.2px] left-[15.5px] top-[34.3px] w-[50px]" />
      <div className="absolute bg-white rounded-[3px] h-[4px] left-[17.4px] top-[37px] w-[16.9px]" />
    </div>
  );
}

function ThemeThumbnail({ type }: { type: AppTheme }) {
  const darkDevice = (
    <div className="absolute h-[74.4px] rounded-[10px] w-[96px]"
      style={{ backgroundImage: "linear-gradient(-52deg, rgba(255,255,255,0.2) 1%, rgba(255,255,255,0) 42%), linear-gradient(90deg, rgb(59,55,71), rgb(59,55,71))", boxShadow: "inset 0px 0.8px 0.8px rgba(255,255,255,0.25)" }}>
      <div className="absolute top-[2.7px] left-[2.7px] overflow-hidden rounded-[8px]"><DarkThumbScreen /></div>
      <div className="absolute bg-white h-[1.4px] left-[40px] rounded-[3px] bottom-[6px] w-[16px]" />
    </div>
  );
  const lightDevice = (
    <div className="absolute h-[74.4px] rounded-[10px] w-[96px]"
      style={{ backgroundImage: "linear-gradient(-52deg, rgba(255,255,255,0.2) 1%, rgba(255,255,255,0) 42%), linear-gradient(90deg, rgb(219,215,211), rgb(219,215,211))", boxShadow: "inset 0px 0.8px 0.8px rgba(255,255,255,0.9)" }}>
      <div className="absolute top-[2.7px] left-[2.7px] overflow-hidden rounded-[8px]"><LightThumbScreen /></div>
      <div className="absolute bg-[#1c1b24] h-[1.4px] left-[40px] rounded-[3px] bottom-[6px] w-[16px]" />
    </div>
  );

  if (type === "dark") return <div className="relative h-[74.4px] w-[96px]">{darkDevice}</div>;
  if (type === "light") return <div className="relative h-[74.4px] w-[96px]">{lightDevice}</div>;
  // system: left half = light, right half = dark
  return (
    <div className="relative h-[74.4px] w-[96px]">
      {darkDevice}
      <div className="absolute inset-0 overflow-hidden" style={{ width: "48px" }}>{lightDevice}</div>
    </div>
  );
}

// ─── Toggle (Radix Switch styled to match Figma) ──────────────────────────────
function StyledSwitch({ checked, onCheckedChange, id, offColor = "rgba(255,255,255,0.2)" }: { checked: boolean; onCheckedChange: (v: boolean) => void; id: string; offColor?: string }) {
  return (
    <Switch.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="relative h-[20px] w-[40px] cursor-pointer rounded-full outline-none transition-colors"
      style={{ background: checked ? "#9880ff" : offColor }}
    >
      <Switch.Thumb
        className="block h-[12px] w-[12px] rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? "translateX(23px) translateY(-50%)" : "translateX(4px) translateY(-50%)", position: "absolute", top: "50%" }}
      />
    </Switch.Root>
  );
}

// ─── Modal props ──────────────────────────────────────────────────────────────
interface MakeYoursModalProps {
  open: boolean;
  onClose: () => void;
}

const SHOWN_KEY = "makeYoursModalShown";

/** Final onboarding step — now just two choices: theme (applies live,
 * unchanged mechanics) and auto-start (staged, committed on button click).
 * NetShield and Default country were removed from this modal only — both
 * features remain fully available elsewhere (the right rail / Settings);
 * their own state (`App.tsx`'s `netShieldEnabled`/`connectedCountry`) was
 * never sourced from this modal, so removing their rows here has no impact
 * on their defaults or availability. */
export default function MakeYoursModal({ open, onClose }: MakeYoursModalProps) {
  const { theme, effectiveTheme, setTheme } = useTheme();

  // Derive color tokens live from the effective theme so the modal re-renders
  // immediately when the user clicks System / Dark / Light.
  const isLight = effectiveTheme === "light";
  const tok = {
    modalBg: isLight ? "rgba(245, 244, 248, 0.92)" : "rgba(22, 20, 28, 0.7)",
    modalBorder: isLight ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.2)",
    textPrimary: isLight ? "#1c1b24" : "#ffffff",
    textSecondary: isLight ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.7)",
    rowBg: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)",
    rowBorder: isLight ? "rgba(0,0,0,0.1)" : "transparent",
    notNowBg: isLight ? "rgba(0,0,0,0.08)" : "#4a4658",
    notNowBorder: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
    switchOff: isLight ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.2)",
  };

  // Staged — NOT committed until button click (theme is the exception: live).
  const [stagedAutostart, setStagedAutostart] = useState(AUTOSTART_DEFAULT);

  const persist = (autostart: boolean) => {
    localStorage.setItem("autoStartEnabled", String(autostart));
    localStorage.setItem(SHOWN_KEY, "true");
    onClose();
  };

  // "Apply" commits whatever the user staged. "Not now" reverts to the
  // protective default (discarding any toggle change) rather than
  // committing the staged value — dismissing the modal can never silently
  // leave auto-protection off, per the confirmed interpretation.
  const handleDone = () => persist(stagedAutostart);
  const handleNotNow = () => persist(AUTOSTART_DEFAULT);
  const handleEscape = () => handleNotNow(); // Escape / overlay click = Not now

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => { if (!v) handleEscape(); }}
    >
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay asChild>
          <motion.div
            className="fixed inset-0 z-[2000] bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
        </Dialog.Overlay>

        {/* Modal */}
        <Dialog.Content
          onEscapeKeyDown={(e) => { e.preventDefault(); handleEscape(); }}
          asChild
        >
          <motion.div
            className="fixed z-[2001] top-1/2 left-1/2 w-[560px] max-h-[90vh] overflow-y-auto"
            style={{
              background: tok.modalBg,
              backdropFilter: "blur(30px)",
              WebkitBackdropFilter: "blur(30px)",
              border: `1px solid ${tok.modalBorder}`,
              borderRadius: "8px",
              transition: "background 0.3s ease, border-color 0.3s ease",
            }}
            initial={{ opacity: 0, scale: 0.96, x: "-50%", y: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex flex-col gap-[20px] items-center p-[40px]">
              {/* Header */}
              <div className="w-full text-center flex flex-col gap-[8px]">
                <Dialog.Title asChild>
                  <h1 className="font-['Segoe_UI_Variable',sans-serif] text-[28px] font-semibold leading-[36px]"
                    style={{ fontVariationSettings: "'opsz' 24", color: tok.textPrimary }}>
                    {COPY.title}
                  </h1>
                </Dialog.Title>
                <Dialog.Description asChild>
                  <p className="font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[20px]"
                    style={{ fontFeatureSettings: '"rclt" 0', color: tok.textSecondary }}>
                    {COPY.subtitle}
                  </p>
                </Dialog.Description>
              </div>

              {/* Theme picker */}
              <div className="flex flex-col gap-[8px] w-full">
                <p className="font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[20px]"
                  style={{ fontFeatureSettings: '"rclt" 0', color: tok.textPrimary }}>
                  {COPY.themeLabel}
                </p>
                <div className="flex gap-[8px] w-full">
                  {(["system", "dark", "light"] as AppTheme[]).map((t) => {
                    const selected = theme === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTheme(t)}
                        aria-pressed={selected}
                        className="flex flex-1 flex-col gap-[8px] items-center justify-center p-[12px] rounded-[4px] outline-none transition-all duration-150 cursor-pointer"
                        style={{
                          background: selected
                            ? (isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)")
                            : "transparent",
                          border: selected
                            ? `1px solid ${isLight ? "rgba(0,0,0,0.35)" : "white"}`
                            : `1px solid ${isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.1)"}`,
                        }}
                      >
                        <ThemeThumbnail type={t} />
                        <span
                          className="font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] text-center"
                          style={{
                            color: selected ? tok.textPrimary : tok.textSecondary,
                            fontFeatureSettings: '"fina" 1, "init" 1',
                          }}
                        >
                          {COPY.themes[t]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Auto-start row */}
              <div className="flex items-center gap-[16px] w-full rounded-[4px] px-[16px] py-[12px]"
                style={{ background: tok.rowBg, border: `1px solid ${tok.rowBorder}` }}>
                <div className="flex flex-1 gap-[12px] items-center min-w-0">
                  <div className="flex flex-col flex-1 min-w-0">
                    <label
                      htmlFor="modal-autostart"
                      className="font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[20px] cursor-pointer"
                      style={{ fontFeatureSettings: '"rclt" 0', color: tok.textPrimary }}
                    >
                      {COPY.autostartTitle}
                    </label>
                    <p className="font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px]"
                      style={{ color: tok.textSecondary }}>
                      {COPY.autostartDesc}
                    </p>
                  </div>
                </div>
                <StyledSwitch id="modal-autostart" checked={stagedAutostart} onCheckedChange={setStagedAutostart} offColor={tok.switchOff} />
              </div>

              {/* Buttons */}
              <div className="flex gap-[8px] w-full">
                <button
                  type="button"
                  onClick={handleDone}
                  className="flex flex-1 items-center justify-center rounded-[4px] bg-[#6d4aff] pb-[7px] pt-[5px] px-[16px] font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] text-white transition-colors hover:bg-[#7c5cff] active:scale-[0.98] cursor-pointer"
                  style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
                >
                  {COPY.done}
                </button>
                <button
                  type="button"
                  onClick={handleNotNow}
                  className="flex flex-1 items-center justify-center rounded-[4px] pb-[7px] pt-[5px] px-[16px] font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] transition-colors active:scale-[0.98] cursor-pointer"
                  style={{ fontFeatureSettings: '"fina" 1, "init" 1', background: tok.notNowBg, border: `1px solid ${tok.notNowBorder}`, color: tok.textPrimary }}
                >
                  {COPY.notNow}
                </button>
              </div>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
