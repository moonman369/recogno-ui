import { ApiError, SessionExpiredError } from '../api/http';
import { ERROR_CODES } from '../api/authTypes';

export type FieldErrors = Record<string, string>;

/**
 * A `400 VALIDATION_ERROR` carries its `error` as a JSON string of Zod issues.
 * Turns that into one message per field, keyed by the first path segment.
 *
 * Returns null whenever the payload is not a validation error or does not
 * parse, so callers can fall back to showing the raw message.
 */
export function parseValidationError(error: unknown): FieldErrors | null {
  if (!(error instanceof ApiError) || error.code !== ERROR_CODES.validation) return null;

  let issues: unknown;
  try {
    issues = JSON.parse(error.message);
  } catch {
    return null;
  }
  if (!Array.isArray(issues)) return null;

  const fields: FieldErrors = {};
  for (const issue of issues) {
    if (typeof issue !== 'object' || issue === null) continue;
    const { path, message } = issue as { path?: unknown; message?: unknown };
    if (typeof message !== 'string') continue;

    const key = Array.isArray(path) && path.length > 0 ? String(path[0]) : '_';
    // First issue per field wins; later ones are usually less specific.
    if (!(key in fields)) fields[key] = message;
  }

  return Object.keys(fields).length > 0 ? fields : null;
}

/**
 * The message to show above a sign-in or register form.
 *
 * Bad credentials come back as a bare 401 whose message is deliberately the
 * same for an unknown email and a wrong password — pass it through verbatim
 * rather than second-guessing it, or the form leaks which accounts exist.
 */
export function authFormMessage(error: unknown): string {
  if (error instanceof SessionExpiredError) return error.message;

  if (error instanceof ApiError) {
    if (error.status === 0) return error.message;
    if (error.status === 409) return error.message;
    if (error.status === 503) {
      return `${error.message} This is usually brief — try again in a moment.`;
    }
    // Covers the 401 bad-credentials case and anything else with a message.
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

/** 503 means the database is briefly out; the form should offer a retry, not a sign-out. */
export function isRetryable(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 503 || error.status === 0);
}
