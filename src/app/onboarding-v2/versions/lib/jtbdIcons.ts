import type { JtbdId } from "../../lib/jtbdData";
import iconDownloading from "../../assets/jtbd-downloading.svg";
import iconTravel from "../../assets/jtbd-travel.svg";
import iconPrivacy from "../../assets/jtbd-privacy.svg";
import iconGaming from "../../assets/jtbd-gaming.svg";
import iconStreaming from "../../assets/jtbd-streaming.svg";
import iconBypass from "../../assets/jtbd-bypass.svg";

/** The JTBD category icons, shared by the grid picker (`JtbdGridPanel`) and
 * the tuned-result header (`TunedResult`, where the loader spinner
 * crossfades into the selected JTBD's icon). */
export const JTBD_ICONS: Record<JtbdId, string> = {
  downloading: iconDownloading,
  travel: iconTravel,
  privacy: iconPrivacy,
  gaming: iconGaming,
  streaming: iconStreaming,
  bypass: iconBypass,
};
