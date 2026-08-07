import { SPEED_WINDOW_SECONDS, scoreTone, speedCreditAt } from '../../lib/scoring';
import { cx, formatSeconds, percent } from '../../lib/format';

const FILL = {
  positive: 'bg-positive',
  caution: 'bg-caution',
  negative: 'bg-negative',
} as const;

/**
 * The elapsed clock and the speed credit still on the table, in one control.
 *
 * Speed is 20% of the composite and decays linearly to nothing at 90 seconds.
 * A bare `1:23` does not convey that; a draining bar does, and it is the
 * product's own arithmetic rather than invented urgency. Past the window it
 * settles into a spent state instead of alarming in red forever.
 */
export function SpeedMeter({ elapsed, frozen }: { elapsed: number; frozen: boolean }) {
  const credit = speedCreditAt(elapsed);
  const spent = credit === 0;
  const tone = scoreTone(credit);

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p
          className={cx(
            'font-mono text-lg leading-none tabular-nums',
            frozen ? 'text-ink-faint' : 'text-ink',
          )}
          aria-label="Time on this problem"
        >
          {formatSeconds(elapsed)}
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-ink-faint">
          {spent ? 'no speed credit' : `${percent(credit)} speed`}
        </p>
      </div>

      <div
        role="meter"
        aria-valuenow={Math.round(credit * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Speed credit remaining"
        title={`Speed score decays to zero at ${SPEED_WINDOW_SECONDS}s`}
        className="relative h-10 w-1.5 overflow-hidden rounded-full bg-surface-raised"
      >
        <div
          className={cx(
            'absolute inset-x-0 bottom-0 rounded-full transition-[height,background-color] duration-1000 ease-linear',
            spent ? 'bg-line-strong' : FILL[tone],
          )}
          style={{ height: `${Math.max(credit * 100, spent ? 4 : 0)}%` }}
        />
      </div>
    </div>
  );
}
