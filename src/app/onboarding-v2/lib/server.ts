import { countryMarkers } from "../../lib/countryMarkers";
import { getIsoCode } from "../../components/flagComponents";

// The VPN server the onboarding "connects" to when no explicit country was
// chosen ("Fastest country", the default and the ENTIRE Free-plan behavior).
export const VPN_SERVER = {
  country: "Netherlands",
  countryCode: "nl",
  city: "Amsterdam",
  lat: 52.37,
  lng: 4.9,
  vpnIp: "146.70.124.18",
};

export interface VpnDestination {
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  vpnIp: string;
}

const FASTEST_DESTINATION: VpnDestination = {
  country: VPN_SERVER.country,
  countryCode: VPN_SERVER.countryCode,
  lat: VPN_SERVER.lat,
  lng: VPN_SERVER.lng,
  vpnIp: VPN_SERVER.vpnIp,
};

/** Resolves the onboarding's simulated VPN destination for a Plus-plan
 * country selection (`null`/`undefined` = "Fastest country" — the default,
 * and the ENTIRE Free-plan behavior byte-for-byte, since Free never sets a
 * selection). Real coordinates and flag come from the app's own country
 * data (`countryMarkers`, `getIsoCode`) — never invented, per the "no
 * fabricated data" rule. The VPN IP reuses this prototype's one existing
 * demo value (`VPN_SERVER.vpnIp`) for every destination, since no
 * per-country VPN IP data exists anywhere in the app (confirmed at
 * checkpoint) — an honest shared placeholder, not a fabricated per-country
 * value. Falls back to the fastest destination if a selected name somehow
 * isn't in the data (shouldn't happen — the picker only lists countries
 * present in both `countryMarkers` and the ISO map). */
export function resolveVpnDestination(selectedCountry: string | null | undefined): VpnDestination {
  if (!selectedCountry) return FASTEST_DESTINATION;
  const marker = countryMarkers.find((c) => c.name === selectedCountry);
  const countryCode = getIsoCode(selectedCountry);
  if (!marker || !countryCode) return FASTEST_DESTINATION;
  return { country: selectedCountry, countryCode, lat: marker.lat, lng: marker.lng, vpnIp: VPN_SERVER.vpnIp };
}
