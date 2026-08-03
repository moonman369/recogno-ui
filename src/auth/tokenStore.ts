import type { AuthSession } from '../api/authTypes';

/**
 * Token storage: access token in memory, refresh token in `localStorage`.
 *
 * SECURITY: the refresh token is readable by any script running on this origin,
 * so a single XSS bug hands an attacker a long-lived credential. The hardening
 * step is to stop holding it here at all — have the server set the refresh
 * token as an httpOnly, Secure, SameSite=Strict cookie scoped to `/auth/refresh`
 * and drop this module's persistence entirely. Keeping the *access* token in
 * memory only (never `localStorage`) is the part of that trade already taken:
 * it dies with the tab, so a stolen refresh token is the only lasting exposure.
 */

const REFRESH_TOKEN_KEY = 'recogno.refreshToken';

/** Refresh this many ms before the access token actually expires. */
const EXPIRY_SKEW_MS = 60_000;

let accessToken: string | null = null;
let accessTokenExpiresAt = 0;

export const tokenStore = {
  getAccessToken(): string | null {
    return accessToken;
  },

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      // Private mode or a blocked store — treat as signed out rather than throwing.
      return null;
    }
  },

  /**
   * Persists a session. Refresh tokens rotate on every `/auth/refresh`, so this
   * must be called with the *new* token every single time.
   */
  setSession(session: AuthSession): void {
    accessToken = session.accessToken;
    accessTokenExpiresAt = Date.now() + session.expiresIn * 1000;
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
    } catch {
      // Non-fatal: the session still works until the tab closes.
    }
  },

  /** Used by the Google callback, which delivers tokens without an expiry. */
  setTokens(nextAccessToken: string, nextRefreshToken: string, expiresInSeconds: number): void {
    accessToken = nextAccessToken;
    accessTokenExpiresAt = Date.now() + expiresInSeconds * 1000;
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, nextRefreshToken);
    } catch {
      /* see above */
    }
  },

  clear(): void {
    accessToken = null;
    accessTokenExpiresAt = 0;
    try {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      /* nothing useful to do */
    }
  },

  /** True when there is no access token, or it is close enough to expiry to renew. */
  needsRefresh(): boolean {
    return accessToken === null || Date.now() >= accessTokenExpiresAt - EXPIRY_SKEW_MS;
  },

  /** Milliseconds until the proactive refresh should fire. Never negative. */
  msUntilRefresh(): number {
    if (accessToken === null) return 0;
    return Math.max(0, accessTokenExpiresAt - EXPIRY_SKEW_MS - Date.now());
  },

  /** A refresh token on disk means we can probably restore a session on load. */
  hasSession(): boolean {
    return this.getRefreshToken() !== null;
  },
};
