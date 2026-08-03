import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useReviewDueCount } from '../api/queries';
import { useAuth } from '../auth/useAuth';
import { Brand } from './Brand';
import { cx } from '../lib/format';

const NAV = [
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
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-3 sm:gap-6">
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

      <main key={pathname} className="animate-rise mx-auto max-w-5xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}

function AccountMenu() {
  const { user, signOut, signOutEverywhere } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (!user) return null;

  const label = user.displayName?.trim() || user.email;
  const initial = label.charAt(0).toUpperCase();

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="size-6 rounded-full object-cover" />
        ) : (
          <span className="flex size-6 items-center justify-center rounded-full bg-surface-raised text-xs font-medium text-ink">
            {initial}
          </span>
        )}
        <span className="hidden max-w-32 truncate sm:inline">{label}</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-surface shadow-lg"
        >
          <div className="border-b border-line px-3 py-2.5">
            <p className="truncate text-sm text-ink">{label}</p>
            <p className="truncate text-xs text-ink-faint">{user.email}</p>
            {!user.emailVerified ? (
              <p className="mt-1 text-xs text-caution">Email not verified</p>
            ) : null}
          </div>

          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={() => void run(signOut)}
            className="block w-full px-3 py-2 text-left text-sm text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink disabled:opacity-50"
          >
            Sign out
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={() => void run(signOutEverywhere)}
            className="block w-full px-3 py-2 text-left text-sm text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink disabled:opacity-50"
          >
            Sign out on all devices
          </button>
        </div>
      ) : null}
    </div>
  );
}
