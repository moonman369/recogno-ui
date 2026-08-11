import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDecks, useReviewDueCount } from '../api/queries';
import { PageHeader } from '../components/PageHeader';
import { StatTile } from '../components/StatTile';
import { Avatar } from '../components/Avatar';
import { Badge, Card, Skeleton } from '../components/ui';
import { useAuth } from '../auth/useAuth';
import { absoluteTime, relativeTime } from '../lib/format';

const DESTINATIONS = [
  {
    to: '/drill',
    title: 'Drill',
    body: 'Draw a problem, name the pattern, argue the why.',
    cta: 'Start drilling',
  },
  {
    to: '/review',
    title: 'Review',
    body: 'Everything the scheduler has brought back around.',
    cta: 'See the queue',
  },
  {
    to: '/decks',
    title: 'Decks',
    body: 'Your problem sets, and adding new problems to them.',
    cta: 'Browse decks',
  },
] as const;

/**
 * The landing after sign-in.
 *
 * Dropping someone straight into a timed drill gives them no chance to see
 * where they stand or choose what to do — this is the moment to orient, then
 * commit.
 */
export function DashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const notice = (location.state as { notice?: string } | null)?.notice;
  const [noticeShown, setNoticeShown] = useState(Boolean(notice));
  const counts = useReviewDueCount();
  const decks = useDecks();

  const dueCount = counts.data?.dueCount ?? 0;
  const deckCount = decks.data?.decks.length ?? 0;
  const problemCount = decks.data?.decks.reduce((sum, deck) => sum + deck.problemCount, 0) ?? 0;

  const firstName = user?.displayName?.trim().split(/\s+/)[0];

  return (
    <div>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
        description={
          dueCount > 0
            ? `You have ${dueCount} card${dueCount === 1 ? '' : 's'} due. Clearing them is the fastest way to stretch your intervals.`
            : 'Nothing is due right now. You can still drill ahead — the scheduler will pull the soonest-due problem.'
        }
      />

      {notice && noticeShown ? (
        <div className="animate-rise mb-6 flex items-start gap-3 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3">
          <p className="min-w-0 flex-1 text-sm text-ink">{notice}</p>
          <button
            type="button"
            onClick={() => setNoticeShown(false)}
            aria-label="Dismiss"
            className="shrink-0 rounded px-1 text-sm text-ink-faint transition-colors hover:text-ink"
          >
            ×
          </button>
        </div>
      ) : null}

      {user ? <ProfileCard /> : null}

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {counts.isPending ? (
          <>
            <Skeleton className="h-[5.5rem]" />
            <Skeleton className="h-[5.5rem]" />
            <Skeleton className="h-[5.5rem]" />
          </>
        ) : (
          <>
            <StatTile
              label="Due now"
              value={dueCount}
              tone={dueCount > 0 ? 'accent' : 'neutral'}
              hint={
                dueCount === 0 && counts.data?.nextDueAt ? (
                  <span title={absoluteTime(counts.data.nextDueAt)}>
                    Next {relativeTime(counts.data.nextDueAt)}
                  </span>
                ) : (
                  'Across both flows'
                )
              }
            />
            <StatTile label="Decks" value={deckCount} hint="Including system decks" />
            <StatTile label="Problems" value={problemCount} hint="Across every deck" />
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {DESTINATIONS.map((destination, index) => (
          <Link
            key={destination.to}
            to={destination.to}
            className="animate-rise group flex flex-col rounded-xl border border-line bg-surface p-5 transition-all duration-300 ease-[var(--ease-quint)] hover:-translate-y-1 hover:border-line-strong hover:shadow-float"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-medium text-ink">{destination.title}</h2>
              {destination.to === '/review' && dueCount > 0 ? (
                <Badge tone="accent">{dueCount}</Badge>
              ) : null}
            </div>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{destination.body}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm text-accent">
              {destination.cta}
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Identity at a glance — who you are signed in as, and since when. */
function ProfileCard() {
  const { user } = useAuth();
  if (!user) return null;

  const label = user.displayName?.trim() || user.email;

  return (
    <Card className="mb-8 flex flex-wrap items-center gap-4 sm:gap-5">
      <Avatar user={user} className="size-12 text-lg sm:size-14 sm:text-xl" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-base font-semibold tracking-tight sm:text-lg">{label}</p>
          <Badge tone={user.emailVerified ? 'positive' : 'caution'}>
            {user.emailVerified ? 'Verified' : 'Unverified'}
          </Badge>
        </div>
        <p className="mt-0.5 truncate text-sm text-ink-faint">{user.email}</p>
      </div>

      <div className="w-full text-left sm:w-auto sm:text-right">
        <p className="text-xs uppercase tracking-widest text-ink-faint">Member since</p>
        <p className="mt-1 text-sm text-ink-muted" title={absoluteTime(user.createdAt)}>
          {new Date(user.createdAt).toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>
    </Card>
  );
}
