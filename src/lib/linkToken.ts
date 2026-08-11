/**
 * Reads a single-use token out of the query string and scrubs it immediately.
 *
 * Emailed links carry the token in the URL, which means it reaches the address
 * bar, the history entry, and any referrer sent from the page. Nothing can undo
 * it having been there, but leaving it is worse: a token in history is one Back
 * press or one shared screenshot from being reused, and both link types are
 * credentials in their own right.
 *
 * `replaceState` rewrites the current entry rather than pushing a new one, so
 * Back does not walk onto the un-scrubbed URL.
 *
 * Call this once, from a `useState` initialiser, so the scrub happens on the
 * first render rather than after an effect has already painted the raw URL.
 */
export function takeLinkToken(cleanPath: string, param = 'token'): string | null {
  if (typeof window === 'undefined') return null;

  const url = new URL(window.location.href);
  const token = url.searchParams.get(param);
  if (!token) return null;

  window.history.replaceState({}, '', cleanPath);
  return token;
}
