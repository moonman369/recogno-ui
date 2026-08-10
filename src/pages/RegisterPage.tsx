import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../api/authTypes';
import { Button, Field, inputClass, Spinner } from '../components/ui';
import {
  AuthFormShell,
  Divider,
  FieldError,
  FormError,
  GoogleButton,
} from '../auth/AuthFormShell';
import {
  authFormMessage,
  isRetryable,
  parseValidationError,
  type FieldErrors,
} from '../auth/authErrors';
import { useAuth } from '../auth/useAuth';

export function RegisterPage() {
  const { register, providers, startGoogleSignIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const passwordTooShort = password.length > 0 && password.length < PASSWORD_MIN_LENGTH;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (passwordTooShort) return;

    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const trimmedName = displayName.trim();
      await register({
        email: email.trim(),
        password,
        ...(trimmedName ? { displayName: trimmedName } : {}),
      });
      navigate('/dashboard', { replace: true });
    } catch (cause) {
      setFieldErrors(parseValidationError(cause) ?? {});
      setError(cause);
    } finally {
      setSubmitting(false);
    }
  }

  const passwordEnabled = providers?.password ?? true;
  const googleEnabled = providers?.google ?? false;

  return (
    <AuthFormShell
      title="Create an account"
      subtitle="Start building a recognition habit."
      footer={
        <>
          Already have one?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
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

          <Field label="Display name" hint="Optional.">
            <input
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              disabled={submitting}
              className={inputClass}
            />
            {fieldErrors.displayName ? <FieldError>{fieldErrors.displayName}</FieldError> : null}
          </Field>

          <Field label="Password" hint={`${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters.`}>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={PASSWORD_MIN_LENGTH}
              maxLength={PASSWORD_MAX_LENGTH}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={submitting}
              className={inputClass}
            />
            {fieldErrors.password ? (
              <FieldError>{fieldErrors.password}</FieldError>
            ) : passwordTooShort ? (
              <FieldError>At least {PASSWORD_MIN_LENGTH} characters.</FieldError>
            ) : null}
          </Field>

          <Button
            type="submit"
            disabled={submitting || passwordTooShort}
            className="w-full"
          >
            {submitting ? <Spinner className="border-t-canvas" /> : null}
            {submitting ? 'Creating…' : 'Create account'}
          </Button>
        </form>
      ) : null}

      {passwordEnabled && googleEnabled ? <Divider>or</Divider> : null}

      {googleEnabled ? <GoogleButton onClick={startGoogleSignIn} disabled={submitting} /> : null}
    </AuthFormShell>
  );
}
