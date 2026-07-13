import type { LucideIcon } from "lucide-react";
import { Search, Landmark, Play, ShoppingBag, MessageCircle } from "lucide-react";

export interface ActivityEntryData {
  id: string;
  icon: LucideIcon;
  /** i18n key (kept for future extraction). */
  textKey: string;
  /** Default English copy. All entries are deliberately mundane and archetypal —
   * NONE of this is the user's real activity. */
  text: string;
  category: string;
}

/**
 * Curated, ordered list of 5 illustrative "diary" entries — everyday, relatable
 * moments. These are intentionally generic examples of a typical day online —
 * the app never reads the user's real history, searches, or app usage.
 */
export const ACTIVITY_ENTRIES: ActivityEntryData[] = [
  { id: "search", icon: Search, textKey: "v4.entry.search", text: "Searched: “best pizza place near me”", category: "search" },
  { id: "bank", icon: Landmark, textKey: "v4.entry.bank", text: "Checked your bank balance before payday", category: "finance" },
  { id: "stream", icon: Play, textKey: "v4.entry.stream", text: "Watched a couple episodes of your favorite show", category: "media" },
  { id: "shop", icon: ShoppingBag, textKey: "v4.entry.shop", text: "Shopped for a birthday gift for a friend", category: "shopping" },
  { id: "messages", icon: MessageCircle, textKey: "v4.entry.messages", text: "Messaged family on the group chat", category: "messaging" },
];
