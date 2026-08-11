import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { ResendVerification } from '../pages/VerifyEmailPage';

/**
 * A nudge, not a gate.
 *
 * Nothing in the app is blocked by an unverified address, so this stays out of
 * the way: it does not interrupt, it cannot be dismissed into oblivion (it
 * returns on the next load, because the state it reports is still true), and it
 * sits below the header rather than over the content.
 */
export function VerifyEmailBanner() {
  const { user } = useAuth();
  const [hidden, setHidden] = useState(false);

  if (!user || user.emailVerified || hidden) return null;

  return (
    <div className="border-b border-caution/25 bg-caution/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-2.5 sm:px-6">
        <p className="min-w-0 flex-1 text-sm text-caution">
          <span className="font-medium">Verify your email.</span>{' '}
          <span className="text-caution/85">
            We sent a link to {user.email}. It is only a nudge — nothing is locked.
          </span>
        </p>

        <div className="flex items-center gap-2">
          <ResendVerification compact />
          <button
            type="button"
            onClick={() => setHidden(true)}
            aria-label="Hide until next visit"
            className="rounded px-1.5 py-1 text-sm text-caution/70 transition-colors hover:text-caution"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
