import type { FsrsRating, Gradation } from '../api/types';

/**
 * A gradation the learner set by hand on a drill result.
 *
 * `POST /drill/submit` grades and schedules the FSRS card in one call, and the
 * worker exposes no way to revise that grade afterwards — the commit endpoint
 * belongs to note submissions, which are a different entity. So these are held
 * locally: they record what the learner actually thought of the attempt, and
 * `pendingDrillOverrides()` hands the unsent ones over the moment the worker
 * grows an endpoint to accept them.
 */
export type DrillOverride = {
  attemptId: string | null;
  problemId: number;
  problemTitle: string;
  gradation: Gradation;
  /** The FSRS rating the worker applied, kept so the two can be compared later. */
  workerRating: FsrsRating;
  recordedAt: string;
  /** Flipped once a sync path exists and the worker has accepted it. */
  synced: boolean;
};

const STORAGE_KEY = 'recogno.drillOverrides';
const MAX_STORED = 200;

function read(): DrillOverride[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DrillOverride[]) : [];
  } catch {
    // A corrupt or unavailable store must not take the drill down.
    return [];
  }
}

function write(overrides: DrillOverride[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides.slice(-MAX_STORED)));
  } catch {
    // Private mode or a full quota — the override is still shown for this session.
  }
}

export function loadDrillOverrides(): DrillOverride[] {
  return read();
}

export function pendingDrillOverrides(): DrillOverride[] {
  return read().filter((override) => !override.synced);
}

/** Records an override, replacing any earlier one for the same attempt. */
export function saveDrillOverride(override: Omit<DrillOverride, 'recordedAt' | 'synced'>): void {
  const existing = read().filter(
    (stored) => !sameAttempt(stored, override.attemptId, override.problemId),
  );
  write([...existing, { ...override, recordedAt: new Date().toISOString(), synced: false }]);
}

export function findDrillOverride(
  attemptId: string | null | undefined,
  problemId: number | undefined,
): DrillOverride | undefined {
  if (problemId === undefined) return undefined;
  return read()
    .reverse()
    .find((stored) => sameAttempt(stored, attemptId ?? null, problemId));
}

function sameAttempt(stored: DrillOverride, attemptId: string | null, problemId: number): boolean {
  // Attempts carry an id only sometimes, so fall back to the problem.
  return attemptId !== null && stored.attemptId !== null
    ? stored.attemptId === attemptId
    : stored.problemId === problemId;
}

/** The gradation band a composite score lands in, used as the starting point. */
export function suggestGradation(composite: number): Gradation {
  if (composite < 0.3) return 'try-again';
  if (composite < 0.5) return 'needs-work';
  if (composite < 0.7) return 'not-bad';
  if (composite < 0.85) return 'good-job';
  return 'excellent';
}
