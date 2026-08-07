import { describe, expect, it } from 'vitest';
import { SPEED_WINDOW_SECONDS, SCORE_WEIGHTS, scoreTone, speedCreditAt } from './scoring';

describe('speedCreditAt', () => {
  it('runs linearly from full credit to none across the window', () => {
    expect(speedCreditAt(0)).toBe(1);
    expect(speedCreditAt(SPEED_WINDOW_SECONDS / 2)).toBeCloseTo(0.5);
    expect(speedCreditAt(SPEED_WINDOW_SECONDS)).toBe(0);
  });

  it('floors at zero rather than going negative past the window', () => {
    expect(speedCreditAt(SPEED_WINDOW_SECONDS * 3)).toBe(0);
  });
});

describe('SCORE_WEIGHTS', () => {
  it('sums to one, matching the worker composite', () => {
    const total = SCORE_WEIGHTS.correctness + SCORE_WEIGHTS.rationale + SCORE_WEIGHTS.speed;
    expect(total).toBeCloseTo(1);
  });
});

describe('scoreTone', () => {
  it('steps through the three status bands', () => {
    expect(scoreTone(1)).toBe('positive');
    expect(scoreTone(0.6)).toBe('positive');
    expect(scoreTone(0.59)).toBe('caution');
    expect(scoreTone(0.25)).toBe('caution');
    expect(scoreTone(0.24)).toBe('negative');
    expect(scoreTone(0)).toBe('negative');
  });
});
