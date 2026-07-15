import type { ActivityEntryData } from "../../v4-in-plain-sight/data/activityEntries";
import { Search, Globe, Smartphone } from "lucide-react";

/**
 * Hybrid Act 1 card copy — broader, category-level lines (Direction 2).
 * Scoped to Hybrid only; v4's `ACTIVITY_ENTRIES` keeps its narrative diary copy.
 */
export const HYBRID_ACTIVITY_ENTRIES: ActivityEntryData[] = [
  {
    id: "search",
    icon: Search,
    textKey: "hybrid.entry.search",
    text: "Every search you make",
    category: "search",
  },
  {
    id: "site",
    icon: Globe,
    textKey: "hybrid.entry.site",
    text: "Every site you open",
    category: "browsing",
  },
  {
    id: "app",
    icon: Smartphone,
    textKey: "hybrid.entry.app",
    text: "Every app you use",
    category: "app",
  },
];
