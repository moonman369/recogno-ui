import { tokenStore } from './tokenStore';

/**
 * The OAuth callback landing.
 *
 * Confirmed against `recogno-server/packages/api/src/routes/googleAuth.ts`:
 * on success the backend 302s to `OAUTH_SUCCESS_REDIRECT` — `/auth/callback` —
 * with the session in the query string as `accessToken` and `refreshToken`.
 * There is no cookie and no exchange code, so this is the query-param variant.
 *
 * SECURITY: query-param delivery means the session lands in the address bar,
 * the browser history, any referrer, and potentially proxy or extension logs.
 * Stripping it here narrows the window but cannot close it — the tokens were
 * already in a URL. The fix is server-side: redirect with a single-use code and
 * have the SPA exchange it, or set an httpOnly refresh cookie. See the note in
 * `tokenStore.ts` on the same trade.
 */

/** The callback carries no expiry, so assume the documented access-token lifetime. */
const ASSUMED_EXPIRES_IN_SECONDS = 900;

const TOKEN_PARAMS = ['accessToken', 'refreshToken'] as const;
const ERROR_PARAMS = ['error', 'error_description'] as const;

export type OAuthCallbackResult =
  | { status: 'success' }
  | { status: 'error'; code: string | null; description: string | null }
  /** The URL carried no callback at all — a direct visit, or a reload after we stripped it. */
  | null;

let captured: OAuthCallbackResult = null;

/**
 * Captures whatever the callback delivered and scrubs it from the URL.
 *
 * Call this exactly once, before the app renders. It runs at module scope
 * rather than inside the callback screen so the credentials leave the address
 * bar at the earliest possible moment — before the router mounts, before any
 * render, and before anything can read `document.referrer` off a subresource.
 * `replaceState` rewrites the current entry rather than pushing a new one, so
 * Back cannot walk the user onto a URL that still holds their session.
 *
 * The result is held here for `takeOAuthCallbackResult()` because the screen
 * that reports it renders long after the URL has been cleaned.
 */
export function consumeOAuthCallback(): OAuthCallbackResult {
  if (typeof window === 'undefined') return null;

  const url = new URL(window.location.href);
  const accessToken = url.searchParams.get('accessToken');
  const refreshToken = url.searchParams.get('refreshToken');
  const error = url.searchParams.get('error');
  const description = url.searchParams.get('error_description');

  if (accessToken && refreshToken) {
    tokenStore.setTokens(accessToken, refreshToken, ASSUMED_EXPIRES_IN_SECONDS);
    captured = { status: 'success' };
  } else if (error) {
    captured = { status: 'error', code: error, description };
  } else {
    return null;
  }

  for (const param of [...TOKEN_PARAMS, ...ERROR_PARAMS]) url.searchParams.delete(param);
  window.history.replaceState(
    window.history.state,
    '',
    `${url.pathname}${url.search}${url.hash}`,
  );

  return captured;
}

export function takeOAuthCallbackResult(): OAuthCallbackResult {
  return captured;
}

/** Test seam. */
export function resetOAuthCallbackResult(): void {
  captured = null;
}

export type OAuthFailure = {
  title: string;
  body: string;
  /** Cancelling is a decision, not a fault — it should not be dressed as an error. */
  tone: 'neutral' | 'error';
  /** The conflict is only resolvable by signing in with a password. */
  suggestPassword: boolean;
};

/**
 * Turns a callback error into something a person can act on.
 *
 * Google's own codes (`access_denied`) arrive verbatim; Recogno's conflict case
 * is matched loosely because the backend does not yet emit a stable code for it
 * — see the note in the README about the error paths never reaching this app.
 */
export function describeOAuthFailure(
  code: string | null,
  description: string | null,
): OAuthFailure {
  const haystack = `${code ?? ''} ${description ?? ''}`.toLowerCase();

  if (code === 'access_denied' || haystack.includes('denied') || haystack.includes('cancel')) {
    return {
      title: 'Sign-in cancelled',
      body: 'You did not finish signing in with Google. No changes were made to your account.',
      tone: 'neutral',
      suggestPassword: false,
    };
  }

  if (
    haystack.includes('unverified') ||
    haystack.includes('conflict') ||
    haystack.includes('already exists')
  ) {
    return {
      title: 'That email already has an account',
      body:
        description ??
        'An account already exists for this email address, but Google has not confirmed that you own it. Sign in with your password instead, or verify the address with Google and try again.',
      tone: 'error',
      suggestPassword: true,
    };
  }

  if (haystack.includes('state')) {
    return {
      title: 'That sign-in link expired',
      body: 'The request took too long or was already used. Starting again should work.',
      tone: 'neutral',
      suggestPassword: false,
    };
  }

  return {
    title: 'Google sign-in failed',
    body: description ?? 'Something went wrong finishing the sign-in. Please try again.',
    tone: 'error',
    suggestPassword: false,
  };
}
