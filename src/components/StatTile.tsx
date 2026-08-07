import type { ReactNode } from 'react';
import { cx } from '../lib/format';

/**
 * A single current value. Deliberately not a chart — one number is a figure.
 *
 * Values use the font's proportional figures, not `tabular-nums`: tabular gives
 * every digit the width of a zero, which reads loose at display sizes. Tabular
 * belongs in columns that have to align vertically.
 */
export function StatTile({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'neutral' | 'accent';
}) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3.5">
      <p className="text-xs font-medium text-ink-faint">{label}</p>
      <p
        className={cx(
          'mt-1 text-2xl font-semibold tracking-tight',
          tone === 'accent' ? 'text-accent' : 'text-ink',
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-ink-faint">{hint}</p> : null}
    </div>
  );
}

/**
 * The one number a screen leads with. Exactly one per view — a second hero
 * means neither is the headline.
 */
export function HeroFigure({
  label,
  value,
  hint,
  tone = 'accent',
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'accent' | 'neutral';
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">{label}</p>
      <p
        className={cx(
          'mt-1 text-5xl font-semibold leading-none tracking-tight',
          tone === 'accent' ? 'text-accent' : 'text-ink',
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-2 text-sm text-ink-faint">{hint}</p> : null}
    </div>
  );
}

/**
 * A single ratio against a limit. The unfilled track is a lighter step of the
 * fill's own ramp, so the state reads across the whole bar.
 */
export function Meter({
  value,
  max,
  tone = 'accent',
  label,
}: {
  value: number;
  max: number;
  tone?: 'accent' | 'positive' | 'caution' | 'negative';
  label?: string;
}) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const fills = {
    accent: 'bg-accent',
    positive: 'bg-positive',
    caution: 'bg-caution',
    negative: 'bg-negative',
  } as const;
  const tracks = {
    accent: 'bg-accent/15',
    positive: 'bg-positive/15',
    caution: 'bg-caution/15',
    negative: 'bg-negative/15',
  } as const;

  return (
    <div
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cx('h-1.5 w-full overflow-hidden rounded-full', tracks[tone])}
    >
      <div
        className={cx('h-full rounded-full transition-[width] duration-500', fills[tone])}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}
