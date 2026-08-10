import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Brand } from '../components/Brand';
import { Button, Card, Spinner } from '../components/ui';
import {
  describeOAuthFailure,
  takeOAuthCallbackResult,
  type OAuthCallbackResult,
} from '../auth/googleCallback';
import { useAuth } from '../auth/useAuth';
import { cx } from '../lib/format';

/**
 * Where `OAUTH_SUCCESS_REDIRECT` lands.
 *
 * The tokens were already lifted out of the URL and stored before render — see
 * `consumeOAuthCallback` — so by the time this mounts, `AuthProvider` is
 * already confirming the session against `/auth/me`. This screen's whole job is
 * to narrate that wait and to report a failure on-brand instead of dumping the
 * user somewhere blank.
 */
export function OAuthCallbackPage() {
  const { status, user } = useAuth();
  const navigate = useNavigate();

  // Read once on mount: the module-level result is stable, but pinning it in
  // state keeps this render pure.
  const [result] = useState<OAuthCallbackResult>(takeOAuthCallbackResult);

  useEffect(() => {
    if (result?.status !== 'success' || status !== 'authenticated') return;
    // Replace, so Back does not return to a spent callback URL.
    const timer = setTimeout(() => navigate('/drill', { replace: true }), 350);
    return () => clearTimeout(timer);
  }, [result, status, navigate]);

  // Nothing in the URL. Either someone opened this path directly, or they
  // reloaded after we scrubbed it — neither is an error worth alarming about.
  if (!result) return <Navigate to="/login" replace />;

  if (result.status === 'error') {
    const failure = describeOAuthFailure(result.code, result.description);

    return (
      <CallbackShell>
        <div
          className={cx(
            'mb-4 inline-flex size-10 items-center justify-center rounded-full text-lg',
            failure.tone === 'neutral'
              ? 'bg-surface-raised text-ink-muted'
              : 'bg-negative/15 text-negative',
          )}
          aria-hidden
        >
          {failure.tone === 'neutral' ? '·' : '!'}
        </div>

        <h1 className="text-lg font-semibold tracking-tight">{failure.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{failure.body}</p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link to="/login">
            <Button size="sm">
              {failure.suggestPassword ? 'Sign in with a password' : 'Back to sign in'}
            </Button>
          </Link>
          <Link to="/" className="text-xs text-ink-faint transition-colors hover:text-ink">
            What is Recogno?
          </Link>
        </div>
      </CallbackShell>
    );
  }

  // Tokens arrived but the session could not be confirmed — an expired or
  // rejected token, or the API being unreachable.
  if (status === 'unauthenticated') {
    return (
      <CallbackShell>
        <h1 className="text-lg font-semibold tracking-tight">Could not finish signing you in</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Google sent us back, but the session did not check out. Starting again usually clears it.
        </p>
        <Link to="/login" className="mt-6 inline-block">
          <Button size="sm">Back to sign in</Button>
        </Link>
      </CallbackShell>
    );
  }

  return (
    <CallbackShell>
      <div className="flex items-center gap-3">
        <Spinner />
        <p className="text-sm text-ink-muted" role="status">
          {status === 'authenticated' ? 'Signed in — taking you through…' : 'Confirming your session…'}
        </p>
      </div>
      {status === 'authenticated' && user ? (
        <p className="mt-3 text-sm text-ink-faint">
          Welcome{user.displayName?.trim() ? `, ${user.displayName.trim()}` : ''}.
        </p>
      ) : null}
    </CallbackShell>
  );
}

/** Same furniture as the sign-in screens, so the round trip feels continuous. */
function CallbackShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-drift absolute -top-32 left-1/2 size-[38rem] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <Link to="/" className="relative mb-6 inline-flex w-fit" aria-label="Recogno home">
        <Brand />
      </Link>

      <Card glass className="animate-rise relative">
        {children}
      </Card>
    </div>
  );
}
