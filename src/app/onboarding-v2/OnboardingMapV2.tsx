import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion } from "motion/react";
import StatusGradient from "../../imports/StatusGradient";
import TargetingReticle from "./components/TargetingReticle";
import ShieldAura from "./components/ShieldAura";
import { TILE_URL, TILE_ATTRIBUTION, PIN_CSS, createPinHTML, type PinStatus } from "./lib/mapKit";
import { ENTRANCE_TIMING, sec } from "./lib/entranceTiming";

interface OnboardingMapV2Props {
  lat: number;
  lng: number;
  zoom: number;
  status: PinStatus;
  showPin: boolean;
  showBrackets: boolean;
  /** Darkens the map behind the JTBD workspace. */
  dim: boolean;
  /** Shift the pin's on-screen position right by N px (used by the v2 side-panel layout). */
  focusOffsetX?: number;
  /** Shift the pin's on-screen position down by N px (negative = up; used by
   * Hybrid to keep the targeting reticle 12px above the location chip). */
  focusOffsetY?: number;
}

export default function OnboardingMapV2({
  lat,
  lng,
  zoom,
  status,
  showPin,
  showBrackets,
  dim,
  focusOffsetX = 0,
  focusOffsetY = 0,
}: OnboardingMapV2Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<L.Marker | null>(null);
  const [pinPos, setPinPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  // Skip the first reactive run of the fly/status effects — the mount effect
  // owns the cinematic entrance and must not be overridden.
  const flyInit = useRef(false);
  const statusInit = useRef(false);
  const focusOffsetXRef = useRef(focusOffsetX);
  focusOffsetXRef.current = focusOffsetX;
  const focusOffsetYRef = useRef(focusOffsetY);
  focusOffsetYRef.current = focusOffsetY;

  // Compute the center to fly to so the pin lands `focusOffsetX/Y` px from center.
  const flyTarget = (map: L.Map, la: number, ln: number, z: number): L.LatLng => {
    const offX = focusOffsetXRef.current;
    const offY = focusOffsetYRef.current;
    if (!offX && !offY) return L.latLng(la, ln);
    const px = map.project([la, ln], z).subtract(L.point(offX, offY));
    return map.unproject(px, z);
  };

  // Init map once — start zoomed OUT, then fly in toward the user (entrance).
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [30, 10],
      zoom: 2,
      minZoom: 2,
      maxZoom: 7,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
      maxBoundsViscosity: 0.8,
    });
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, subdomains: "abcd" }).addTo(map);
    L.control.attribution({ position: "bottomright", prefix: false }).addTo(map);
    mapRef.current = map;

    const pin = L.marker([lat, lng], {
      icon: L.divIcon({
        html: createPinHTML(status, true), // entrance: spring-in + delayed pulse
        className: `ob2-pin${showPin ? "" : " ob2-pin--hidden"}`,
        iconSize: [96, 96],
        iconAnchor: [48, 48],
      }),
      zIndexOffset: 500,
      interactive: false,
    }).addTo(map);
    pinRef.current = pin;

    const syncPinPos = () => {
      const p = map.latLngToContainerPoint(pin.getLatLng());
      setPinPos({ x: p.x, y: p.y });
    };
    syncPinPos();
    map.on("move zoom resize", syncPinPos);

    requestAnimationFrame(() => map.invalidateSize());
    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
      // Begin the cinematic zoom-in toward the user's location at T=0.
      map.flyTo(flyTarget(map, lat, lng, zoom), zoom, { duration: sec(ENTRANCE_TIMING.mapZoomDuration), easeLinearity: 0.2 });
      syncPinPos();
    }, 60);

    return () => {
      clearTimeout(resizeTimer);
      map.off("move zoom resize", syncPinPos);
      map.remove();
      mapRef.current = null;
      pinRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fly to new lat/lng/zoom (geo correction + phase changes). Skips first run.
  useEffect(() => {
    const map = mapRef.current;
    const pin = pinRef.current;
    if (!map || !pin) return;
    if (!flyInit.current) {
      flyInit.current = true;
      return;
    }
    pin.setLatLng([lat, lng]);
    map.flyTo(flyTarget(map, lat, lng, zoom), zoom, { duration: 1.6, easeLinearity: 0.35 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, zoom, focusOffsetX, focusOffsetY]);

  // Update pin color on status change. Skips first run so the entrance pin
  // (created in the mount effect) is preserved.
  useEffect(() => {
    const pin = pinRef.current;
    if (!pin) return;
    if (!statusInit.current) {
      statusInit.current = true;
      return;
    }
    pin.setIcon(
      L.divIcon({
        html: createPinHTML(status),
        className: `ob2-pin${showPin ? "" : " ob2-pin--hidden"}`,
        iconSize: [96, 96],
        iconAnchor: [48, 48],
      }),
    );
  }, [status, showPin]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <style>{PIN_CSS}</style>
      {/* `isolate` keeps Leaflet's internal pane z-indices (200–700) contained
          so they never paint over the onboarding overlay/panels. */}
      <div
        ref={containerRef}
        className="absolute inset-0 isolate bg-[#16141c]"
        style={{ filter: dim ? "blur(6px)" : "none", transition: "filter 0.6s ease-in-out" }}
      />

      {/* Top status gradient (coral / slate / teal) — fades in during the
          entrance zoom, then crossfades color on status change. */}
      <motion.div
        className="pointer-events-none absolute left-0 right-0 top-0 z-[30] h-[300px]"
        style={{ transform: "scaleY(-1)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: sec(ENTRANCE_TIMING.gradientFadeStart), duration: sec(ENTRANCE_TIMING.gradientFadeDuration), ease: "easeInOut" }}
      >
        <StatusGradient vpnStatus={status} />
      </motion.div>

      {/* Bottom vignette so the info card and text stay readable */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[20] h-[300px] bg-gradient-to-t from-[#0f0d14] via-[rgba(15,13,20,0.6)] to-transparent" />

      <TargetingReticle x={pinPos.x} y={pinPos.y} visible={showBrackets} />
      <ShieldAura x={pinPos.x} y={pinPos.y} visible={status === "protected" && !dim} />

      {/* Dim overlay for the JTBD workspace */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-[45] bg-[#0b1614]"
        initial={false}
        animate={{ opacity: dim ? 0.55 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
    </div>
  );
}
