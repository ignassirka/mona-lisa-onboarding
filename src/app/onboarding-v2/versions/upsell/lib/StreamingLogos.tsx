import { motion, type Variants } from "motion/react";
import logoNetflix from "../../../assets/streaming-netflix.png";
import logoBbc from "../../../assets/streaming-bbc.png";
import logoPrime from "../../../assets/streaming-prime.png";
import logoParamount from "../../../assets/streaming-paramount.png";
import logoMax from "../../../assets/streaming-max.png";
import logoHulu from "../../../assets/streaming-hulu.png";
import logoDisney from "../../../assets/streaming-disney.png";

const STREAMING_LOGOS = [
  { src: logoNetflix, alt: "Netflix" },
  { src: logoPrime, alt: "Prime Video" },
  { src: logoDisney, alt: "Disney+" },
  { src: logoMax, alt: "Max" },
  { src: logoHulu, alt: "Hulu" },
  { src: logoBbc, alt: "BBC iPlayer" },
  { src: logoParamount, alt: "Paramount+" },
];

/** Streaming-service logo row — lifted from `VPNPlusUpsell.tsx` (only shown
 * when the streaming JTBD is part of the selection) so every alternative
 * layout reuses the identical existing assets rather than each importing
 * its own copy.
 *
 * `compact` exists for the Profiles-carousel-v2 card, where all seven logos
 * have to fit inside 248px: it shrinks them and drops the "+ and more"
 * trailer, which is what makes the row 184px wide instead of 326px. */
export default function StreamingLogos({
  variants,
  className = "",
  compact = false,
}: {
  variants?: Variants;
  className?: string;
  compact?: boolean;
}) {
  return (
    <motion.div variants={variants} className={`flex items-center ${compact ? "gap-[5px]" : "gap-[10px]"} ${className}`}>
      {STREAMING_LOGOS.map(({ src, alt }) => (
        <img
          key={alt}
          src={src}
          alt={alt}
          title={alt}
          className={`object-cover ${compact ? "size-[22px] rounded-[5px]" : "size-[28px] rounded-[6px]"}`}
        />
      ))}
      {compact ? null : (
        <span className="font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.5)]">+ and more</span>
      )}
    </motion.div>
  );
}
