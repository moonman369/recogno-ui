import type { Difficulty, DrillSource, Gradation, ProblemMode, SubmissionStatus } from '../api/types';

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
];

/** "in 3 days" / "2 hours ago", falling back to "now" under a minute. */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const delta = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(delta)) return '—';

  for (const [unit, ms] of UNITS) {
    if (Math.abs(delta) >= ms) return rtf.format(Math.round(delta / ms), unit);
  }
  return 'now';
}

export function absoluteTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

export function isDue(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() <= Date.now();
}

export function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = Math.floor(total % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export const DIFFICULTY_TONE: Record<Difficulty, string> = {
  easy: 'text-positive',
  medium: 'text-caution',
  hard: 'text-negative',
};

export const DRILL_SOURCE_LABEL: Record<DrillSource, string> = {
  due: 'Due now',
  unseen: 'New to you',
  'review-ahead': 'Reviewing ahead',
};

export const MODE_LABEL: Record<ProblemMode, string> = {
  drill: 'Drill',
  note: 'Note',
};

export const GRADATION_LABEL: Record<Gradation, string> = {
  'try-again': 'Try again',
  'needs-work': 'Needs work',
  'not-bad': 'Not bad',
  'good-job': 'Good job',
  excellent: 'Excellent',
};

export const GRADATION_TONE: Record<Gradation, string> = {
  'try-again': 'text-negative',
  'needs-work': 'text-negative',
  'not-bad': 'text-caution',
  'good-job': 'text-positive',
  excellent: 'text-positive',
};

export const STATUS_LABEL: Record<SubmissionStatus, string> = {
  queued: 'Queued',
  'resolving-source': 'Resolving source',
  evaluating: 'Evaluating',
  'awaiting-review': 'Awaiting your review',
  committed: 'Committed',
  failed: 'Failed',
};

/** 0 New, 1 Learning, 2 Review, 3 Relearning. */
export function fsrsStateLabel(state: number): string {
  return ['New', 'Learning', 'Review', 'Relearning'][state] ?? `State ${state}`;
}

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
