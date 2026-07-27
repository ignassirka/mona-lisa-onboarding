import { useMemo, useState, useEffect } from "react";
import { motion } from "motion/react";

interface ConfettiProps {
  count?: number;
  durationMs?: number;
  colors?: string[];
  /** When set, particles are emoji glyphs instead of colored shapes. */
  emoji?: string;
  onComplete?: () => void;
}

type Shape = "rect" | "sliver" | "circle";

interface ShapeParticle {
  kind: "shape";
  id: number;
  x: number;
  delay: number;
  fallDuration: number;
  color: string;
  shape: Shape;
  width: number;
  height: number;
  initialRotate: number;
  swayX: number;
  spin: number;
}

interface EmojiParticle {
  kind: "emoji";
  id: number;
  x: number;
  delay: number;
  fallDuration: number;
  emoji: string;
  fontSize: number;
  initialRotate: number;
  swayX: number;
  spin: number;
}

type Particle = ShapeParticle | EmojiParticle;

const DEFAULT_COLORS = [
  "#6d4aff",
  "#8d6cff",
  "#b09fff",
  "#2cffcc",
  "#60f0d8",
  "rgba(255,255,255,0.85)",
];

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pickShape(): Shape {
  const r = Math.random();
  if (r < 0.45) return "rect";
  if (r < 0.75) return "sliver";
  return "circle";
}

export default function Confetti({
  count = 60,
  durationMs = 3500,
  colors = DEFAULT_COLORS,
  emoji,
  onComplete,
}: ConfettiProps) {
  const [visible, setVisible] = useState(true);

  // Respect prefers-reduced-motion
  const reducedMotion = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  useEffect(() => {
    if (reducedMotion) return;
    const t = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, durationMs + 200); // slight buffer after last particle finishes
    return () => clearTimeout(t);
  }, [durationMs, onComplete, reducedMotion]);

  const particles = useMemo<Particle[]>(() => {
    if (reducedMotion) return [];
    return Array.from({ length: count }, (_, i) => {
      const base = {
        id: i,
        x: rand(2, 98),
        delay: rand(0, 1.2),
        fallDuration: rand(2.0, 3.2),
        initialRotate: rand(-180, 180),
        swayX: rand(-60, 60),
        spin: rand(-360, 360),
      };

      if (emoji) {
        return {
          kind: "emoji" as const,
          ...base,
          emoji,
          fontSize: rand(16, 28),
        };
      }

      const shape = pickShape();
      const size = shape === "circle"
        ? rand(4, 8)
        : shape === "sliver"
          ? rand(2, 4)
          : rand(5, 10);
      return {
        kind: "shape" as const,
        ...base,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape,
        width: shape === "sliver" ? size * 3 : size,
        height: size,
      };
    });
  }, [count, colors, emoji, reducedMotion]);

  if (!visible || reducedMotion) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1100] overflow-hidden"
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          style={
            p.kind === "emoji"
              ? {
                  position: "absolute",
                  left: `${p.x}%`,
                  top: 0,
                  fontSize: p.fontSize,
                  lineHeight: 1,
                  originX: "50%",
                  originY: "50%",
                }
              : {
                  position: "absolute",
                  left: `${p.x}%`,
                  top: 0,
                  width: p.width,
                  height: p.height,
                  backgroundColor: p.color,
                  borderRadius: p.shape === "circle" ? "50%" : p.shape === "sliver" ? "1px" : "2px",
                  originX: "50%",
                  originY: "50%",
                }
          }
          initial={{ y: -20, opacity: 1, rotate: p.initialRotate, x: 0 }}
          animate={{
            y: "110vh",
            x: p.swayX,
            rotate: p.initialRotate + p.spin,
            opacity: [1, 1, 1, 0.6, 0],
          }}
          transition={{
            duration: p.fallDuration,
            delay: p.delay,
            ease: "easeIn",
            opacity: {
              // Start fading at 60% of fall distance
              times: [0, 0.5, 0.65, 0.85, 1],
              duration: p.fallDuration,
              delay: p.delay,
            },
          }}
        >
          {p.kind === "emoji" ? p.emoji : null}
        </motion.div>
      ))}
    </div>
  );
}
