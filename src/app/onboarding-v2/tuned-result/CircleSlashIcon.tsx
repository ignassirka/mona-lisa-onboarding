interface CircleSlashIconProps {
  size?: number;
}

/** Locked-row "unavailable" glyph — a plain filled SVG (not a `lucide-react`
 * icon; its opacity is baked into the fill, not `currentColor`-driven) since
 * no icon in the existing set matched the requested "needs Plus" mark.
 * Shared by `StackedLayout`'s own hand-rolled locked paid-feature rows and
 * `ProfilesSummaryRow` (confirmed at checkpoint — the profiles row uses the
 * exact same locked-row visual language as its sibling rows). */
export default function CircleSlashIcon({ size = 20 }: CircleSlashIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.27309 5.15697C3.16697 6.46365 2.5 8.15394 2.5 10C2.5 14.1421 5.85786 17.5 10 17.5C11.8461 17.5 13.5363 16.833 14.843 15.7269L4.27309 5.15697ZM15.7269 14.843L5.15697 4.27309C6.46365 3.16697 8.15394 2.5 10 2.5C14.1421 2.5 17.5 5.85786 17.5 10C17.5 11.8461 16.833 13.5363 15.7269 14.843ZM10 18.75C14.8325 18.75 18.75 14.8325 18.75 10C18.75 5.16751 14.8325 1.25 10 1.25C5.16751 1.25 1.25 5.16751 1.25 10C1.25 14.8325 5.16751 18.75 10 18.75Z"
        fill="white"
        fillOpacity="0.7"
      />
    </svg>
  );
}
