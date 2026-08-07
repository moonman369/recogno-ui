const STORAGE_KEY = 'recogno.recentPatterns';
const MAX_RECENT = 8;

/**
 * The patterns this user reaches for most recently.
 *
 * The catalog is 90 entries deep but a given person cycles through a handful.
 * Pinning those at the top turns the common case from "scroll and scan" into
 * one click, which matters when speed is 20% of the grade.
 */
export function loadRecentPatterns(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((key): key is string => typeof key === 'string') : [];
  } catch {
    return [];
  }
}

/** Most recent first, deduplicated, capped. */
export function rememberPatterns(keys: string[]): void {
  if (keys.length === 0) return;
  try {
    const next = [...keys, ...loadRecentPatterns().filter((key) => !keys.includes(key))].slice(
      0,
      MAX_RECENT,
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage is a convenience here; losing it costs nothing but a scroll.
  }
}
