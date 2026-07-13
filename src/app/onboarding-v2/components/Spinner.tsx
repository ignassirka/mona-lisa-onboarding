export default function Spinner({ size = 40 }: { size?: number }) {
  return (
    <>
      <style>{`@keyframes ob2-spin { to { transform: rotate(360deg); } }`}</style>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        style={{ animation: "ob2-spin 0.9s linear infinite" }}
      >
        <circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
        <path
          d="M20 4 a16 16 0 0 1 16 16"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </>
  );
}
