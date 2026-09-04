/**
 * Record grooves. Concentric rings drawn as inline SVG — no image request, no
 * library, and it scales to any size without going soft.
 *
 * Decorative only: aria-hidden, so a screen reader never announces it.
 */
export function Sulcos({ className = "" }: { className?: string }) {
  // Uneven spacing reads as a record; evenly spaced rings read as a target.
  const raios = [46, 43, 41.5, 38, 36.5, 33, 29, 27.5, 23, 18, 14];

  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {raios.map((r, i) => (
        <circle
          key={r}
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={i % 3 === 0 ? 0.35 : 0.18}
        />
      ))}
      {/* label and spindle */}
      <circle cx="50" cy="50" r="9" fill="currentColor" opacity="0.14" />
      <circle cx="50" cy="50" r="1.1" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
