import fastestNlUrl from "../app/assets/fastest-nl.png";
import fastestUnprotectedUrl from "../app/assets/fastest-unprotected.svg";

export type FastestVariant = "unprotected" | "free-server";

interface FastestProps {
  /** `unprotected` — teal lightning glyph (disconnected / country-list fastest row).
   *  `free-server` — NL composite (free-tier connected connection card). */
  variant?: FastestVariant;
}

export default function Fastest({ variant = "unprotected" }: FastestProps) {
  const src = variant === "free-server" ? fastestNlUrl : fastestUnprotectedUrl;

  return (
    <div className="relative size-full" data-name={variant === "free-server" ? "Fastest-free-server" : "Fastest"}>
      <img
        src={src}
        alt=""
        className="absolute block size-full object-contain"
      />
    </div>
  );
}
