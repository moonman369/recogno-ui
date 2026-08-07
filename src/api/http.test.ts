import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  SessionExpiredError,
  refreshSession,
  request,
  setUnauthenticatedHandler,
} from './http';
import { tokenStore } from '../auth/tokenStore';
import type { AuthSession } from './authTypes';

/* -- fetch stub ---------------------------------------------------------- */

type Handler = (url: string, init: RequestInit) => Response | Promise<Response>;

let handler: Handler;
let calls: { url: string; init: RequestInit }[] = [];

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function session(overrides: Partial<AuthSession> = {}): AuthSession {
  return {
    user: {
      id: 'u1',
      email: 'a@b.c',
      displayName: null,
      avatarUrl: null,
      emailVerified: true,
      createdAt: '2026-01-01T00:00:00Z',
    },
    accessToken: 'access-new',
    refreshToken: 'refresh-new',
    tokenType: 'Bearer',
    expiresIn: 900,
    ...overrides,
  };
}

function authHeader(init: RequestInit): string | undefined {
  return (init.headers as Record<string, string> | undefined)?.authorization;
}

beforeEach(() => {
  calls = [];
  handler = () => json(200, { ok: true });
  vi.stubGlobal('fetch', (url: string, init: RequestInit = {}) => {
    calls.push({ url, init });
    return Promise.resolve(handler(url, init));
  });
  tokenStore.clear();
  setUnauthenticatedHandler(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
  tokenStore.clear();
  setUnauthenticatedHandler(null);
});

const refreshCalls = () => calls.filter((call) => call.url.endsWith('/auth/refresh'));

/* -- tests --------------------------------------------------------------- */

describe('bearer token', () => {
  it('sends the access token on protected routes and withholds it on public ones', async () => {
    tokenStore.setSession(session({ accessToken: 'access-1' }));

    await request('/decks');
    expect(authHeader(calls[0].init)).toBe('Bearer access-1');

    calls = [];
    await request('/auth/providers');
    expect(authHeader(calls[0].init)).toBeUndefined();
  });
});

describe('single-flight refresh', () => {
  it('refreshes once when two requests 401 together, then retries both', async () => {
    tokenStore.setSession(session({ accessToken: 'stale', refreshToken: 'refresh-1' }));

    let refreshed = false;
    handler = (url) => {
      if (url.endsWith('/auth/refresh')) {
        refreshed = true;
        return json(200, session({ accessToken: 'fresh', refreshToken: 'refresh-2' }));
      }
      return refreshed
        ? json(200, { data: 'ok' })
        : json(401, { error: 'Token expired', code: 'UNAUTHENTICATED' });
    };

    const [a, b] = await Promise.all([request('/decks'), request('/review/queue')]);

    expect(a).toEqual({ data: 'ok' });
    expect(b).toEqual({ data: 'ok' });
    // The whole point: a second refresh would send an already-rotated token.
    expect(refreshCalls()).toHaveLength(1);
  });

  it('persists the rotated refresh token, never the one it sent', async () => {
    tokenStore.setSession(session({ accessToken: 'stale', refreshToken: 'refresh-1' }));

    handler = (url) =>
      url.endsWith('/auth/refresh')
        ? json(200, session({ accessToken: 'fresh', refreshToken: 'refresh-rotated' }))
        : json(200, {});

    await refreshSession('stale');

    expect(tokenStore.getRefreshToken()).toBe('refresh-rotated');
    expect(tokenStore.getAccessToken()).toBe('fresh');
  });

  it('skips the refresh when another caller already rotated the token', async () => {
    tokenStore.setSession(session({ accessToken: 'stale', refreshToken: 'refresh-1' }));
    tokenStore.setSession(session({ accessToken: 'already-fresh', refreshToken: 'refresh-2' }));

    // Reactive refresh quoting the token that failed — which is no longer current.
    await refreshSession('stale');

    expect(refreshCalls()).toHaveLength(0);
  });
});

describe('401 handling', () => {
  it('signs out when the refresh token itself is rejected', async () => {
    tokenStore.setSession(session({ accessToken: 'stale', refreshToken: 'dead' }));
    const onSignOut = vi.fn();
    setUnauthenticatedHandler(onSignOut);

    handler = (url) =>
      url.endsWith('/auth/refresh')
        ? json(401, { error: 'Invalid refresh token', code: 'UNAUTHENTICATED' })
        : json(401, { error: 'Token expired', code: 'UNAUTHENTICATED' });

    await expect(request('/decks')).rejects.toBeInstanceOf(SessionExpiredError);
    expect(onSignOut).toHaveBeenCalledOnce();
    expect(tokenStore.getRefreshToken()).toBeNull();
  });

  it('keeps the session when the refresh fails with a 503', async () => {
    tokenStore.setSession(session({ accessToken: 'stale', refreshToken: 'refresh-1' }));
    const onSignOut = vi.fn();
    setUnauthenticatedHandler(onSignOut);

    handler = (url) =>
      url.endsWith('/auth/refresh')
        ? json(503, { error: 'Database unavailable', code: 'DB_UNAVAILABLE' })
        : json(401, { error: 'Token expired', code: 'UNAUTHENTICATED' });

    await expect(request('/decks')).rejects.toMatchObject({ status: 503 });
    // A brief outage must not cost the user their session.
    expect(onSignOut).not.toHaveBeenCalled();
    expect(tokenStore.getRefreshToken()).toBe('refresh-1');
  });

  it('retries the original request exactly once', async () => {
    tokenStore.setSession(session({ accessToken: 'stale', refreshToken: 'refresh-1' }));
    const onSignOut = vi.fn();
    setUnauthenticatedHandler(onSignOut);

    // Refresh succeeds but the resource keeps refusing — nothing left to try.
    handler = (url) =>
      url.endsWith('/auth/refresh')
        ? json(200, session({ accessToken: 'fresh', refreshToken: 'refresh-2' }))
        : json(401, { error: 'Token expired', code: 'UNAUTHENTICATED' });

    await expect(request('/decks')).rejects.toBeInstanceOf(SessionExpiredError);

    expect(calls.filter((call) => call.url.endsWith('/decks'))).toHaveLength(2);
    expect(refreshCalls()).toHaveLength(1);
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it('surfaces a login 401 as-is without attempting a refresh', async () => {
    handler = () => json(401, { error: 'Email or password is incorrect' });

    await expect(request('/auth/login', { method: 'POST', body: {} })).rejects.toMatchObject({
      status: 401,
      message: 'Email or password is incorrect',
    });
    expect(refreshCalls()).toHaveLength(0);
  });
});

describe('proactive refresh', () => {
  it('renews before sending when the access token is near expiry', async () => {
    // 30s of life left, inside the 60s skew window.
    tokenStore.setSession(session({ accessToken: 'expiring', expiresIn: 30 }));

    handler = (url) =>
      url.endsWith('/auth/refresh')
        ? json(200, session({ accessToken: 'fresh', refreshToken: 'refresh-2' }))
        : json(200, { data: 'ok' });

    await request('/decks');

    expect(refreshCalls()).toHaveLength(1);
    const decks = calls.find((call) => call.url.endsWith('/decks'))!;
    expect(authHeader(decks.init)).toBe('Bearer fresh');
  });

  it('does not renew while the token is comfortably valid', async () => {
    tokenStore.setSession(session({ accessToken: 'good', expiresIn: 900 }));
    await request('/decks');
    expect(refreshCalls()).toHaveLength(0);
  });
});

describe('error payloads', () => {
  it('carries the code through on a validation error', async () => {
    handler = () =>
      json(400, { error: '[{"path":["email"],"message":"Invalid email"}]', code: 'VALIDATION_ERROR' });

    const error: unknown = await request('/auth/register', { method: 'POST', body: {} }).catch(
      (cause: unknown) => cause,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).code).toBe('VALIDATION_ERROR');
  });

  it('treats 204 as an empty success', async () => {
    tokenStore.setSession(session());
    handler = () => new Response(null, { status: 204 });
    await expect(request('/auth/logout-all', { method: 'POST' })).resolves.toBeUndefined();
  });
});
