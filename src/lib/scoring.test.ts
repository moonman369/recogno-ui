import { describe, expect, it } from 'vitest';
import {
  RATING_THRESHOLDS,
  SCORE_WEIGHTS,
  SPEED_FLOOR_SECONDS,
  SPEED_GRACE_SECONDS,
  scoreTone,
  speedCreditAt,
} from './scoring';

describe('speedCreditAt', () => {
  it('gives full credit through the grace window', () => {
    expect(speedCreditAt(0)).toBe(1);
    expect(speedCreditAt(SPEED_GRACE_SECONDS)).toBe(1);
  });

  it('decays linearly from the grace point to the floor', () => {
    const mid = (SPEED_GRACE_SECONDS + SPEED_FLOOR_SECONDS) / 2;
    expect(speedCreditAt(mid)).toBeCloseTo(0.5);
    expect(speedCreditAt(SPEED_FLOOR_SECONDS)).toBe(0);
  });

  it("matches the grader's published points", () => {
    // From the worker's own comment table.
    expect(speedCreditAt(60)).toBeCloseTo(0.94, 2);
    expect(speedCreditAt(90)).toBeCloseTo(0.82, 2);
    expect(speedCreditAt(120)).toBeCloseTo(0.71, 2);
    expect(speedCreditAt(150)).toBeCloseTo(0.59, 2);
  });

  it('floors at zero rather than going negative', () => {
    expect(speedCreditAt(SPEED_FLOOR_SECONDS * 3)).toBe(0);
  });
});

describe('SCORE_WEIGHTS', () => {
  it('sums to one, matching the worker composite', () => {
    const total = SCORE_WEIGHTS.correctness + SCORE_WEIGHTS.rationale + SCORE_WEIGHTS.speed;
    expect(total).toBeCloseTo(1);
  });
});

describe('scoreTone', () => {
  it('steps on the real rating bands', () => {
    expect(scoreTone(1)).toBe('positive');
    expect(scoreTone(RATING_THRESHOLDS.good)).toBe('positive');
    expect(scoreTone(RATING_THRESHOLDS.good - 0.01)).toBe('caution');
    expect(scoreTone(RATING_THRESHOLDS.hard)).toBe('caution');
    expect(scoreTone(RATING_THRESHOLDS.hard - 0.01)).toBe('negative');
  });
});
