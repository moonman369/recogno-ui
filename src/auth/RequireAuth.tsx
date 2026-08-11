import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Button, Card } from '../components/ui';
import { SplashScreen } from '../components/SplashScreen';
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
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="sm" onClick={retryBootstrap}>
              Try again
            </Button>
            {/* Always a way forward, even if the server stays unreachable. */}
            <Link to="/login" className="text-xs text-ink-faint transition-colors hover:text-ink">
              Sign in again
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (status === 'loading') return <SplashScreen label="Restoring your session…" />;

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
