/**
 * The worker's scoring constants, mirrored so the UI can show the curve the
 * learner is actually being measured against rather than a decorative timer.
 *
 * Source of truth: `recogno-server/packages/api/src/drill/scoring.ts`. These
 * must be kept in step with it — a meter that disagrees with the grader is
 * worse than no meter, because it is confidently wrong.
 */

/** Full speed credit for anything answered inside this window. */
export const SPEED_GRACE_SECONDS = 45;

/** Speed credit decays linearly from the grace point and reaches zero here. */
export const SPEED_FLOOR_SECONDS = 300;

export const SCORE_WEIGHTS = {
  correctness: 0.5,
  rationale: 0.3,
  speed: 0.2,
} as const;

/**
 * Lower bound of each FSRS rating band. Below `hard` the attempt is a genuine
 * failure and the card lapses.
 */
export const RATING_THRESHOLDS = {
  easy: 0.8,
  good: 0.55,
  hard: 0.3,
} as const;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Speed credit still on the table.
 *
 * Flat at 1.0 through the grace window — reading the constraints is not
 * slowness — then a linear decay to zero at the floor.
 */
export function speedCreditAt(elapsedSeconds: number): number {
  if (!Number.isFinite(elapsedSeconds)) return 0;
  if (elapsedSeconds <= SPEED_GRACE_SECONDS) return 1;

  const decayWindow = SPEED_FLOOR_SECONDS - SPEED_GRACE_SECONDS;
  return clamp01(1 - (elapsedSeconds - SPEED_GRACE_SECONDS) / decayWindow);
}

/** Tone for a 0-1 score, keyed to the real rating bands rather than round numbers. */
export function scoreTone(value: number): 'positive' | 'caution' | 'negative' {
  if (value >= RATING_THRESHOLDS.good) return 'positive';
  if (value >= RATING_THRESHOLDS.hard) return 'caution';
  return 'negative';
}
