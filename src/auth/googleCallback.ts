import { tokenStore } from './tokenStore';

/**
 * The OAuth callback lands on the server's configured redirect URL carrying the
 * session in the query string. It does not include an expiry, so assume the
 * documented access-token lifetime; a wrong guess only costs one early refresh.
 */
const ASSUMED_EXPIRES_IN_SECONDS = 900;

/**
 * Captures `?accessToken=&refreshToken=` from the current URL, stores them, and
 * strips them back out via `history.replaceState`.
 *
 * Call this exactly once, before the app renders — tokens in the address bar
 * end up in browser history, shoulder-surfed, and pasted into bug reports.
 * `replaceState` rewrites the current entry rather than pushing a new one, so
 * Back does not walk the user onto a URL still holding their credentials.
 *
 * Returns true when a callback was consumed.
 */
export function consumeGoogleCallback(): boolean {
  if (typeof window === 'undefined') return false;

  const url = new URL(window.location.href);
  const accessToken = url.searchParams.get('accessToken');
  const refreshToken = url.searchParams.get('refreshToken');

  if (!accessToken || !refreshToken) return false;

  tokenStore.setTokens(accessToken, refreshToken, ASSUMED_EXPIRES_IN_SECONDS);

  url.searchParams.delete('accessToken');
  url.searchParams.delete('refreshToken');
  window.history.replaceState(
    window.history.state,
    '',
    `${url.pathname}${url.search}${url.hash}`,
  );

  return true;
}
