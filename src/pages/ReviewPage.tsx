import { Link } from 'react-router-dom';
import { useReviewDueCount, useReviewQueue } from '../api/queries';
import type { ReviewQueueItem } from '../api/types';
import { PageHeader } from '../components/PageHeader';
import { HeroFigure, StatTile } from '../components/StatTile';
import { Badge, Button, Card, EmptyState, ErrorState, Loading } from '../components/ui';
import { MODE_LABEL, absoluteTime, cx, isDue, relativeTime } from '../lib/format';

export function ReviewPage() {
  const counts = useReviewDueCount();
  const queue = useReviewQueue();

  const items = queue.data?.items ?? [];
  const dueNow = items.filter((item) => isDue(item.dueAt));
  const upcoming = items.filter((item) => !isDue(item.dueAt));

  return (
    <div>
      <PageHeader
        title="Review"
        description="Everything the scheduler has brought back around, across both the recognition drill and your written notes."
        actions={
          <Link to="/drill">
            <Button size="sm">Start drilling</Button>
          </Link>
        }
      />

      {counts.isPending ? <Loading /> : null}
      {counts.isError ? (
        <ErrorState error={counts.error} onRetry={() => void counts.refetch()} />
      ) : null}

      {counts.data ? (
        <Card className="mb-8">
          <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-10">
            <HeroFigure
              label="Due now"
              value={counts.data.dueCount}
              tone={counts.data.dueCount > 0 ? 'accent' : 'neutral'}
              hint={
                counts.data.dueCount === 0 && counts.data.nextDueAt ? (
                  <span title={absoluteTime(counts.data.nextDueAt)}>
                    Nothing waiting. Next card {relativeTime(counts.data.nextDueAt)}.
                  </span>
                ) : counts.data.dueCount > 0 ? (
                  'Clear these and the intervals stretch out.'
                ) : (
                  'Nothing waiting.'
                )
              }
            />

            <div className="grid grid-cols-2 gap-3">
              <StatTile
                label="Recognition drills"
                value={counts.data.drillDueCount}
                hint="Name the pattern"
              />
              <StatTile
                label="Written notes"
                value={counts.data.noteDueCount}
                hint="Work it again"
              />
            </div>
          </div>
        </Card>
      ) : null}

      {queue.isPending ? <Loading label="Loading your queue…" /> : null}
      {queue.isError ? <ErrorState error={queue.error} onRetry={() => void queue.refetch()} /> : null}

      {queue.data ? (
        items.length === 0 ? (
          <EmptyState
            title="Nothing due"
            body="The queue is empty. You can still drill ahead — the scheduler will pull the soonest-due problem."
            action={
              <Link to="/drill">
                <Button variant="secondary" size="sm">
                  Drill ahead
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-8">
            {dueNow.length > 0 ? (
              <QueueSection title="Due now" count={dueNow.length} items={dueNow} highlight />
            ) : null}
            {upcoming.length > 0 ? (
              <QueueSection title="Coming up" count={upcoming.length} items={upcoming} />
            ) : null}
          </div>
        )
      ) : null}
    </div>
  );
}

function QueueSection({
  title,
  count,
  items,
  highlight,
}: {
  title: string;
  count: number;
  items: ReviewQueueItem[];
  highlight?: boolean;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-faint">{title}</h2>
        <span className="text-xs text-ink-faint">{count}</span>
      </div>

      <ul
        className={cx(
          'divide-y divide-line overflow-hidden rounded-xl border bg-surface',
          highlight ? 'border-accent/30' : 'border-line',
        )}
      >
        {items.map((item) => (
          <li
            key={`${item.problemId}-${item.mode}`}
            className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-raised"
          >
            <div className="min-w-0 flex-1">
              <Link
                to={item.mode === 'drill' ? '/drill' : `/problems/${item.problemId}/attempt`}
                className="block truncate text-sm font-medium text-ink hover:text-accent"
              >
                {item.title}
              </Link>
              <p className="mt-0.5 text-xs text-ink-faint">
                <Link to={`/decks/${item.deckId}`} className="hover:text-ink">
                  {item.deckName}
                </Link>
                {' · '}
                {item.reps} rep{item.reps === 1 ? '' : 's'}
                {item.lapses > 0 ? (
                  <span className="text-caution">
                    {' · '}
                    {item.lapses} lapse{item.lapses === 1 ? '' : 's'}
                  </span>
                ) : null}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Badge tone={item.mode === 'drill' ? 'accent' : 'neutral'}>
                {MODE_LABEL[item.mode]}
              </Badge>
              <span
                className={cx(
                  'w-20 text-right text-xs tabular-nums',
                  isDue(item.dueAt) ? 'text-accent' : 'text-ink-faint',
                )}
                title={absoluteTime(item.dueAt)}
              >
                {relativeTime(item.dueAt)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
