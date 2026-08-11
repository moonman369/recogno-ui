import { afterEach, describe, expect, it } from 'vitest';
import { takeLinkToken } from './linkToken';

afterEach(() => {
  window.history.replaceState({}, '', '/');
});

describe('takeLinkToken', () => {
  it('returns the token and scrubs it from the URL', () => {
    window.history.replaceState({}, '', '/verify-email?token=abc123');

    expect(takeLinkToken('/verify-email')).toBe('abc123');

    // Both link types are credentials; leaving one in history is one Back press
    // from being reused.
    expect(window.location.pathname).toBe('/verify-email');
    expect(window.location.search).toBe('');
    expect(window.location.href).not.toContain('abc123');
  });

  it('returns null and leaves an ordinary URL alone', () => {
    window.history.replaceState({}, '', '/reset-password');

    expect(takeLinkToken('/reset-password')).toBeNull();
    expect(window.location.pathname).toBe('/reset-password');
  });

  it('does not treat an empty token as present', () => {
    window.history.replaceState({}, '', '/verify-email?token=');
    expect(takeLinkToken('/verify-email')).toBeNull();
  });

  it('reads a differently named parameter when asked', () => {
    window.history.replaceState({}, '', '/reset-password?code=xyz');
    expect(takeLinkToken('/reset-password', 'code')).toBe('xyz');
    expect(window.location.search).toBe('');
  });
});
