import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../api/authTypes';
import { AuthFormShell, FieldError, FormError } from '../auth/AuthFormShell';
import { authFormMessage, isRetryable, parseValidationError } from '../auth/authErrors';
import { useAuth } from '../auth/useAuth';
import { Button, Field, inputClass, Spinner } from '../components/ui';
import { takeLinkToken } from '../lib/linkToken';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  // Lifted out of the URL on first render, before anything can read it back.
  const [token] = useState(() => takeLinkToken('/reset-password'));

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const tooShort = password.length > 0 && password.length < PASSWORD_MIN_LENGTH;
  const mismatch = confirm.length > 0 && confirm !== password;
  const ready = password.length >= PASSWORD_MIN_LENGTH && confirm === password;

  useEffect(() => {
    setFieldError(null);
  }, [password, confirm]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token || !ready || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      // 204, no body — `request` returns undefined rather than parsing.
      await api.auth.resetPassword({ token, password });

      // The server revoked every session, so whatever is in this tab is dead.
      // Clearing locally keeps the app from believing it is still signed in and
      // bouncing us off /login.
      await signOut();

      navigate('/login', {
        replace: true,
        state: { notice: 'Password updated — sign in with your new password.' },
      });
    } catch (cause) {
      const fields = parseValidationError(cause);
      if (fields?.password) setFieldError(fields.password);
      setError(cause);
    } finally {
      setSubmitting(false);
    }
  }

  // Nothing to reset against. Sending them to request a fresh link is more use
  // than an error about a URL they did not type.
  if (!token) return <Navigate to="/forgot-password" replace />;

  return (
    <AuthFormShell
      title="Set a new password"
      subtitle="Choose something you have not used here before."
      footer={
        <>
          Link expired?{' '}
          <Link to="/forgot-password" className="text-accent hover:underline">
            Request a new one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <>
            <FormError tone={isRetryable(error) ? 'caution' : 'negative'}>
              {authFormMessage(error)}
            </FormError>
            <Link
              to="/forgot-password"
              className="-mt-1 block text-xs text-accent hover:underline"
            >
              Send me a new reset link
            </Link>
          </>
        ) : null}

        <Field label="New password" hint={`${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters.`}>
          <input
            type="password"
            autoComplete="new-password"
            autoFocus
            required
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={PASSWORD_MAX_LENGTH}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting}
            className={inputClass}
          />
          {fieldError ? (
            <FieldError>{fieldError}</FieldError>
          ) : tooShort ? (
            <FieldError>At least {PASSWORD_MIN_LENGTH} characters.</FieldError>
          ) : null}
        </Field>

        <Field label="Confirm new password">
          <input
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            disabled={submitting}
            className={inputClass}
          />
          {mismatch ? <FieldError>Those do not match.</FieldError> : null}
        </Field>

        <Button type="submit" disabled={!ready || submitting} className="w-full">
          {submitting ? <Spinner className="border-t-canvas" /> : null}
          {submitting ? 'Updating…' : 'Update password'}
        </Button>

        <p className="text-xs leading-relaxed text-ink-faint">
          This signs out every device, including this one. You will sign in again with the new
          password.
        </p>
      </form>
    </AuthFormShell>
  );
}
