import { cx } from '../lib/format';

/**
 * The Recogno mark: a scan ring around a rising staircase.
 *
 * The ring is drawn open at the top so it reads as a sweep in progress — an
 * evaluation running, and a nod to the timer that scores every drill — rather
 * than a closed, generic circle. Inside, three steps climb left to right: the
 * step function is both "levelling up" and a shape any DSA reader recognises.
 * The top tread is green, the colour an editor uses for a passing test, so
 * correctness is the thing the eye lands on last and highest.
 *
 * Two tones by design. The ring sits at 45% of the accent, which composites to
 * exactly the deep supporting blue on our canvas, so the mark carries the
 * palette's grounding colour without hardcoding a second value that would stop
 * tracking the theme.
 *
 * Inline SVG rather than an asset: it inherits `currentColor` in monochrome
 * contexts and needs no network request.
 */
export function BrandMark({
  className,
  /** Ignore the palette and take the surrounding text colour. For muted placements. */
  monochrome = false,
}: {
  className?: string;
  monochrome?: boolean;
}) {
  const ring = monochrome ? 'currentColor' : 'var(--color-accent)';
  const steps = monochrome ? 'currentColor' : 'var(--color-accent)';
  const crown = monochrome ? 'currentColor' : 'var(--color-positive)';

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      fill="none"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cx('size-5', className)}
    >
      {/* 300° of arc, with the gap at twelve o'clock. */}
      <path d="M16.5 4.21A9 9 0 1 1 7.5 4.21" stroke={ring} opacity="0.45" />
      <path d="M7.6 15.2h2.8v-3h2.8v-3" stroke={steps} />
      <path d="M13.2 9.2h3.2" stroke={crown} />
    </svg>
  );
}

/**
 * The horizontal lockup for the site header.
 *
 * Tight tracking on a semibold grotesque — dev-tool precision. The optical gap
 * is a touch wider than the mark's own stroke so the two read as one unit
 * without the wordmark crowding the ring.
 */
export function Brand({
  className,
  showName = true,
  monochrome = false,
  /**
   * Drops the wordmark on small screens, keeping the mark.
   *
   * Done on the wordmark itself rather than by hiding a whole second `<Brand>`:
   * a `hidden` passed in from outside loses to the `inline-flex` on this
   * wrapper, since Tailwind settles conflicts by CSS source order.
   */
  markOnlyOnMobile = false,
  markClassName,
}: {
  className?: string;
  showName?: boolean;
  monochrome?: boolean;
  markOnlyOnMobile?: boolean;
  markClassName?: string;
}) {
  return (
    <span className={cx('inline-flex items-center gap-2.5', className)}>
      <BrandMark monochrome={monochrome} className={markClassName} />
      {showName ? (
        <span
          className={cx(
            'text-[15px] font-semibold leading-none tracking-[-0.02em]',
            markOnlyOnMobile && 'hidden sm:inline',
            monochrome ? undefined : 'text-ink',
          )}
        >
          Recogno
        </span>
      ) : null}
    </span>
  );
}

/**
 * The square app icon: the same staircase on a solid tile.
 *
 * The ring and the green tread are dropped deliberately. At favicon size a
 * three-colour mark inside a thin open arc turns to mush, and an icon that is
 * unreadable at 16px is not an icon. The tile carries the brand colour instead,
 * leaving one high-contrast shape to do the work.
 */
export function BrandTile({ className, rounded = 14 }: { className?: string; rounded?: number }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cx('size-8', className)}>
      <defs>
        <linearGradient id="recogno-tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#52A9FE" />
          <stop offset="100%" stopColor="#2C537C" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx={rounded} fill="url(#recogno-tile)" />
      <path
        d="M18 44h10V33h10V22h10"
        fill="none"
        stroke="#F4F5F7"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
