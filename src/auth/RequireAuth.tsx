import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Button, Card, Loading } from '../components/ui';
import { ApiError } from '../api/http';
import { useAuth } from './useAuth';

/** Gate for every route that needs a session. */
export function RequireAuth() {
  const { status, bootstrapError, retryBootstrap } = useAuth();
  const location = useLocation();

  // A session we could not confirm is not a session we should throw away.
  if (bootstrapError) {
    const message =
      bootstrapError instanceof ApiError
        ? bootstrapError.message
        : 'Could not reach the Recogno API.';

    return (
      <div className="mx-auto max-w-md py-16">
        <Card className="border-caution/40">
          <h1 className="text-sm font-semibold">Could not restore your session</h1>
          <p className="mt-2 text-sm text-ink-muted">{message}</p>
          <p className="mt-2 text-xs text-ink-faint">
            You are still signed in — this is a problem reaching the server, not with your account.
          </p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={retryBootstrap}>
            Try again
          </Button>
        </Card>
      </div>
    );
  }

  if (status === 'loading') return <Loading label="Restoring your session…" />;

  if (status === 'unauthenticated') {
    // Remember where they were headed so sign-in can put them back.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

/** Keeps a signed-in user off the login and register screens. */
export function RedirectIfAuthenticated() {
  const { status } = useAuth();
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
