import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useReviewDueCount } from '../api/queries';
import { Brand } from './Brand';
import { AccountMenu } from './AccountMenu';
import { VerifyEmailBanner } from './VerifyEmailBanner';
import { cx } from '../lib/format';

const NAV = [
  { to: '/dashboard', label: 'Overview', short: 'Home' },
  { to: '/drill', label: 'Drill', short: 'Drill' },
  { to: '/review', label: 'Review', short: 'Review' },
  { to: '/decks', label: 'Decks', short: 'Decks' },
];

export function Layout() {
  const { data: due } = useReviewDueCount();
  const dueCount = due?.dueCount ?? 0;
  // Re-keys <main> so each navigation replays the entrance transition.
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh">
      <header className="glass-nav sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 sm:gap-5 sm:px-6 sm:py-2.5">
          <Link to="/" aria-label="Recogno home" className="shrink-0">
            {/* One lockup: the wordmark drops itself on a phone, the mark stays. */}
            <Brand markOnlyOnMobile markClassName="size-[18px]" />
          </Link>

          {/* Inline on a tablet and up; the bottom bar takes over below sm. */}
          <nav className="hidden items-center gap-0.5 sm:flex">
            {NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cx(
                    'relative rounded-lg px-2.5 py-1 text-[13px] transition-colors',
                    isActive
                      ? 'bg-surface-raised font-medium text-ink'
                      : 'text-ink-muted hover:bg-surface hover:text-ink',
                  )
                }
              >
                <span className="flex items-center gap-1.5">
                  {label}
                  {label === 'Review' && dueCount > 0 ? (
                    <span className="rounded-full bg-accent px-1.5 py-px text-[11px] font-semibold leading-tight text-canvas">
                      {dueCount > 99 ? '99+' : dueCount}
                    </span>
                  ) : null}
                </span>
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto">
            <AccountMenu />
          </div>
        </div>
      </header>

      <VerifyEmailBanner />

      <main
        key={pathname}
        // Extra bottom padding clears the fixed mobile tab bar.
        className="animate-rise mx-auto max-w-6xl px-4 py-8 pb-28 sm:px-6 sm:py-10 sm:pb-10"
      >
        <Outlet />
      </main>

      <MobileTabBar dueCount={dueCount} />
    </div>
  );
}

/**
 * Primary navigation on a phone.
 *
 * A bottom bar rather than a hamburger: there are only four destinations, they
 * are the whole app, and this keeps them one thumb-reach away instead of two
 * taps behind a menu. The safe-area padding keeps it clear of the iOS home
 * indicator.
 */
function MobileTabBar({ dueCount }: { dueCount: number }) {
  return (
    <nav
      aria-label="Primary"
      className="glass-nav fixed inset-x-0 bottom-0 z-20 pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <div className="flex items-stretch justify-around">
        {NAV.map(({ to, short, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cx(
                'relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors',
                isActive ? 'text-accent' : 'text-ink-faint',
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* A bar at the top edge, so the active state is not colour alone. */}
                <span
                  aria-hidden
                  className={cx(
                    'absolute inset-x-5 top-0 h-0.5 rounded-full transition-opacity duration-200',
                    isActive ? 'bg-accent opacity-100' : 'opacity-0',
                  )}
                />
                <span className="relative">
                  <TabIcon to={to} active={isActive} />
                  {label === 'Review' && dueCount > 0 ? (
                    <span className="absolute -right-2 -top-1.5 min-w-4 rounded-full bg-accent px-1 text-[9px] font-semibold leading-4 text-canvas">
                      {dueCount > 9 ? '9+' : dueCount}
                    </span>
                  ) : null}
                </span>
                {short}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

/** Small flat glyphs — legible at 18px without carrying detail that muddies. */
function TabIcon({ to, active }: { to: string; active: boolean }) {
  const stroke = active ? 2.1 : 1.8;

  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-[18px]" fill="none" stroke="currentColor">
      {to === '/dashboard' ? (
        <path
          d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z"
          strokeWidth={stroke}
          strokeLinejoin="round"
        />
      ) : null}
      {to === '/drill' ? (
        <>
          <circle cx="12" cy="12" r="7.5" strokeWidth={stroke} />
          <circle cx="12" cy="12" r="2.5" strokeWidth={stroke} />
        </>
      ) : null}
      {to === '/review' ? (
        <>
          <circle cx="12" cy="12" r="7.5" strokeWidth={stroke} />
          <path d="M12 7.5V12l3 2" strokeWidth={stroke} strokeLinecap="round" />
        </>
      ) : null}
      {to === '/decks' ? (
        <>
          <rect x="4" y="6" width="16" height="12" rx="2" strokeWidth={stroke} />
          <path d="M8 3.5h8" strokeWidth={stroke} strokeLinecap="round" />
        </>
      ) : null}
    </svg>
  );
}
