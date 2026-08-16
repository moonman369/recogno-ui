import { SPEED_FLOOR_SECONDS, SPEED_GRACE_SECONDS, scoreTone, speedCreditAt } from '../../lib/scoring';
import { cx, formatSeconds, percent } from '../../lib/format';

const FILL = {
  positive: 'bg-positive',
  caution: 'bg-caution',
  negative: 'bg-negative',
} as const;

/**
 * The elapsed clock and the speed credit still on the table, in one control.
 *
 * Speed is 20% of the composite: flat for the first 45 seconds, then decaying
 * to nothing at 300. A bare `1:23` does not convey that; a draining bar does,
 * and it is the grader's own arithmetic rather than invented urgency. Past the
 * floor it settles into a spent state instead of alarming in red forever.
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
        title={`Full speed credit up to ${SPEED_GRACE_SECONDS}s, then decaying to zero at ${SPEED_FLOOR_SECONDS}s`}
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
