import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { VERIFY_LINK_HOURS } from '../api/authTypes';
import { AuthFormShell, FormError } from '../auth/AuthFormShell';
import { authFormMessage, isRetryable } from '../auth/authErrors';
import { useAuth } from '../auth/useAuth';
import { Button, Field, inputClass, Spinner } from '../components/ui';
import { takeLinkToken } from '../lib/linkToken';
import { useCooldown } from '../lib/useCooldown';

type Phase = 'confirming' | 'done' | 'failed' | 'no-token';

export function VerifyEmailPage() {
  const { status, user, applyUser } = useAuth();
  const navigate = useNavigate();

  const [token] = useState(() => takeLinkToken('/verify-email'));
  const [phase, setPhase] = useState<Phase>(token ? 'confirming' : 'no-token');
  const [error, setError] = useState<unknown>(null);
  const confirmed = useRef(false);

  useEffect(() => {
    if (!token || confirmed.current) return;
    // Links are single-use, so StrictMode's double-invoke would burn the token
    // on the first pass and fail the second. Guard with a ref, not state.
    confirmed.current = true;

    let cancelled = false;

    void (async () => {
      try {
        const result = await api.auth.confirmVerifyEmail({ token });
        if (cancelled) return;
        // Only lands if there is a session to attach it to; confirming from a
        // different browser leaves the signed-out state alone.
        applyUser(result.user);
        setPhase('done');
      } catch (cause) {
        if (cancelled) return;
        setError(cause);
        setPhase('failed');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, applyUser]);

  if (phase === 'confirming') {
    return (
      <AuthFormShell title="Verifying your email" subtitle="This only takes a moment.">
        <div className="flex items-center gap-3">
          <Spinner />
          <p className="text-sm text-ink-muted" role="status">
            Confirming your link…
          </p>
        </div>
      </AuthFormShell>
    );
  }

  if (phase === 'done') {
    const signedIn = status === 'authenticated';
    return (
      <AuthFormShell title="Email verified" subtitle="That is all we needed.">
        <div className="rounded-lg border border-positive/40 bg-positive/10 px-3 py-2.5">
          <p className="text-sm text-positive">
            {user?.email ? `${user.email} is confirmed.` : 'Your address is confirmed.'}
          </p>
        </div>

        <Button
          className="w-full"
          onClick={() => navigate(signedIn ? '/dashboard' : '/login', { replace: true })}
        >
          {signedIn ? 'Go to your dashboard' : 'Sign in'}
        </Button>
      </AuthFormShell>
    );
  }

  // Both remaining phases need a way to get a fresh link.
  return (
    <AuthFormShell
      title={phase === 'no-token' ? 'This link is incomplete' : 'That link did not work'}
      subtitle={
        phase === 'no-token'
          ? 'The address you landed on has no verification token in it.'
          : undefined
      }
      footer={
        <Link to="/login" className="text-accent hover:underline">
          Back to sign in
        </Link>
      }
    >
      {phase === 'failed' && error ? (
        <FormError tone={isRetryable(error) ? 'caution' : 'negative'}>
          {authFormMessage(error)}
        </FormError>
      ) : null}

      <ResendVerification />
    </AuthFormShell>
  );
}

/**
 * Requests a fresh verification link.
 *
 * Uses the signed-in address when there is one, and asks otherwise — someone
 * can easily open the link in a browser where they are not signed in.
 */
export function ResendVerification({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const cooldown = useCooldown();

  const [email, setEmail] = useState(user?.email ?? '');
  const [sent, setSent] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const knownAddress = Boolean(user?.email);

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const address = (user?.email ?? email).trim();
    if (!address || submitting || cooldown.active) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await api.auth.requestVerifyEmail({ email: address });
      setSent(result.message);
      cooldown.start();
    } catch (cause) {
      setError(cause);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className={compact ? '' : 'space-y-3'}>
        <p className="text-sm text-positive">{sent}</p>
        {!compact ? (
          <p className="text-xs leading-relaxed text-ink-faint">
            The link lasts {VERIFY_LINK_HOURS} hours and can only be used once. Asking for another
            replaces it.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={send} className="space-y-3">
      {error ? (
        <FormError tone={isRetryable(error) ? 'caution' : 'negative'}>
          {authFormMessage(error)}
        </FormError>
      ) : null}

      {knownAddress ? null : (
        <Field label="Email">
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={submitting}
            className={inputClass}
          />
        </Field>
      )}

      <Button
        type="submit"
        variant={compact ? 'secondary' : 'primary'}
        size={compact ? 'sm' : 'md'}
        disabled={submitting || cooldown.active || (!knownAddress && !email.trim())}
        className={compact ? undefined : 'w-full'}
      >
        {submitting ? <Spinner className="border-t-canvas" /> : null}
        {cooldown.active
          ? `Sent — retry in ${cooldown.remaining}s`
          : submitting
            ? 'Sending…'
            : 'Send me a new link'}
      </Button>
    </form>
  );
}
