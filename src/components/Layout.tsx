import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useReviewDueCount } from '../api/queries';
import { Brand } from './Brand';
import { AccountMenu } from './AccountMenu';
import { cx } from '../lib/format';

const NAV = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/drill', label: 'Drill' },
  { to: '/review', label: 'Review' },
  { to: '/decks', label: 'Decks' },
];

export function Layout() {
  const { data: due } = useReviewDueCount();
  const dueCount = due?.dueCount ?? 0;
  // Re-keys <main> so each navigation replays the entrance transition.
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh">
      <header className="glass-nav sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3 sm:gap-6">
          <Link to="/" aria-label="Recogno home">
            <Brand className="shrink-0" />
          </Link>

          <nav className="flex items-center gap-0.5">
            {NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cx(
                    'relative rounded-lg px-3 py-1.5 text-sm transition-colors',
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

      <main key={pathname} className="animate-rise mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
