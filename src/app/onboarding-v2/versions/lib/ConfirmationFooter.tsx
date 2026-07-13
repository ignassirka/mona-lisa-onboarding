import { motion } from "motion/react";
import { VPN_SERVER } from "../../lib/server";

/** Compact protected-state confirmation shown by every version's Act 3:
 * {VPN flag} "You appear to be in {VPN country}" · "VPN IP {VPN IP}".
 * All values are the real VPN server details from the connection. */
export default function ConfirmationFooter({ delay = 0.6 }: { delay?: number }) {
  return (
    <motion.div
      className="flex items-center justify-center gap-[10px] whitespace-nowrap font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.6)]"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
    >
      <span className="inline-flex items-center gap-[6px]">
        <img
          src={`https://flagcdn.com/${VPN_SERVER.countryCode}.svg`}
          alt=""
          className="h-[12px] w-[18px] rounded-[2px] object-cover"
        />
        You appear to be in {VPN_SERVER.country}
      </span>
      <span className="text-[rgba(255,255,255,0.25)]">·</span>
      <span className="text-[#2cffcc]">VPN IP {VPN_SERVER.vpnIp}</span>
    </motion.div>
  );
}
