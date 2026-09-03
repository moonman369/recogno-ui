import { describe, expect, it } from 'vitest';
import { DEFAULT_THRESHOLDS, validateThresholds } from './scoringThresholds';

describe('validateThresholds', () => {
  it('passes the built-in defaults', () => {
    expect(validateThresholds(DEFAULT_THRESHOLDS)).toBeNull();
  });

  it('passes any strictly increasing triple inside [0, 1]', () => {
    expect(validateThresholds({ hard: 0.1, good: 0.2, easy: 0.9 })).toBeNull();
    expect(validateThresholds({ hard: 0.25, good: 0.5, easy: 0.75 })).toBeNull();
    expect(validateThresholds({ hard: 0, good: 0.01, easy: 1 })).toBeNull();
  });

  it('rejects a non-numeric field', () => {
    expect(validateThresholds({ easy: Number.NaN, good: 0.5, hard: 0.3 })).toMatch(/number/i);
  });

  it('rejects values outside [0, 1]', () => {
    expect(validateThresholds({ easy: 1.2, good: 0.5, hard: 0.3 })).toMatch(/between 0 and 1/i);
    expect(validateThresholds({ easy: 0.8, good: 0.5, hard: -0.1 })).toMatch(/between 0 and 1/i);
  });

  it('requires hard strictly below good', () => {
    expect(validateThresholds({ easy: 0.8, good: 0.5, hard: 0.5 })).toMatch(/hard/i);
    expect(validateThresholds({ easy: 0.8, good: 0.5, hard: 0.6 })).toMatch(/hard/i);
  });

  it('requires good strictly below easy', () => {
    expect(validateThresholds({ easy: 0.5, good: 0.5, hard: 0.3 })).toMatch(/good/i);
    expect(validateThresholds({ easy: 0.5, good: 0.7, hard: 0.3 })).toMatch(/good/i);
  });
});
