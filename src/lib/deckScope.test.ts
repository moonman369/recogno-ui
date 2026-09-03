import { describe, expect, it } from 'vitest';
import { classifyDrillNotFound, parseDeckIdParam } from './deckScope';
import { ApiError } from '../api/client';

describe('parseDeckIdParam', () => {
  it('accepts a positive integer string', () => {
    expect(parseDeckIdParam('1')).toBe(1);
    expect(parseDeckIdParam('42')).toBe(42);
  });

  it('rejects anything that is not a plain positive integer', () => {
    for (const raw of [null, undefined, '', '0', '-3', '1.5', 'abc', '1e3', ' 4 ', '04abc']) {
      expect(parseDeckIdParam(raw)).toBeUndefined();
    }
  });

  it('rejects values past the safe-integer range', () => {
    expect(parseDeckIdParam('99999999999999999999')).toBeUndefined();
  });
});

describe('classifyDrillNotFound', () => {
  it('is always "nothing anywhere" when no deck was requested', () => {
    const error = new ApiError(404, 'No problem is available right now.');
    expect(classifyDrillNotFound(error, undefined)).toEqual({ kind: 'nothing-anywhere' });
  });

  it('reads a missing deck from the message', () => {
    const error = new ApiError(404, 'Deck 7 not found');
    expect(classifyDrillNotFound(error, 7)).toEqual({ kind: 'deck-missing' });
  });

  it('treats any other scoped 404 as an empty deck', () => {
    const error = new ApiError(404, 'No drill-eligible problems in deck 7.');
    expect(classifyDrillNotFound(error, 7)).toEqual({ kind: 'deck-empty' });
  });
});
