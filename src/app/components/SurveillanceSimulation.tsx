import { useEffect, useState, useRef, useCallback } from "react";
import type L from "leaflet";

// ─── Surveillance node definitions (Belarus-centric) ────────────────────────

interface SurveillanceNode {
  id: string;
  label: string;
  lat: number;
  lng: number;
  color: string;
  wave: number; // which URL triggers this node
  waveDelay: number; // ms after wave starts
}

const NODES: SurveillanceNode[] = [
  { id: "isp",       label: "ISP — Белтелеком",      lat: 53.2, lng: 29.5,   color: "#F7607B", wave: 0, waveDelay: 0 },
  { id: "dns",       label: "DNS Resolver",           lat: 50.1, lng: 8.7,    color: "#F7607B", wave: 0, waveDelay: 1000 },
  { id: "ads",       label: "Ad network — Google",    lat: 37.4, lng: -122.1, color: "#F7607B", wave: 1, waveDelay: 0 },
  { id: "broker",    label: "Data broker",            lat: 38.9, lng: -77.4,  color: "#F7607B", wave: 1, waveDelay: 400 },
  { id: "social",    label: "Social tracker — Meta",  lat: 53.3, lng: -6.3,   color: "#F7607B", wave: 1, waveDelay: 1000 },
  { id: "gov",       label: "Government — SORM",      lat: 55.8, lng: 37.6,   color: "#E8A838", wave: 2, waveDelay: 0 },
  { id: "analytics", label: "Analytics",              lat: 51.5, lng: -0.1,   color: "#F7607B", wave: 2, waveDelay: 200 },
  { id: "cdn",       label: "Cloud CDN",              lat: 1.3,  lng: 103.8,  color: "#F7607B", wave: 2, waveDelay: 400 },
  { id: "cookie",    label: "Cookie sync",            lat: 35.7, lng: 139.7,  color: "#F7607B", wave: 2, waveDelay: 600 },
];

const URLS = [
  { text: "what are the best flights to lisbon", isSearch: true },
  { text: "booking.com/flights/lisbon", isSearch: false },
  { text: "protonmail.com/inbox", isSearch: false },
];

// Belarus user pin
const ORIGIN = { lat: 53.7, lng: 27.9 };

const RAY_DRAW_DURATION = 600;
const TYPEWRITER_CHAR_MIN = 40;
const TYPEWRITER_CHAR_MAX = 70;

// ─── Typewriter hook ────────────────────────────────────────────────────────

function useTypewriter(text: string, active: boolean) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!active) {
      setDisplayed("");
      return;
    }
    let i = 0;
    setDisplayed("");
    const timers: ReturnType<typeof setTimeout>[] = [];

    function typeNext() {
      if (i >= text.length) return;
      const delay = TYPEWRITER_CHAR_MIN + Math.random() * (TYPEWRITER_CHAR_MAX - TYPEWRITER_CHAR_MIN);
      const t = setTimeout(() => {
        i++;
        setDisplayed(text.slice(0, i));
        typeNext();
      }, delay);
      timers.push(t);
    }
    typeNext();

    return () => timers.forEach(clearTimeout);
  }, [text, active]);

  return displayed;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface SurveillanceSimulationProps {
  mapRef: React.RefObject<L.Map | null>;
  onProtect: () => void;
}

