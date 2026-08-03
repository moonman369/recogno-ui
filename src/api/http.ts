import { ERROR_CODES, type AuthSession } from './authTypes';
import { tokenStore } from '../auth/tokenStore';

export const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787').replace(
  /\/+$/,
  '',
);

/**
 * Legacy stub identity from before real auth. Sent only when there is no access
 * token, so a worker still running the `x-user-id` placeholder keeps working.
 */
const STUB_USER_ID = import.meta.env.VITE_USER_ID?.trim();

/** Routes that must never carry a bearer token. `/auth/refresh` included: it authenticates itself. */
const PUBLIC_PATHS = new Set([
  '/auth/providers',
  '/auth/register',
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
  '/auth/google',
  '/health',
]);

/** A non-2xx response. `code` is the API's machine-readable discriminator when it sent one. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** Raised when the session is gone for good and the user has to sign in again. */
export class SessionExpiredError extends Error {
  constructor(message = 'Your session has expired. Please sign in again.') {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

export function isUnauthenticated(error: unknown): boolean {
  return (
    error instanceof SessionExpiredError ||
    (error instanceof ApiError &&
      error.status === 401 &&
      error.code === ERROR_CODES.unauthenticated)
  );
}

/** 503 — the database is briefly unavailable. Retryable, and never a reason to sign out. */
export function isUnavailable(error: unknown): boolean {
  return error instanceof ApiError && error.status === 503;
}

/* -- sign-out notification ---------------------------------------------- */

let onUnauthenticated: (() => void) | null = null;

/** Registered by `AuthProvider` so a dead refresh token can tear the session down. */
export function setUnauthenticatedHandler(handler: (() => void) | null): void {
  onUnauthenticated = handler;
}

function forceSignOut(): void {
  tokenStore.clear();
  onUnauthenticated?.();
}

/* -- transport ----------------------------------------------------------- */

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  /** Overrides the `PUBLIC_PATHS` default. */
  auth?: boolean;
};

async function send(path: string, options: RequestOptions, withAuth: boolean): Promise<Response> {
  const { method = 'GET', body, signal } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['content-type'] = 'application/json';

  if (withAuth) {
    const accessToken = tokenStore.getAccessToken();
    if (accessToken) headers.authorization = `Bearer ${accessToken}`;
    else if (STUB_USER_ID) headers['x-user-id'] = STUB_USER_ID;
  }

  try {
    return await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    throw new ApiError(0, `Could not reach the Recogno API at ${BASE_URL}.`);
  }
}

async function toResult<T>(response: Response): Promise<T> {
  // 204 has no body; logout and logout-all both use it.
  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const shape = (payload ?? {}) as { error?: unknown; code?: unknown };
    const message =
      typeof shape.error === 'string' ? shape.error : `Request failed with ${response.status}.`;
    const code = typeof shape.code === 'string' ? shape.code : undefined;
    throw new ApiError(response.status, message, code);
  }

  return payload as T;
}

/* -- refresh ------------------------------------------------------------- */

const REFRESH_LOCK = 'recogno.auth.refresh';

/** In-page single-flight. Two 401s in the same tab share one refresh. */
let inFlightRefresh: Promise<void> | null = null;

/**
 * Cross-tab single-flight, where the browser supports it.
 *
 * Refresh tokens rotate, so two concurrent refreshes are actively harmful: the
 * second sends a token the first already invalidated, gets a 401 back, and
 * signs a perfectly good session out. The in-page promise covers one tab; the
 * Web Locks API covers the rest. Whoever waits on the lock re-reads the token
 * afterwards, so it picks up whatever the winner rotated to.
 */
async function withRefreshLock<T>(run: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && 'locks' in navigator) {
    return navigator.locks.request(REFRESH_LOCK, run) as Promise<T>;
  }
  return run();
}

async function performRefresh(staleAccessToken: string | null | undefined): Promise<void> {
  await withRefreshLock(async () => {
    // Someone else may have refreshed while we queued for the lock.
    const alreadyDone =
      staleAccessToken === undefined
        ? // Proactive: only renew if the token is actually near expiry.
          !tokenStore.needsRefresh()
        : // Reactive: the token that just 401'd has since been replaced.
          tokenStore.getAccessToken() !== staleAccessToken;
    if (alreadyDone) return;

    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) throw new SessionExpiredError();

    let session: AuthSession;
    try {
      const response = await send('/auth/refresh', { method: 'POST', body: { refreshToken } }, false);
      session = await toResult<AuthSession>(response);
    } catch (cause) {
      // A rejected refresh token is terminal. A 503 or a dropped connection is
      // not — keep the session so a retry can succeed.
      if (cause instanceof ApiError && (cause.status === 401 || cause.status === 403)) {
        forceSignOut();
        throw new SessionExpiredError();
      }
      throw cause;
    }

    // Always persist the rotated token, never the one we sent.
    tokenStore.setSession(session);
  });
}

/**
 * Refreshes at most once concurrently; callers all await the same attempt.
 *
 * Pass the access token that was just rejected to renew reactively, or nothing
 * to renew proactively on the strength of the expiry clock alone.
 */
export function refreshSession(staleAccessToken?: string | null): Promise<void> {
  if (inFlightRefresh) return inFlightRefresh;

  inFlightRefresh = performRefresh(staleAccessToken).finally(() => {
    inFlightRefresh = null;
  });

  return inFlightRefresh;
}

/* -- public entry point --------------------------------------------------- */

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const withAuth = options.auth ?? !PUBLIC_PATHS.has(path);

  if (!withAuth) return toResult<T>(await send(path, options, false));

  // Proactive: an access token lasts 15 minutes, so renew it just before it
  // lapses instead of spending a round trip discovering it already has.
  if (tokenStore.needsRefresh() && tokenStore.hasSession()) {
    try {
      await refreshSession();
    } catch (cause) {
      if (cause instanceof SessionExpiredError) throw cause;
      // Transient failure — carry on with the token we have and let the
      // response decide. It may well still be valid.
    }
  }

  const usedToken = tokenStore.getAccessToken();
  const response = await send(path, options, true);
  if (response.status !== 401) return toResult<T>(response);

  // Reactive: one refresh, one retry, then give up.
  if (!tokenStore.hasSession()) {
    forceSignOut();
    throw new SessionExpiredError();
  }

  // A failing refresh throws — SessionExpiredError if the token was rejected,
  // the underlying ApiError if it was merely a 503 or a dropped connection, so
  // a transient outage never signs anyone out.
  await refreshSession(usedToken);

  const retried = await send(path, options, true);
  if (retried.status === 401) {
    // Refreshed successfully and still refused: nothing left to try.
    forceSignOut();
    throw new SessionExpiredError();
  }

  return toResult<T>(retried);
}
