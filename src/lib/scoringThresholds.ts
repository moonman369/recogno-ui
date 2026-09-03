import type { ScoringThresholds } from '../api/types';

/**
 * What every user is graded against until they save an override. Mirrors the
 * server's built-in bands (`recogno-server` `/settings/scoring`), used only to
 * seed and label the form — the server stays the source of truth.
 */
export const DEFAULT_THRESHOLDS: ScoringThresholds = { easy: 0.8, good: 0.55, hard: 0.3 };

/** The server enforces `hard < good < easy`, strictly, with each in [0, 1]. Mirror it before submitting. */
export function validateThresholds(t: ScoringThresholds): string | null {
  const entries: [keyof ScoringThresholds, number][] = [
    ['easy', t.easy],
    ['good', t.good],
    ['hard', t.hard],
  ];
  for (const [name, value] of entries) {
    if (!Number.isFinite(value)) return `Enter a number for "${name}".`;
    if (value < 0 || value > 1) return 'Every threshold must be between 0 and 1.';
  }
  if (!(t.hard < t.good)) return 'Hard must be strictly below Good.';
  if (!(t.good < t.easy)) return 'Good must be strictly below Easy.';
  return null;
}
