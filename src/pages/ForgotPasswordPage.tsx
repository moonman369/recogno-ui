import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { RESET_LINK_HOURS } from '../api/authTypes';
import { AuthFormShell, FormError } from '../auth/AuthFormShell';
import { authFormMessage, isRetryable } from '../auth/authErrors';
import { Button, Field, inputClass, Spinner } from '../components/ui';
import { useCooldown } from '../lib/useCooldown';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const cooldown = useCooldown();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting || cooldown.active) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await api.auth.forgotPassword({ email: email.trim() });
      // The server answers 202 whether or not the address exists, and the copy
      // is written to say so. Render it verbatim rather than asserting an email
      // went out — claiming otherwise would leak which accounts are real.
      setSent(result.message);
      cooldown.start();
    } catch (cause) {
      setError(cause);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthFormShell
      title="Reset your password"
      subtitle={
        sent ? undefined : 'We will email you a link to set a new one.'
      }
      footer={
        <>
          Remembered it?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-positive/40 bg-positive/10 px-3 py-2.5">
            <p className="text-sm text-positive">{sent}</p>
          </div>

          <p className="text-sm leading-relaxed text-ink-muted">
            The link is valid for {RESET_LINK_HOURS} hour
            {RESET_LINK_HOURS === 1 ? '' : 's'} and can only be used once. Requesting another one
            replaces it.
          </p>

          <Button
            variant="secondary"
            className="w-full"
            disabled={cooldown.active}
            onClick={() => setSent(null)}
          >
            {cooldown.active ? `Send again in ${cooldown.remaining}s` : 'Send to a different address'}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <FormError tone={isRetryable(error) ? 'caution' : 'negative'}>
              {authFormMessage(error)}
            </FormError>
          ) : null}

          <Field label="Email">
            <input
              type="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={submitting}
              className={inputClass}
            />
          </Field>

          <Button type="submit" disabled={submitting || !email.trim()} className="w-full">
            {submitting ? <Spinner className="border-t-canvas" /> : null}
            {submitting ? 'Sending…' : 'Email me a reset link'}
          </Button>
        </form>
      )}
    </AuthFormShell>
  );
}
