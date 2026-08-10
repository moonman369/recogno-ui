import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReviewDueCount } from '../api/queries';
import type { AuthUser } from '../api/authTypes';
import { useAuth } from '../auth/useAuth';
import { Avatar } from './Avatar';
import { absoluteTime, cx } from '../lib/format';

/**
 * The signed-in profile menu, shared by the app shell and the landing page so
 * "who am I signed in as" is answered the same way everywhere.
 *
 * Split in two because the inner half reads the due count, and hooks cannot be
 * called conditionally — the landing page is public, and firing an authed query
 * for a signed-out visitor would 401 and tear down a session that was never
 * there.
 */
export function AccountMenu() {
  const { user } = useAuth();
  if (!user) return null;
  return <SignedInMenu user={user} />;
}

function SignedInMenu({ user }: { user: AuthUser }) {
  const { signOut, signOutEverywhere } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Already cached by the header; react-query dedupes the second read.
  const { data: due } = useReviewDueCount();
  const dueCount = due?.dueCount ?? 0;

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

  const label = user.displayName?.trim() || user.email;

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
        <Avatar user={user} className="size-6 text-xs" />
        <span className="hidden max-w-32 truncate sm:inline">{label}</span>
        <span
          aria-hidden
          className={cx(
            'text-[10px] transition-transform duration-200',
            open && 'rotate-180',
          )}
        >
          ▾
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="glass animate-rise absolute right-0 mt-2 w-72 overflow-hidden rounded-xl"
        >
          {/* Identity first — the point of the menu is to answer "who am I signed in as". */}
          <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
            <Avatar user={user} className="size-10 text-base" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{label}</p>
              <p className="truncate text-xs text-ink-faint">{user.email}</p>
            </div>
          </div>

          <dl className="space-y-1.5 border-b border-line px-4 py-3 text-xs">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-faint">Email</dt>
              <dd className={user.emailVerified ? 'text-positive' : 'text-caution'}>
                {user.emailVerified ? 'Verified' : 'Not verified'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-faint">Member since</dt>
              <dd className="text-ink-muted" title={absoluteTime(user.createdAt)}>
                {new Date(user.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  year: 'numeric',
                })}
              </dd>
            </div>
            {due ? (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-faint">Due now</dt>
                <dd className={dueCount > 0 ? 'text-accent' : 'text-ink-muted'}>{dueCount}</dd>
              </div>
            ) : null}
          </dl>

          <Link
            to="/dashboard"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-left text-sm text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink"
          >
            Profile &amp; dashboard
          </Link>

          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={() => void run(signOut)}
            className="block w-full px-4 py-2.5 text-left text-sm text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink disabled:opacity-50"
          >
            Sign out
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={() => void run(signOutEverywhere)}
            className="block w-full px-4 py-2.5 text-left text-sm text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink disabled:opacity-50"
          >
            Sign out on all devices
          </button>
        </div>
      ) : null}
    </div>
  );
}