export default function SurveillanceSimulation({ mapRef, onProtect }: SurveillanceSimulationProps) {
  const [phase, setPhase] = useState<"bar-in" | "typing" | "done" | "counter" | "retracting">("bar-in");
  const [urlIndex, setUrlIndex] = useState(0);
  const [typingActive, setTypingActive] = useState(false);
  const [activeNodes, setActiveNodes] = useState<SurveillanceNode[]>([]);
  const [showCounter, setShowCounter] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [retracting, setRetracting] = useState(false);
  const [mapTick, setMapTick] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  const displayed = useTypewriter(URLS[urlIndex]?.text ?? "", typingActive);

  // Re-render rays whenever the map moves/zooms
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const onMove = () => setMapTick((t) => t + 1);
    map.on("move", onMove);
    map.on("zoom", onMove);
    return () => {
      map.off("move", onMove);
      map.off("zoom", onMove);
    };
  }, [mapRef]);

  const toPixel = useCallback(
    (lat: number, lng: number) => {
      const map = mapRef.current;
      if (!map) return { x: 0, y: 0 };
      const pt = map.latLngToContainerPoint([lat, lng]);
      return { x: pt.x, y: pt.y };
    },
    [mapRef],
  );

  // Compute pixel positions from lat/lng on every render (reactive to mapTick)
  const computedRays = activeNodes.map((node) => {
    void mapTick;
    const o = toPixel(ORIGIN.lat, ORIGIN.lng);
    const d = toPixel(node.lat, node.lng);
    const dx = d.x - o.x;
    const dy = d.y - o.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    return { node, ox: o.x, oy: o.y, dx: d.x, dy: d.y, length };
  });

  const fireRay = useCallback(
    (node: SurveillanceNode) => {
      setActiveNodes((prev) => [...prev, node]);
    },
    [],
  );

  // Wave scheduling
  const fireWave = useCallback(
    (waveIndex: number) => {
      const waveNodes = NODES.filter((n) => n.wave === waveIndex);
      waveNodes.forEach((node) => {
        const t = setTimeout(() => fireRay(node), node.waveDelay);
        timersRef.current.push(t);
      });
    },
    [fireRay],
  );

  // Master sequence
  useEffect(() => {
    const t: ReturnType<typeof setTimeout>[] = [];

    // 400ms: search bar slides in, then start typing
    t.push(setTimeout(() => {
      setPhase("typing");
      setTypingActive(true);
      fireWave(0);
    }, 400));

    // URL 0 typing done, hold 1s, then switch to URL 1
    t.push(setTimeout(() => {
      setTypingActive(false);
      setTimeout(() => {
        setUrlIndex(1);
        setTypingActive(true);
        fireWave(1);
      }, 1300);
    }, 2400));

    // URL 1 typing done, hold 1s, then switch to URL 2
    t.push(setTimeout(() => {
      setTypingActive(false);
      setTimeout(() => {
        setUrlIndex(2);
        setTypingActive(true);
        fireWave(2);
      }, 1300);
    }, 5200));

    // Stop typing, fade search bar
    t.push(setTimeout(() => {
      setTypingActive(false);
      setPhase("done");

      // Zoom out map
      const map = mapRef.current;
      if (map) {
        map.flyTo([ORIGIN.lat - 12, ORIGIN.lng], 3, { duration: 1.5, easeLinearity: 0.35 });
      }
    }, 8200));

    // Show counter after zoom-out settles
    t.push(setTimeout(() => {
      setPhase("counter");
      setShowCounter(true);
    }, 9400));

    // Show button
    t.push(setTimeout(() => {
      setShowButton(true);
    }, 11400));

    timersRef.current = t;
    return () => t.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleProtect = useCallback(() => {
    setRetracting(true);
    setPhase("retracting");
    setShowCounter(false);
    setShowButton(false);

    const t = setTimeout(() => {
      onProtect();
    }, 800);
    timersRef.current.push(t);
  }, [onProtect]);

  const barVisible = phase === "bar-in" || phase === "typing";
  const barExiting = phase === "done";

  return (
    <>
      <style>{`
        @keyframes sim-bar-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-30px); filter: blur(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); filter: blur(0); }
        }
        @keyframes sim-bar-out {
          to { opacity: 0; transform: translateX(-50%) translateY(-20px); filter: blur(8px); }
        }
        @keyframes sim-fade-in {
          from { opacity: 0; transform: translateY(16px); filter: blur(6px); }
          to   { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes sim-fade-out {
          to { opacity: 0; filter: blur(6px); }
        }
        @keyframes sim-ray-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes sim-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        @keyframes sim-packet {
          0% { offset-distance: 0%; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
        }
        @keyframes sim-label-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sim-retract {
          to { stroke-dashoffset: var(--ray-len); opacity: 0; }
        }
        .sim-cursor::after {
          content: '';
          display: inline-block;
          width: 2px;
          height: 16px;
          background: rgba(255,255,255,0.6);
          margin-left: 1px;
          vertical-align: text-bottom;
          animation: sim-blink 1s steps(1) infinite;
        }
        @keyframes sim-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>

      {/* Search bar */}
      {(barVisible || barExiting) && (
        <div
          className="absolute top-[24px] left-1/2 z-[1300] pointer-events-none"
          style={{
            transform: "translateX(-50%)",
            animation: barExiting
              ? "sim-bar-out 600ms cubic-bezier(0.25,0.46,0.45,0.94) forwards"
              : "sim-bar-in 700ms cubic-bezier(0.25,0.46,0.45,0.94) forwards",
          }}
        >
          <div className="flex items-center gap-[10px] px-[16px] py-[10px] rounded-[10px] backdrop-blur-[16px] bg-[rgba(22,20,28,0.6)] border border-[rgba(255,255,255,0.1)] min-w-[420px]">
            {/* Search icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <path fillRule="evenodd" clipRule="evenodd" d="M16.5 9.75C16.5 13.4779 13.4779 16.5 9.75 16.5C6.02208 16.5 3 13.4779 3 9.75C3 6.02208 6.02208 3 9.75 3C13.4779 3 16.5 6.02208 16.5 9.75ZM15.0293 16.09C13.5987 17.2825 11.7581 18 9.75 18C5.19365 18 1.5 14.3063 1.5 9.75C1.5 5.19365 5.19365 1.5 9.75 1.5C14.3063 1.5 18 5.19365 18 9.75C18 11.7581 17.2825 13.5987 16.09 15.0293L20.7803 19.7197C21.0732 20.0126 21.0732 20.4874 20.7803 20.7803C20.4874 21.0732 20.0126 21.0732 19.7197 20.7803L15.0293 16.09Z" fill="rgba(255,255,255,0.5)" />
            </svg>
            <span
              className="text-[14px] leading-[20px] text-[rgba(255,255,255,0.8)] font-mono whitespace-nowrap sim-cursor"
              style={{ fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace" }}
            >
              {displayed}
            </span>
          </div>
        </div>
      )}

      {/* SVG ray overlay */}
      <svg
        ref={svgRef}
        className="absolute inset-0 z-[1050] pointer-events-none"
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          <filter id="sim-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {computedRays.map((ray) => {
          const retractStyle = retracting
            ? { animation: `sim-retract 800ms ease-in forwards`, "--ray-len": `${ray.length}px` } as React.CSSProperties
            : {};

          return (
            <g key={ray.node.id}>
              {/* Glow line */}
              <line
                x1={ray.ox} y1={ray.oy} x2={ray.dx} y2={ray.dy}
                stroke={ray.node.color}
                strokeWidth="4"
                strokeOpacity="0.15"
                strokeDasharray={ray.length}
                strokeDashoffset={retracting ? 0 : ray.length}
                filter="url(#sim-glow)"
                style={{
                  animation: retracting ? undefined : `sim-ray-draw ${RAY_DRAW_DURATION}ms ease-out forwards`,
                  ...retractStyle,
                }}
              />
              {/* Core line */}
              <line
                x1={ray.ox} y1={ray.oy} x2={ray.dx} y2={ray.dy}
                stroke={ray.node.color}
                strokeWidth="1.5"
                strokeOpacity="0.7"
                strokeDasharray={ray.length}
                strokeDashoffset={retracting ? 0 : ray.length}
                style={{
                  animation: retracting ? undefined : `sim-ray-draw ${RAY_DRAW_DURATION}ms ease-out forwards`,
                  ...retractStyle,
                }}
              />

              {/* Data packet */}
              {!retracting && (
                <circle r="2.5" fill={ray.node.color} fillOpacity="0.9">
                  <animateMotion
                    dur="2s"
                    repeatCount="indefinite"
                    path={`M${ray.ox},${ray.oy} L${ray.dx},${ray.dy}`}
                    begin={`${RAY_DRAW_DURATION / 1000}s`}
                  />
                </circle>
              )}

              {/* Endpoint dot */}
              <circle
                cx={ray.dx} cy={ray.dy} r="4"
                fill={ray.node.color}
                style={{
                  opacity: retracting ? 0 : 0,
                  animation: retracting
                    ? "sim-fade-out 400ms ease forwards"
                    : `sim-pulse 2s ease-in-out ${RAY_DRAW_DURATION}ms infinite`,
                  transformOrigin: `${ray.dx}px ${ray.dy}px`,
                }}
              />

              {/* Label */}
              <foreignObject
                x={ray.dx + 8} y={ray.dy - 10}
                width="180" height="24"
                style={{
                  opacity: retracting ? 0 : 0,
                  animation: retracting
                    ? "sim-fade-out 400ms ease forwards"
                    : `sim-label-in 500ms ease ${RAY_DRAW_DURATION + 100}ms forwards`,
                }}
              >
                <span
                  style={{
                    color: ray.node.color,
                    fontSize: "11px",
                    lineHeight: "16px",
                    fontFamily: "'Segoe UI Variable', 'Segoe UI', sans-serif",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    textShadow: `0 0 12px ${ray.node.color}40`,
                  }}
                >
                  {ray.node.label}
                </span>
              </foreignObject>
            </g>
          );
        })}
      </svg>

      {/* Counter + button — positioned below the pin */}
      {(showCounter || (phase === "retracting" && !showCounter)) && (
        <div
          className="absolute left-0 right-0 z-[1200] pointer-events-none flex flex-col items-center"
          style={{
            top: "58%",
            ...(phase === "retracting" ? { animation: "sim-fade-out 600ms ease forwards" } : {}),
          }}
        >
          {showCounter && (
            <div
              style={{
                opacity: 0,
                animation: "sim-fade-in 900ms cubic-bezier(0.25,0.46,0.45,0.94) forwards",
              }}
            >
              <p
                className="text-[20px] leading-[28px] text-[rgba(255,255,255,0.7)] text-center font-['Segoe_UI_Variable',sans-serif]"
                style={{ fontVariationSettings: "'opsz' 14" }}
              >
                3 searches. 9 connections.
                <br />
                <span className="text-white font-semibold">Your data is everywhere.</span>
              </p>
            </div>
          )}

          {showButton && (
            <div
              className="mt-[28px] pointer-events-auto"
              style={{
                opacity: 0,
                animation: "sim-fade-in 900ms cubic-bezier(0.25,0.46,0.45,0.94) forwards",
              }}
            >
              <button
                onClick={handleProtect}
                className="px-[40px] py-[14px] rounded-[10px] bg-[#6d4aff] text-white text-[16px] leading-[22px] font-semibold font-['Segoe_UI_Variable',sans-serif] cursor-pointer transition-all duration-200 hover:bg-[#7c5cff] hover:shadow-[0_0_30px_rgba(109,74,255,0.4)] active:scale-[0.97]"
                style={{ fontVariationSettings: "'opsz' 12" }}
              >
                Continue
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
