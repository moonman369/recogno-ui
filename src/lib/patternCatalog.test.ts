import { describe, expect, it } from 'vitest';
import { buildPatternGroups, matchCatalogEntry } from './patternCatalog';
import type { PatternOption } from '../api/types';

/**
 * The worker's canonical taxonomy, mirrored from
 * `recogno-server/packages/shared/src/domain/patterns.ts`.
 *
 * Every one of these must resolve to a gradeable choice. When it does not, the
 * pattern shows up in the picker with no id, the drill refuses to submit, and
 * the user is told to "add one that is" with no clue which.
 */
const CANONICAL: PatternOption[] = [
  { id: 1, slug: 'sliding-window', name: 'Sliding Window' },
  { id: 2, slug: 'two-pointers', name: 'Two Pointers' },
  { id: 3, slug: 'monotonic-stack', name: 'Monotonic Stack' },
  { id: 4, slug: 'binary-search-on-answer', name: 'Binary Search on Answer' },
  { id: 5, slug: 'bfs-dfs', name: 'BFS / DFS' },
  { id: 6, slug: 'dp-knapsack', name: 'DP — Knapsack' },
  { id: 7, slug: 'dp-interval', name: 'DP — Interval' },
  { id: 8, slug: 'dp-digit', name: 'DP — Digit' },
  { id: 9, slug: 'greedy', name: 'Greedy' },
  { id: 10, slug: 'heap', name: 'Heap' },
  { id: 11, slug: 'union-find', name: 'Union Find' },
  { id: 12, slug: 'backtracking', name: 'Backtracking' },
  { id: 13, slug: 'bitmask', name: 'Bitmask' },
];

describe('the worker taxonomy', () => {
  it.each(CANONICAL)('resolves $slug to a catalog entry', (option) => {
    expect(matchCatalogEntry(option)).toBeDefined();
  });

  it('makes every canonical pattern gradeable somewhere in the picker', () => {
    const groups = buildPatternGroups(CANONICAL);
    const gradeableIds = new Set(
      groups.flatMap((group) => group.choices.filter((c) => c.id !== null).map((c) => c.id)),
    );

    for (const option of CANONICAL) {
      expect(gradeableIds).toContain(option.id);
    }
  });

  it('leads with the graded taxonomy so the submittable set is never buried', () => {
    const groups = buildPatternGroups(CANONICAL);

    expect(groups[0].name).toBe('Graded taxonomy');
    expect(groups[0].choices).toHaveLength(CANONICAL.length);
    expect(groups[0].choices.every((choice) => choice.id !== null)).toBe(true);
  });

  it('shows the DP patterns as gradeable inside Dynamic Programming, under the worker label', () => {
    const groups = buildPatternGroups(CANONICAL);
    const dp = groups.find((group) => group.name === 'Dynamic Programming')!;

    const knapsack = dp.choices.find((choice) => choice.key === 'knapsack')!;
    expect(knapsack.id).toBe(6);
    // The worker's wording wins, because that is what the result panel echoes.
    expect(knapsack.name).toBe('DP — Knapsack');

    expect(dp.choices.find((choice) => choice.key === 'interval-dp')?.id).toBe(7);
    expect(dp.choices.find((choice) => choice.key === 'digit-dp')?.id).toBe(8);
  });

  it('keys a graded pattern identically in both listings, so one click selects both', () => {
    const groups = buildPatternGroups(CANONICAL);
    const graded = groups[0].choices.find((choice) => choice.slug === 'dp-knapsack')!;
    const inCategory = groups
      .find((group) => group.name === 'Dynamic Programming')!
      .choices.find((choice) => choice.id === 6)!;

    expect(graded.key).toBe(inCategory.key);
  });

  it('matches the qualifier in either order for patterns added later', () => {
    // Neither spelling is in any alias list; the variant rule covers both.
    expect(matchCatalogEntry({ id: 99, slug: 'dp-tree', name: 'DP — Tree' })?.slug).toBe('tree-dp');
    expect(matchCatalogEntry({ id: 99, slug: 'bitmask-dp', name: 'Bitmask DP' })?.slug).toBe(
      'bitmask-dp',
    );
  });

  it('still surfaces a pattern the catalog has never heard of', () => {
    const groups = buildPatternGroups([
      ...CANONICAL,
      { id: 99, slug: 'quantum-annealing', name: 'Quantum Annealing' },
    ]);

    const graded = groups[0].choices.find((choice) => choice.slug === 'quantum-annealing');
    expect(graded?.id).toBe(99);
  });
});
