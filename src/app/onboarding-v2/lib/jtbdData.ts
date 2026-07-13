export type JtbdId =
  | "downloading"
  | "travel"
  | "privacy"
  | "gaming"
  | "streaming"
  | "bypass";

export interface JtbdOption {
  id: JtbdId;
  label: string;
}

export const JTBD_OPTIONS: JtbdOption[] = [
  { id: "downloading", label: "Downloading" },
  { id: "travel", label: "Travel and Wi-Fi safety" },
  { id: "privacy", label: "Privacy and security" },
  { id: "gaming", label: "Gaming" },
  { id: "streaming", label: "Streaming" },
  { id: "bypass", label: "Bypass restrictions" },
];

/** Short, knowing "wink" line per JTBD — with the user, never at them; no
 * capability-overclaiming (no "watch anything anywhere", no circumvention
 * endorsement). Shown next to the idea-bubble illustration on the grid
 * picker (`JtbdGridPanel`) once a card is selected. Centralized here (the
 * project's existing i18n-ready data layer for JTBD content, alongside
 * `JTBD_OPTIONS`/`CONTEXT`) rather than inline in the component. No emoji —
 * kept consistent with the rest of this app's copy, which never uses one. */
export const JTBD_WINK_COPY: Record<JtbdId, string> = {
  downloading: "Your business is your business.",
  travel: "That airport Wi-Fi was never your friend.",
  privacy: "Trust no network. We'll handle the rest.",
  gaming: "Rage quit in peace. Nobody's watching.",
  streaming: "We won't tell anyone about the reality TV.",
  bypass: "Some walls are meant to be walked around.",
};

/** The grid picker's (`JtbdGridPanel`) primary CTA label once a JTBD is
 * selected — full per-JTBD strings (not "Tune for " + a word looked up
 * elsewhere), so translators can adapt word order / the "access" mapping for
 * "Bypass restrictions" naturally per locale, rather than concatenating a
 * shared prefix at runtime. `JTBD_CONTINUE_LABEL_DEFAULT` is the
 * pre-selection label, unchanged from before this addition. */
export const JTBD_CONTINUE_LABEL_DEFAULT = "Continue";

export const JTBD_CONTINUE_LABEL: Record<JtbdId, string> = {
  downloading: "Tune for downloading",
  travel: "Tune for travel",
  privacy: "Tune for privacy",
  gaming: "Tune for gaming",
  streaming: "Tune for streaming",
  bypass: "Tune for access",
};

type CountryCopy = Record<JtbdId, string>;

