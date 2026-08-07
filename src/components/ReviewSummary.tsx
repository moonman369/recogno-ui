import type { FsrsRating, ReviewCard } from '../api/types';
import { absoluteTime, fsrsStateLabel, relativeTime } from '../lib/format';
import { Badge } from './ui';

const RATING_TONE: Record<FsrsRating, 'negative' | 'caution' | 'positive' | 'accent'> = {
  Again: 'negative',
  Hard: 'caution',
  Good: 'positive',
  Easy: 'accent',
};

/** The FSRS card state after grading. Shared by the drill and commit flows. */
export function ReviewSummary({ review }: { review: ReviewCard }) {
  const stats: [string, string][] = [
    ['Interval', `${review.scheduledDays} day${review.scheduledDays === 1 ? '' : 's'}`],
    ['State', fsrsStateLabel(review.state)],
    ['Reps', String(review.reps)],
    ['Lapses', String(review.lapses)],
    ['Stability', review.stability.toFixed(2)],
    ['Difficulty', review.difficulty.toFixed(2)],
  ];

  return (
    <div className="rounded-lg border border-line bg-canvas p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-ink-faint">Scheduled</span>
          <Badge tone={RATING_TONE[review.rating]}>{review.rating}</Badge>
        </div>
        <span className="text-sm text-ink-muted" title={absoluteTime(review.dueAt)}>
          Back {relativeTime(review.dueAt)}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-2">
            <dt className="text-xs text-ink-faint">{label}</dt>
            <dd className="font-mono text-sm text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
