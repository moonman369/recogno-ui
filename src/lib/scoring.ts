/**
 * The worker's scoring constants, mirrored so the UI can show the curve the
 * learner is actually being measured against rather than a decorative timer.
 *
 * Documented in the drill/submit description: composite is a weighted average
 * of correctness / speed / rationale at 0.5 / 0.2 / 0.3, and speed runs linearly
 * from 1.0 at 0s to 0.0 at 90s.
 */
export const SPEED_WINDOW_SECONDS = 90;

export const SCORE_WEIGHTS = {
  correctness: 0.5,
  rationale: 0.3,
  speed: 0.2,
} as const;

/** Speed credit still on the table, 1 → 0 across the window. */
export function speedCreditAt(elapsedSeconds: number): number {
  return Math.max(0, 1 - elapsedSeconds / SPEED_WINDOW_SECONDS);
}

/** Tone for a 0–1 score. Shared by the meter and the result bars so they agree. */
export function scoreTone(value: number): 'positive' | 'caution' | 'negative' {
  if (value >= 0.6) return 'positive';
  if (value >= 0.25) return 'caution';
  return 'negative';
}