// Country names must match the `country` returned by IP detection.
const CONTEXT: Record<string, CountryCopy> = {
  "United Kingdom": {
    downloading:
      "The UK's Investigatory Powers Act requires internet providers to store your browsing history for 12 months, including download activity. Government agencies can access these records without a warrant. A VPN encrypts your downloads so your provider logs show only an encrypted connection.",
    travel:
      "UK public Wi-Fi networks in cafés, trains, and airports are largely unencrypted. Attackers on the same network can intercept login credentials and payment details. VPN encrypts all traffic the moment you connect, even on open networks.",
    privacy:
      "UK law allows bulk data collection by intelligence agencies under the Investigatory Powers Act. Your internet provider is legally required to keep records of every website you visit. A VPN prevents your provider from seeing your activity and makes bulk surveillance significantly harder.",
    gaming:
      "UK gamers face ISP throttling during peak hours, especially on bandwidth-heavy connections. Some providers deliberately slow gaming traffic to manage network load. VPN hides your traffic type so your provider cannot selectively throttle gaming sessions.",
    streaming:
      "Many streaming libraries differ between the UK and other regions due to licensing agreements. Content available in one country may be blocked or limited in another. VPN lets you appear to be browsing from a different location, giving you access to broader libraries.",
    bypass:
      "UK internet providers are required to block access to certain categories of websites under court orders and voluntary agreements. Some workplace and university networks add additional restrictions. VPN routes your traffic through an encrypted tunnel that bypasses these filters.",
  },
  "United States": {
    downloading:
      "US internet providers can legally monitor and sell your browsing data, including download history, since the repeal of FCC privacy rules in 2017. Some providers actively issue warnings for certain download activity. A VPN makes your downloads invisible to your provider.",
    travel:
      "Public Wi-Fi in US airports, hotels, and coffee chains is a frequent target for man-in-the-middle attacks. The FTC has documented cases of hotel Wi-Fi networks injecting tracking cookies. VPN encrypts everything before it leaves your device.",
    privacy:
      "The US has no comprehensive federal privacy law. Internet providers can collect, use, and sell your browsing history without explicit consent. A VPN ensures your provider sees only encrypted traffic, not the sites you visit or the data you send.",
    gaming:
      "Major US internet providers have been documented throttling gaming and streaming traffic during peak hours. Without net neutrality rules, providers can prioritize or deprioritize traffic by type. VPN prevents your provider from identifying and throttling gaming traffic.",
    streaming:
      "Streaming catalogs in the US often differ from those available in other countries due to regional licensing deals. Some content is exclusive to specific regions. A VPN lets you access libraries from other countries by connecting through servers in those locations.",
    bypass:
      "School, workplace, and some public networks in the US commonly block social media, streaming, and other categories of websites. Some states have enacted laws restricting access to certain types of online content. VPN tunnels through these network-level restrictions.",
  },
  Germany: {
    downloading:
      "Germany has strict copyright enforcement laws, and rights holders actively monitor P2P traffic through direct IP tracking. Legal notices carrying significant fines are commonly sent to IP addresses identified in file-sharing activity. A VPN replaces your IP so your real address is not exposed.",
    travel:
      "German public Wi-Fi availability has expanded rapidly, but many networks in transit stations and smaller venues lack encryption. The Störerhaftung liability framework was reformed but awareness of risks remains low. VPN secures your connection on any network automatically.",
    privacy:
      "Germany has strong data protection laws under GDPR and the BDSG, but intelligence agencies retain surveillance capabilities under the BND Act. Your internet provider still logs connection metadata as required by data retention rules. VPN prevents your provider from recording which sites you visit.",
    gaming:
      "Some German internet providers throttle bandwidth-intensive connections during evening peak hours. Latency-sensitive gaming traffic can be affected by provider-level traffic management. VPN can route your traffic through optimized paths and prevent protocol-based throttling.",
    streaming:
      "German streaming libraries are shaped by strict regional licensing, and some international content is unavailable or delayed. Geo-blocking is widely enforced across major platforms. VPN allows you to connect through servers in other countries to access broader catalogs.",
    bypass:
      "Certain websites and services are blocked in Germany due to regulatory orders, particularly around gambling and specific content categories. Corporate and university networks frequently add their own restrictions. VPN bypasses both network-level and regulatory blocks.",
  },
  France: {
    downloading:
      "France's HADOPI authority monitors P2P downloads and issues graduated warnings that can lead to fines. Internet providers are required to cooperate with this monitoring and identify subscribers by IP. A VPN prevents your real IP from being associated with download activity.",
    travel:
      "Wi-Fi in French cafés, métro stations, and hotels often requires minimal authentication and uses weak encryption. The density of open networks in major cities increases exposure to interception. VPN encrypts all your traffic regardless of the network's security.",
    privacy:
      "France's intelligence law of 2015 permits bulk collection of internet metadata by intelligence agencies. Internet providers retain connection logs as required by French data retention rules. VPN ensures your browsing activity is encrypted and invisible to your provider.",
    gaming:
      "French internet providers, particularly on DSL infrastructure, may apply traffic shaping during peak hours that affects gaming latency. Some multiplayer servers in other regions add additional latency due to routing. VPN can optimize routing paths and prevent traffic-type discrimination.",
    streaming:
      "French streaming platforms carry content libraries specific to France due to strict cultural licensing rules and media chronology regulations. Some international content arrives later or not at all. VPN lets you access content libraries from other regions by connecting through servers there.",
    bypass:
      "French authorities can order internet providers to block specific websites, and these orders are enforced at the DNS level. Some workplaces and educational institutions layer additional filtering. VPN tunnels past DNS-level and network-level blocks.",
  },
  Netherlands: {
    downloading:
      "Dutch law was updated to clarify that downloading copyrighted material is illegal, reversing the previous tolerance. Rights holders can now request ISPs to identify users by IP address. A VPN ensures your IP is not exposed during download activity.",
    travel:
      "The Netherlands has widespread public Wi-Fi, especially in trains, libraries, and city centers, but most networks lack proper encryption. High density of connected devices on these networks increases vulnerability. VPN secures your session on any public network.",
    privacy:
      "The Dutch intelligence services operate under the Intelligence and Security Services Act, which permits bulk data interception including internet traffic. Although a referendum challenged the law, its core provisions remain. VPN prevents your provider from logging your browsing for potential collection.",
    gaming:
      "Dutch internet infrastructure is among the best in Europe, but ISP-level traffic management during peak hours can still introduce latency spikes for gaming. Some international game servers route inefficiently from the Netherlands. VPN can provide more direct routing to gaming servers.",
    streaming:
      "Content libraries available in the Netherlands differ from those in other countries due to EU and regional licensing. Some platforms offer reduced catalogs compared to larger markets. VPN lets you connect through servers in other countries to access their libraries.",
    bypass:
      "Dutch internet is largely unrestricted, but government-mandated DNS blocks exist for specific categories of sites. Corporate and educational networks often apply their own content filters. VPN routes traffic through an encrypted tunnel that bypasses DNS-level blocks.",
  },
};

const FALLBACK_COPY: CountryCopy = {
  downloading:
    "Internet providers in most countries can see your download activity and may be required to log or report it. Some jurisdictions have strict enforcement mechanisms that identify users by IP address. A VPN encrypts your downloads and hides your real IP from monitoring.",
  travel:
    "Public Wi-Fi networks around the world are commonly unencrypted, making them vulnerable to interception. Connecting without protection exposes your login credentials, messages, and browsing to anyone on the same network. VPN encrypts all traffic the moment you connect.",
  privacy:
    "Many countries require internet providers to retain logs of your browsing activity, and intelligence agencies in numerous jurisdictions can access this data. Even without legal requirements, providers often collect data for commercial purposes. VPN makes your activity invisible to your provider.",
  gaming:
    "Internet providers commonly apply traffic management that can throttle gaming connections during busy periods. Because they can see your traffic type, they can selectively slow down bandwidth-intensive gaming sessions. VPN hides your traffic type so your provider cannot single out gaming.",
  streaming:
    "Streaming services restrict their content libraries by country due to regional licensing agreements. The catalog you see depends on your apparent location. VPN lets you connect through servers in other countries, giving you access to their content libraries.",
  bypass:
    "Network administrators, internet providers, and governments in many countries block access to certain websites and services. These blocks typically operate at the DNS or IP level. VPN encrypts and tunnels your traffic past these restrictions.",
};

export function getJtbdContext(country: string, jtbd: JtbdId): string {
  return (CONTEXT[country] ?? FALLBACK_COPY)[jtbd];
}
