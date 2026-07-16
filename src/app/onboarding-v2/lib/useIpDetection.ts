import { useEffect, useState } from "react";

export interface GeoInfo {
  ip: string;
  country: string;
  countryCode: string; // ISO-2, lowercase (for flagcdn)
  city: string;
  isp: string;
  /** When false, connection-stage copy omits the ISP name and uses broad
   * "others along the way" phrasing instead. Defaults to true for the demo
   * fallback; a real geolocation response would set this from its confidence. */
  ispKnown: boolean;
  lat: number;
  lng: number;
}

// Demo location — forced to the United Kingdom (rich JTBD context copy).
const FALLBACK: GeoInfo = {
  ip: "86.11.24.132",
  country: "United Kingdom",
  countryCode: "gb",
  city: "London",
  isp: "BT",
  ispKnown: true,
  lat: 51.5,
  lng: -0.12,
};

export function useIpDetection() {
  // Demo: the location is forced to the United Kingdom. We still surface a brief
  // "loading" beat (`isLive` flips after a short delay) so the info-card
  // skeletons play and resolve to the UK values.
  const [geo] = useState<GeoInfo>(FALLBACK);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setIsLive(true), 700);
    return () => window.clearTimeout(id);
  }, []);

  return { geo, isLive };
}
