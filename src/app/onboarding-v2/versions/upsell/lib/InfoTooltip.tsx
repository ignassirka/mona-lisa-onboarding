import * as Tooltip from "@radix-ui/react-tooltip";
import { Info } from "lucide-react";

/** (i) info icon wired to a Radix tooltip — lifted verbatim from
 * `VPNPlusUpsell.tsx` so every alternative layout gets the identical
 * affordance/styling without duplicating it 5 times. */
export default function InfoTooltip({ content }: { content?: string }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          aria-label="More information"
          className="flex size-[16px] shrink-0 items-center justify-center text-[rgba(255,255,255,0.5)] outline-none transition-colors hover:text-white focus-visible:text-white"
        >
          <Info size={16} strokeWidth={1.75} />
        </button>
      </Tooltip.Trigger>
      {content ? (
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={6}
            className="z-[1300] max-w-[280px] rounded-[6px] bg-[#0a0a0f] px-[10px] py-[6px] font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.9)] shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
          >
            {content}
            <Tooltip.Arrow className="fill-[#0a0a0f]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      ) : null}
    </Tooltip.Root>
  );
}
