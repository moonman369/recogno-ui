import { cx } from '../lib/format';

/**
 * The mark: three stacked strokes resolving into one, for "many problems, one
 * pattern". Kept as inline SVG so it inherits ink colour and needs no asset.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cx('size-5', className)}>
      <path
        d="M4 6.5h9M4 12h13M4 17.5h6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.45"
      />
      <circle cx="19" cy="17.5" r="3" stroke="currentColor" strokeWidth="2.2" fill="none" />
    </svg>
  );
}

export function Brand({ className, showName = true }: { className?: string; showName?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-2', className)}>
      <BrandMark className="text-accent" />
      {showName ? (
        <span className="text-sm font-semibold tracking-tight text-ink">Recogno</span>
      ) : null}
    </span>
  );
}
