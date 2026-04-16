import { useState } from "react";
import { getFlagUrl } from "./flagComponents";

const COUNTRIES = [
  { name: "Switzerland", tag: "Fastest" },
  { name: "Netherlands", tag: null },
  { name: "Sweden", tag: null },
  { name: "Iceland", tag: null },
  { name: "Germany", tag: null },
  { name: "Japan", tag: null },
  { name: "United States", tag: null },
  { name: "Singapore", tag: null },
];

const STAGGER = 80;
const ITEM_DURATION = 700;
const EASING = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";

interface OnboardingCountryPickerProps {
  onConnect: (country: string) => void;
}

export default function OnboardingCountryPicker({ onConnect }: OnboardingCountryPickerProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  return (
    <>
      <style>{`
        @keyframes picker-slide-in {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes picker-item-in {
          from {
            opacity: 0;
            transform: translateX(-12px);
            filter: blur(4px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
            filter: blur(0px);
          }
        }
      `}</style>

      <div
        className="absolute left-[8px] top-[8px] bottom-[8px] z-[1300] w-[340px] pointer-events-auto"
        style={{
          animation: `picker-slide-in 700ms ${EASING} forwards`,
        }}
      >
        <div className="relative w-full h-full overflow-hidden rounded-[8px] backdrop-blur-[16px] bg-[rgba(22,20,28,0.75)] border border-[rgba(255,255,255,0.1)]">
          <div className="flex flex-col p-[24px] h-full">
            {/* Heading */}
            <div
              style={{
                opacity: 0,
                animation: `picker-item-in ${ITEM_DURATION}ms ${EASING} 400ms forwards`,
              }}
            >
              <h2
                className="text-[24px] leading-[32px] font-bold text-white font-['Segoe_UI_Variable',sans-serif] tracking-[-0.01em]"
                style={{ fontVariationSettings: "'opsz' 24" }}
              >
                Choose your shield
              </h2>
            </div>

            {/* Subtitle */}
            <div
              className="mt-[8px]"
              style={{
                opacity: 0,
                animation: `picker-item-in ${ITEM_DURATION}ms ${EASING} 500ms forwards`,
              }}
            >
              <p
                className="text-[14px] leading-[20px] text-[rgba(255,255,255,0.5)] font-['Segoe_UI_Variable',sans-serif]"
                style={{ fontVariationSettings: "'opsz' 10.5" }}
              >
                Pick a server location to route your traffic through.
              </p>
            </div>

            {/* Country list */}
            <div className="flex flex-col mt-[24px] gap-[2px]">
              {COUNTRIES.map((country, i) => {
                const flagUrl = getFlagUrl(country.name);
                const delay = 600 + i * STAGGER;
                const isHovered = hoveredCountry === country.name;

                return (
                  <div
                    key={country.name}
                    style={{
                      opacity: 0,
                      animation: `picker-item-in ${ITEM_DURATION}ms ${EASING} ${delay}ms forwards`,
                    }}
                  >
                    <button
                      onClick={() => onConnect(country.name)}
                      onMouseEnter={() => setHoveredCountry(country.name)}
                      onMouseLeave={() => setHoveredCountry(null)}
                      className="flex items-center gap-[12px] w-full px-[12px] py-[10px] rounded-[8px] cursor-pointer transition-colors duration-150 text-left"
                      style={{
                        background: isHovered ? "rgba(255,255,255,0.08)" : "transparent",
                      }}
                    >
                      {/* Flag */}
                      {flagUrl ? (
                        <img
                          src={flagUrl}
                          alt={`${country.name} flag`}
                          className="shrink-0 rounded-[3px] object-cover"
                          style={{ width: 28, height: 19 }}
                        />
                      ) : (
                        <div
                          className="shrink-0 rounded-[3px] bg-[rgba(255,255,255,0.12)]"
                          style={{ width: 28, height: 19 }}
                        />
                      )}

                      {/* Name */}
                      <span
                        className="flex-1 text-[14px] leading-[20px] text-white font-['Segoe_UI_Variable',sans-serif]"
                        style={{
                          fontVariationSettings: "'opsz' 10.5",
                          fontWeight: country.tag ? 600 : 400,
                        }}
                      >
                        {country.name}
                      </span>

                      {/* Badge */}
                      {country.tag && (
                        <span
                          className="text-[11px] leading-[16px] px-[8px] py-[2px] rounded-[4px] bg-[rgba(109,74,255,0.2)] text-[#a78bfa] font-semibold font-['Segoe_UI_Variable',sans-serif]"
                          style={{ fontVariationSettings: "'opsz' 8" }}
                        >
                          {country.tag}
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
