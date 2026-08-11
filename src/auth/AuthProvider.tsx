import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { BASE_URL, isUnauthenticated, refreshSession, setUnauthenticatedHandler } from '../api/http';
import type { AuthUser, LoginInput, RegisterInput } from '../api/authTypes';
import { AuthContext, type AuthStatus } from './AuthContext';
import { tokenStore } from './tokenStore';

/** Never re-arm the proactive refresh faster than this, whatever the clock says. */
const MIN_REFRESH_DELAY_MS = 5_000;

/**
 * How long to wait for `/auth/me` before giving up on the restore.
 *
 * A ceiling rather than a guess: without it, a stalled request — or a Web Lock
 * that never resolves — leaves the app on its splash screen forever with no way
 * out. Failing to a signed-out state is always recoverable; hanging is not.
 */
const BOOTSTRAP_TIMEOUT_MS = 8_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<AuthStatus>(() =>
    tokenStore.hasSession() ? 'loading' : 'unauthenticated',
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [bootstrapError, setBootstrapError] = useState<unknown>(null);
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);

  // `GET /auth/google` 501s when the server has no Google credentials, so the
  // button is only rendered once the server says it has them.
  const providersQuery = useQuery({
    queryKey: ['auth', 'providers'],
    queryFn: ({ signal }) => api.auth.providers(signal),
    staleTime: Infinity,
    retry: 1,
  });

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus('unauthenticated');
    // Drop every cached response — it belongs to the account that just left.
    queryClient.clear();
  }, [queryClient]);

  // The transport calls this when a refresh token is rejected outright.
  useEffect(() => {
    setUnauthenticatedHandler(() => {
      setUser(null);
      setStatus('unauthenticated');
      queryClient.clear();
    });
    return () => setUnauthenticatedHandler(null);
  }, [queryClient]);

  // Restore the session on load. The access token lives in memory only, so
  // after a reload there is nothing but the refresh token to go on.
  useEffect(() => {
    if (!tokenStore.hasSession()) {
      setStatus('unauthenticated');
      return;
    }

    let cancelled = false;
    setBootstrapError(null);

    const timeout = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    // Aborting the fetch is not enough on its own: if the stall is upstream of
    // the request — a refresh waiting on a Web Lock that never resolves — the
    // promise simply never settles and there is nothing to abort. Racing a
    // timer guarantees this resolves either way.
    const expiry = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        timeout.abort();
        reject(new Error('Timed out confirming your session.'));
      }, BOOTSTRAP_TIMEOUT_MS);
    });

    void (async () => {
      try {
        const { user: me } = await Promise.race([api.auth.me(timeout.signal), expiry]);
        if (cancelled) return;
        setUser(me);
        setStatus('authenticated');
      } catch (error) {
        if (cancelled) return;

        if (isUnauthenticated(error)) {
          // The token was rejected outright: nothing to keep.
          tokenStore.clear();
          setUser(null);
        } else {
          // A 503, a dead connection or a timeout is not proof the token is
          // bad, so keep it — `retryBootstrap` can still succeed with it, and
          // the guard offers that retry rather than a redirect.
          setBootstrapError(error);
        }

        // Either way the restore is over. Leaving `status` on 'loading' here is
        // what used to strand the app on its splash screen with no way out.
        setStatus('unauthenticated');
      } finally {
        if (timer !== undefined) clearTimeout(timer);
      }
    })();

    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
      timeout.abort();
    };
  }, [bootstrapAttempt]);

  // Access tokens last 15 minutes. Renew shortly before expiry so an idle tab
  // does not have to discover the lapse through a failed request.
  const statusRef = useRef(status);
  statusRef.current = status;

  useEffect(() => {
    if (status !== 'authenticated') return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      timer = setTimeout(
        async () => {
          try {
            await refreshSession();
          } catch {
            // A failed refresh has already signed out if the token was
            // rejected; anything else is transient and worth retrying.
          }
          if (!cancelled && statusRef.current === 'authenticated') schedule();
        },
        Math.max(tokenStore.msUntilRefresh(), MIN_REFRESH_DELAY_MS),
      );
    };

    schedule();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [status]);

  const signIn = useCallback(
    async (input: LoginInput) => {
      const session = await api.auth.login(input);
      tokenStore.setSession(session);
      queryClient.clear();
      setUser(session.user);
      setBootstrapError(null);
      setStatus('authenticated');
    },
    [queryClient],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const session = await api.auth.register(input);
      tokenStore.setSession(session);
      queryClient.clear();
      setUser(session.user);
      setBootstrapError(null);
      setStatus('authenticated');
    },
    [queryClient],
  );

  const applyUser = useCallback((next: AuthUser) => {
    // Guarded: confirming a link in a browser with no session must not conjure
    // a signed-in state with no tokens behind it.
    setUser((current) => (current ? next : current));
  }, []);

  const signOut = useCallback(async () => {
    const refreshToken = tokenStore.getRefreshToken();
    try {
      if (refreshToken) await api.auth.logout(refreshToken);
    } catch {
      // The local session goes either way — a server that cannot hear the
      // revocation is not a reason to keep the user signed in here.
    }
    clearSession();
  }, [clearSession]);

  const signOutEverywhere = useCallback(async () => {
    try {
      await api.auth.logoutAll();
    } catch {
      /* as above */
    }
    clearSession();
  }, [clearSession]);

  const startGoogleSignIn = useCallback(() => {
    // Server-driven authorization-code flow: a full-page handover, not a fetch
    // and not a popup. The backend owns the code exchange and redirects back to
    // OAUTH_SUCCESS_REDIRECT, which this app serves at /auth/callback.
    window.location.href = `${BASE_URL}/auth/google`;
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      providers: providersQuery.data ?? null,
      bootstrapError,
      retryBootstrap: () => setBootstrapAttempt((attempt) => attempt + 1),
      applyUser,
      signIn,
      register,
      signOut,
      signOutEverywhere,
      startGoogleSignIn,
    }),
    [
      status,
      user,
      providersQuery.data,
      bootstrapError,
      applyUser,
      signIn,
      register,
      signOut,
      signOutEverywhere,
      startGoogleSignIn,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
