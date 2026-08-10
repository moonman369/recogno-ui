import { afterEach, describe, expect, it } from 'vitest';
import {
  consumeOAuthCallback,
  describeOAuthFailure,
  resetOAuthCallbackResult,
  takeOAuthCallbackResult,
} from './googleCallback';
import { tokenStore } from './tokenStore';
import { parseValidationError } from './authErrors';
import { ApiError } from '../api/http';

afterEach(() => {
  tokenStore.clear();
  resetOAuthCallbackResult();
  window.history.replaceState(null, '', '/');
});

describe('consumeOAuthCallback', () => {
  it('stores the session and strips it out of the URL', () => {
    window.history.replaceState(
      null,
      '',
      '/auth/callback?accessToken=a1&refreshToken=r1&foo=bar#tell',
    );

    expect(consumeOAuthCallback()).toEqual({ status: 'success' });

    expect(tokenStore.getAccessToken()).toBe('a1');
    expect(tokenStore.getRefreshToken()).toBe('r1');

    // Path, unrelated params and hash survive; the credentials do not.
    expect(window.location.pathname).toBe('/auth/callback');
    expect(window.location.search).toBe('?foo=bar');
    expect(window.location.hash).toBe('#tell');
    expect(window.location.href).not.toContain('a1');
    expect(window.location.href).not.toContain('r1');
  });

  it('captures a failure and strips the error params too', () => {
    window.history.replaceState(
      null,
      '',
      '/auth/callback?error=access_denied&error_description=User%20said%20no',
    );

    expect(consumeOAuthCallback()).toEqual({
      status: 'error',
      code: 'access_denied',
      description: 'User said no',
    });

    expect(tokenStore.getAccessToken()).toBeNull();
    expect(window.location.search).toBe('');
  });

  it('holds the result for the callback screen, which renders after the scrub', () => {
    window.history.replaceState(null, '', '/auth/callback?accessToken=a1&refreshToken=r1');
    consumeOAuthCallback();

    expect(takeOAuthCallbackResult()).toEqual({ status: 'success' });
  });

  it('leaves an ordinary URL alone', () => {
    window.history.replaceState(null, '', '/drill?foo=bar');

    expect(consumeOAuthCallback()).toBeNull();
    expect(tokenStore.getAccessToken()).toBeNull();
    expect(window.location.search).toBe('?foo=bar');
  });

  it('ignores a half-delivered session rather than storing a useless half', () => {
    window.history.replaceState(null, '', '/auth/callback?accessToken=a1');

    expect(consumeOAuthCallback()).toBeNull();
    expect(tokenStore.getAccessToken()).toBeNull();
  });
});

describe('describeOAuthFailure', () => {
  it('treats a cancelled consent as neutral, not as a fault', () => {
    const failure = describeOAuthFailure('access_denied', null);
    expect(failure.tone).toBe('neutral');
    expect(failure.title).toBe('Sign-in cancelled');
    expect(failure.suggestPassword).toBe(false);
  });

  it('routes the unverified-email conflict to the password flow', () => {
    const failure = describeOAuthFailure(
      null,
      'An account already exists for this email address, but Google has not confirmed that you own it.',
    );

    expect(failure.suggestPassword).toBe(true);
    expect(failure.tone).toBe('error');
    // The server's own wording is preserved — it explains the resolution.
    expect(failure.body).toContain('already exists');
  });

  it('explains an expired state without alarming', () => {
    expect(describeOAuthFailure(null, 'Invalid or expired state; restart the sign-in').tone).toBe(
      'neutral',
    );
  });

  it('falls back to the server description for anything unrecognised', () => {
    const failure = describeOAuthFailure('boom', 'Could not exchange the code: 400');
    expect(failure.tone).toBe('error');
    expect(failure.body).toBe('Could not exchange the code: 400');
  });

  it('still says something useful with no detail at all', () => {
    expect(describeOAuthFailure(null, null).body).toBeTruthy();
  });
});

describe('parseValidationError', () => {
  it('maps Zod issues onto field names', () => {
    const error = new ApiError(
      400,
      JSON.stringify([
        { path: ['email'], message: 'Invalid email' },
        { path: ['password'], message: 'Too short' },
        { path: ['password'], message: 'Also weak' },
      ]),
      'VALIDATION_ERROR',
    );

    expect(parseValidationError(error)).toEqual({
      email: 'Invalid email',
      password: 'Too short',
    });
  });

  it('returns null for anything that is not a parseable validation error', () => {
    expect(parseValidationError(new ApiError(409, 'Email already registered'))).toBeNull();
    expect(parseValidationError(new ApiError(400, 'not json', 'VALIDATION_ERROR'))).toBeNull();
    expect(parseValidationError(new Error('nope'))).toBeNull();
  });
});
