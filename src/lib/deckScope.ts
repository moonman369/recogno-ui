import { ApiError } from '../api/client';

/**
 * The drill flow is scoped to a deck by a `?deckId=` search param. The server
 * wants a positive integer; anything else is treated as no scope at all, so a
 * hand-mangled URL falls back to the ordinary cross-deck draw rather than
 * erroring.
 */
export function parseDeckIdParam(raw: string | null | undefined): number | undefined {
  if (raw == null || !/^\d+$/.test(raw)) return undefined;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

export type DrillNotFound =
  /** The deck itself is gone or was never visible — a stale link or a back button. */
  | { kind: 'deck-missing' }
  /** The deck is fine but holds nothing drill-eligible yet — an expected empty state. */
  | { kind: 'deck-empty' }
  /** Unscoped 404: the caller has no drill-eligible problem anywhere. */
  | { kind: 'nothing-anywhere' };

/**
 * Splits a `/drill/next` 404 into the three cases the UI words differently.
 *
 * The server distinguishes them only by message text ("Deck {id} not found" vs
 * "No drill-eligible problems in deck {id}."), so match on that, but only when a
 * deck was actually requested — an unscoped 404 is always "nothing anywhere".
 */
export function classifyDrillNotFound(error: unknown, deckId: number | undefined): DrillNotFound {
  if (deckId === undefined) return { kind: 'nothing-anywhere' };
  const message = error instanceof ApiError ? error.message : '';
  if (/not found/i.test(message)) return { kind: 'deck-missing' };
  return { kind: 'deck-empty' };
}
