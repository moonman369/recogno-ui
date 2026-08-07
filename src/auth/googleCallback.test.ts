import { afterEach, describe, expect, it } from 'vitest';
import { consumeGoogleCallback } from './googleCallback';
import { tokenStore } from './tokenStore';
import { parseValidationError } from './authErrors';
import { ApiError } from '../api/http';

afterEach(() => {
  tokenStore.clear();
  window.history.replaceState(null, '', '/');
});

describe('consumeGoogleCallback', () => {
  it('stores the tokens and strips them out of the URL', () => {
    window.history.replaceState(null, '', '/drill?accessToken=a1&refreshToken=r1&foo=bar#tell');

    expect(consumeGoogleCallback()).toBe(true);

    expect(tokenStore.getAccessToken()).toBe('a1');
    expect(tokenStore.getRefreshToken()).toBe('r1');

    // The path, other params and the hash survive; the credentials do not.
    expect(window.location.pathname).toBe('/drill');
    expect(window.location.search).toBe('?foo=bar');
    expect(window.location.hash).toBe('#tell');
    expect(window.location.href).not.toContain('a1');
    expect(window.location.href).not.toContain('r1');
  });

  it('leaves an ordinary URL alone', () => {
    window.history.replaceState(null, '', '/drill?foo=bar');

    expect(consumeGoogleCallback()).toBe(false);
    expect(tokenStore.getAccessToken()).toBeNull();
    expect(window.location.search).toBe('?foo=bar');
  });

  it('ignores a half-delivered callback', () => {
    window.history.replaceState(null, '', '/?accessToken=a1');

    expect(consumeGoogleCallback()).toBe(false);
    expect(tokenStore.getAccessToken()).toBeNull();
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
