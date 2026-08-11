import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Field, inputClass, Spinner } from '../components/ui';
import {
  AuthFormShell,
  Divider,
  FieldError,
  FormError,
  GoogleButton,
} from '../auth/AuthFormShell';
import { authFormMessage, isRetryable, parseValidationError, type FieldErrors } from '../auth/authErrors';
import { useAuth } from '../auth/useAuth';

type FromState = {
  from?: { pathname?: string; search?: string };
  /** Handed over by the reset flow, which cannot sign the user in itself. */
  notice?: string;
} | null;

export function LoginPage() {
  const { signIn, providers, startGoogleSignIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Where the guard bounced them from, so sign-in can put them back.
  const state = location.state as FromState;
  const destination = state?.from?.pathname
    ? `${state.from.pathname}${state.from.search ?? ''}`
    : '/dashboard';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      await signIn({ email: email.trim(), password });
      navigate(destination, { replace: true });
    } catch (cause) {
      setFieldErrors(parseValidationError(cause) ?? {});
      setError(cause);
    } finally {
      setSubmitting(false);
    }
  }

  // `providers` is null until /auth/providers answers; assume password is on so
  // the form is not withheld on a slow connection. Google is the opposite —
  // hidden until confirmed, because asking for it without credentials 501s.
  const passwordEnabled = providers?.password ?? true;
  const googleEnabled = providers?.google ?? false;

  return (
    <AuthFormShell
      title="Sign in"
      subtitle="Pick up where your review queue left off."
      footer={
        <>
          No account yet?{' '}
          <Link to="/register" className="text-accent hover:underline">
            Create one
          </Link>
        </>
      }
    >
      {state?.notice ? (
        <div className="rounded-lg border border-positive/40 bg-positive/10 px-3 py-2.5">
          <p className="text-sm text-positive">{state.notice}</p>
        </div>
      ) : null}

      {error ? (
        <FormError tone={isRetryable(error) ? 'caution' : 'negative'}>
          {authFormMessage(error)}
        </FormError>
      ) : null}

      {passwordEnabled ? (
        <form onSubmit={handleSubmit} className="space-y-4">
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
            {fieldErrors.email ? <FieldError>{fieldErrors.email}</FieldError> : null}
          </Field>

          <Field label="Password">
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={submitting}
              className={inputClass}
            />
            {fieldErrors.password ? <FieldError>{fieldErrors.password}</FieldError> : null}
          </Field>

          <div className="-mt-1 text-right">
            <Link to="/forgot-password" className="text-xs text-ink-faint hover:text-ink">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? <Spinner className="border-t-canvas" /> : null}
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      ) : null}

      {passwordEnabled && googleEnabled ? <Divider>or</Divider> : null}

      {googleEnabled ? <GoogleButton onClick={startGoogleSignIn} disabled={submitting} /> : null}

      {!passwordEnabled && !googleEnabled && providers ? (
        <FormError tone="caution">
          This server has no sign-in methods configured.
        </FormError>
      ) : null}
    </AuthFormShell>
  );
}
