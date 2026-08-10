/**
 * The get-ready count that runs before a problem's clock starts.
 *
 * It covers the statement rather than sitting beside it. Speed is 20% of the
 * composite, so a count you can read the problem through is worse than no count
 * at all — it would just hand back three seconds of free reading. The clock does
 * not start until this clears.
 */
export function CountdownOverlay({ value }: { value: number }) {
  return (
    <div
      className="glass absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl"
      role="status"
      aria-live="assertive"
      aria-label={`Starting in ${value}`}
    >
      <p
        // Keyed so each number replays the animation rather than cross-fading.
        key={value}
        className="animate-count text-7xl font-semibold tabular-nums tracking-tight text-accent"
      >
        {value}
      </p>
      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-ink-faint">Get ready</p>
    </div>
  );
}
