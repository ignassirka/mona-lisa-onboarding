import { motion, AnimatePresence } from "motion/react";
import { TUNED_RESULT_TIMING as T } from "../timing";
import { PLUS_AVAILABILITY_LABEL } from "./profilesCopy";

export interface DockEntry {
  id: string;
  name: string;
  icon: string;
  /** Rendered muted, with the Plus availability label. */
  locked?: boolean;
}

interface SidebarDockIllustrationProps {
  entries: DockEntry[];
  caption?: string;
  /** Animates entries in and out as the list changes. Off by default (the
   * static case); on for concepts where the user is editing the list and the
   * preview needs to respond. */
  live?: boolean;
  /** Empty-list message. Only meaningful with `live`. */
  emptyLabel?: string;
}

/** A small representation of the app sidebar with the profiles docked into
 * it — reassurance R3 ("will these still be here later?") shown rather than
 * asserted. Mirrors `CountryBrowser`'s real Profiles list (same heading
 * shape, same rows, same six glyphs) so it reads as a preview of the actual
 * destination, not a decorative illustration.
 *
 * Takes `DockEntry` rather than `TunedProfile` because callers differ: the
 * Shelf maps its profiles straight through, while the Draft drives it from
 * user-renamed drafts that may combine several intents. */
export default function SidebarDockIllustration({
  entries,
  caption,
  live = false,
  emptyLabel,
}: SidebarDockIllustrationProps) {
  const duration = T.resolveDuration / 1000;

  return (
    <div className="flex w-full flex-col gap-[8px]">
      <div className="w-full rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-[12px]">
        <div className="mb-[8px] flex items-center gap-[6px]">
          <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold uppercase tracking-wide text-[rgba(255,255,255,0.45)]">
            Profiles
          </span>
          <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] text-[rgba(255,255,255,0.35)]">
            ({entries.length})
          </span>
        </div>

        <div className="flex flex-col gap-[2px]">
          <AnimatePresence initial={false}>
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                layout={live}
                initial={live ? { opacity: 0, height: 0 } : false}
                animate={{ opacity: 1, height: "auto" }}
                exit={live ? { opacity: 0, height: 0 } : undefined}
                transition={{ duration }}
                className="flex items-center gap-[8px] overflow-hidden rounded-[4px] px-[6px] py-[5px]"
              >
                <img
                  src={entry.icon}
                  alt=""
                  className={`size-[16px] shrink-0 ${entry.locked ? "opacity-40" : "opacity-80"}`}
                />
                <span
                  className={`min-w-0 flex-1 truncate font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] ${
                    entry.locked ? "text-[rgba(255,255,255,0.45)]" : "text-white"
                  }`}
                >
                  {entry.name}
                </span>
                {entry.locked ? (
                  <span className="shrink-0 whitespace-nowrap font-['Segoe_UI_Variable',sans-serif] text-[11px] leading-[14px] text-[rgba(255,255,255,0.35)]">
                    {PLUS_AVAILABILITY_LABEL}
                  </span>
                ) : null}
              </motion.div>
            ))}
          </AnimatePresence>

          {entries.length === 0 && emptyLabel ? (
            <p className="px-[6px] py-[8px] font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.5)]">
              {emptyLabel}
            </p>
          ) : null}
        </div>
      </div>

      {caption ? (
        <p className="text-center font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.55)]">
          {caption}
        </p>
      ) : null}
    </div>
  );
}
