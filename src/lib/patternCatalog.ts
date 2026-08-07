import type { PatternOption } from '../api/types';

/**
 * A curated taxonomy of the patterns that actually show up in interviews and
 * competitive programming, grouped the way people think about them.
 *
 * The worker owns the graded taxonomy — `GET /drill/next` returns the patterns
 * that carry an id and can be submitted as the guess. This catalog is the
 * superset used for browsing and for tagging the extra patterns a problem
 * combines. Entries are matched onto the worker's options by slug and alias,
 * so a pattern the worker knows about is never shown twice.
 */
export type CatalogEntry = {
  name: string;
  /** Canonical slug. Shared deliberately where the same pattern sits in two categories. */
  slug: string;
  /** Extra slugs/names that should resolve to this entry when the worker uses different wording. */
  aliases?: string[];
  /** Rank in the "master these first" list. Lower is more important. */
  core?: number;
  tag?: 'rare' | 'advanced';
};

export type CatalogCategory = {
  name: string;
  entries: CatalogEntry[];
};

export const PATTERN_CATALOG: CatalogCategory[] = [
  {
    name: 'Arrays & Strings',
    entries: [
      { name: 'Prefix Sum', slug: 'prefix-sum', aliases: ['cumulative-sum', 'running-sum'], core: 6 },
      { name: 'Difference Array', slug: 'difference-array', aliases: ['diff-array', 'range-update'] },
      {
        name: 'Hashing (HashMap / HashSet)',
        slug: 'hashing',
        aliases: ['arrays-and-hashing', 'hash-map', 'hash-set', 'hashmap', 'hashset', 'hash-table'],
        core: 1,
      },
      { name: 'Frequency Counting', slug: 'frequency-counting', aliases: ['counting', 'char-count'], core: 1 },
      {
        name: 'Coordinate Compression',
        slug: 'coordinate-compression',
        aliases: ['compression'],
      },
    ],
  },
  {
    name: 'Two Pointer Family',
    entries: [
      { name: 'Two Pointers', slug: 'two-pointers', aliases: ['two-pointer'], core: 2 },
      { name: 'Sliding Window', slug: 'sliding-window', aliases: ['window'], core: 3 },
      {
        name: 'Fast & Slow Pointers (Floyd Cycle Detection)',
        slug: 'fast-slow-pointers',
        aliases: ['fast-and-slow-pointers', 'floyd-cycle-detection', 'tortoise-and-hare', 'cycle-detection-linked-list'],
        core: 7,
      },
    ],
  },
  {
    name: 'Binary Search Family',
    entries: [
      { name: 'Binary Search', slug: 'binary-search', core: 5 },
      {
        name: 'Binary Search on Answer',
        slug: 'binary-search-on-answer',
        aliases: ['parametric-search', 'binary-search-the-answer'],
        core: 5,
      },
      { name: 'Ternary Search', slug: 'ternary-search', tag: 'rare' },
    ],
  },
  {
    name: 'Stack & Queue',
    entries: [
      { name: 'Monotonic Stack', slug: 'monotonic-stack', aliases: ['mono-stack'], core: 4 },
      { name: 'Monotonic Queue', slug: 'monotonic-queue', aliases: ['mono-queue'] },
      { name: 'Stack Simulation', slug: 'stack-simulation', aliases: ['stack'] },
      { name: 'Queue Simulation', slug: 'queue-simulation', aliases: ['queue'] },
      { name: 'Deque', slug: 'deque', aliases: ['double-ended-queue'] },
    ],
  },
  {
    name: 'Greedy',
    entries: [
      { name: 'Greedy', slug: 'greedy', core: 12 },
      {
        name: 'Interval Scheduling',
        slug: 'interval-scheduling',
        aliases: ['activity-selection', 'non-overlapping-intervals'],
      },
      {
        name: 'Sweep Line / Event Sorting',
        slug: 'sweep-line',
        aliases: ['line-sweep', 'event-sorting', 'scanline'],
      },
    ],
  },
  {
    name: 'Heap',
    entries: [
      {
        name: 'Heap / Priority Queue',
        slug: 'heap',
        aliases: ['priority-queue', 'heap-priority-queue', 'min-heap', 'max-heap'],
        core: 10,
      },
      { name: 'Top-K Problems', slug: 'top-k', aliases: ['top-k-elements', 'kth-largest'], core: 10 },
    ],
  },
  {
    name: 'Trees',
    entries: [
      { name: 'Tree DFS', slug: 'tree-dfs', aliases: ['tree-depth-first-search', 'tree-traversal'], core: 8 },
      {
        name: 'Tree BFS (Level Order)',
        slug: 'tree-bfs',
        aliases: ['level-order-traversal', 'tree-breadth-first-search'],
        core: 8,
      },
      { name: 'Binary Search Tree', slug: 'binary-search-tree', aliases: ['bst'], core: 8 },
      {
        name: 'Lowest Common Ancestor (LCA)',
        slug: 'lowest-common-ancestor',
        aliases: ['lca'],
      },
      { name: 'Tree DP', slug: 'tree-dp', aliases: ['dp-on-trees', 'rerooting'] },
      { name: 'Euler Tour', slug: 'euler-tour', aliases: ['euler-tour-technique'] },
      { name: 'Binary Lifting', slug: 'binary-lifting', aliases: ['sparse-ancestor'] },
    ],
  },
  {
    name: 'Graphs',
    entries: [
      {
        name: 'BFS / DFS',
        slug: 'graph-traversal',
        aliases: ['bfs', 'dfs', 'breadth-first-search', 'depth-first-search', 'bfs-dfs', 'graph-bfs', 'graph-dfs'],
        core: 9,
      },
      { name: 'Multi-source BFS', slug: 'multi-source-bfs', aliases: ['multisource-bfs'] },
      { name: '0-1 BFS', slug: 'zero-one-bfs', aliases: ['01-bfs', '0-1-bfs'] },
      { name: 'Dijkstra', slug: 'dijkstra', aliases: ['shortest-path', 'dijkstras-algorithm'], core: 17 },
      { name: 'Bellman-Ford', slug: 'bellman-ford', core: 17 },
      { name: 'Floyd-Warshall', slug: 'floyd-warshall', aliases: ['all-pairs-shortest-path'], core: 17 },
      { name: 'Topological Sort', slug: 'topological-sort', aliases: ['toposort'], core: 16 },
      { name: "Kahn's Algorithm", slug: 'kahns-algorithm', aliases: ['kahn'], core: 16 },
      {
        name: 'Union Find (DSU)',
        slug: 'union-find',
        aliases: ['dsu', 'disjoint-set-union', 'disjoint-set'],
        core: 14,
      },
      {
        name: 'Minimum Spanning Tree (Kruskal / Prim)',
        slug: 'minimum-spanning-tree',
        aliases: ['mst', 'kruskal', 'prim'],
      },
      {
        name: 'Strongly Connected Components (Kosaraju / Tarjan)',
        slug: 'strongly-connected-components',
        aliases: ['scc', 'kosaraju', 'tarjan'],
        core: 20,
      },
      {
        name: 'Bridges & Articulation Points',
        slug: 'bridges-articulation-points',
        aliases: ['bridges', 'articulation-points', 'cut-vertices'],
        core: 20,
      },
      { name: 'Bipartite Graph', slug: 'bipartite-graph', aliases: ['bipartite', 'graph-bicoloring'] },
      { name: 'Cycle Detection', slug: 'cycle-detection', aliases: ['detect-cycle'] },
      { name: 'Graph Coloring', slug: 'graph-coloring', aliases: ['coloring'] },
    ],
  },
  {
    name: 'Dynamic Programming',
    entries: [
      { name: '1D DP', slug: 'dp-1d', aliases: ['one-dimensional-dp', 'linear-dp'], core: 13 },
      { name: '2D DP', slug: 'dp-2d', aliases: ['two-dimensional-dp', 'grid-dp'], core: 13 },
      { name: 'Knapsack DP', slug: 'knapsack', aliases: ['knapsack-dp', '0-1-knapsack', 'unbounded-knapsack'], core: 13 },
      {
        name: 'LIS DP',
        slug: 'longest-increasing-subsequence',
        aliases: ['lis', 'lis-dp'],
        core: 13,
      },
      { name: 'Interval DP', slug: 'interval-dp', aliases: ['range-dp'] },
      { name: 'Digit DP', slug: 'digit-dp' },
      { name: 'Bitmask DP', slug: 'bitmask-dp', aliases: ['bit-dp', 'dp-with-bitmask'], core: 19 },
      { name: 'Tree DP', slug: 'tree-dp', aliases: ['dp-on-trees', 'rerooting'] },
      { name: 'DP on Graphs', slug: 'dp-on-graphs', aliases: ['graph-dp', 'dag-dp'] },
      { name: 'State Machine DP', slug: 'state-machine-dp', aliases: ['state-dp'] },
      { name: 'Probability DP', slug: 'probability-dp', aliases: ['expected-value-dp'] },
      { name: 'Memoization', slug: 'memoization', aliases: ['top-down-dp'], core: 13 },
    ],
  },
  {
    name: 'Recursion',
    entries: [
      { name: 'Backtracking', slug: 'backtracking', core: 11 },
      { name: 'Divide & Conquer', slug: 'divide-and-conquer', aliases: ['divide-conquer'] },
      { name: 'Branch & Bound', slug: 'branch-and-bound', tag: 'rare' },
    ],
  },
  {
    name: 'Bit Manipulation',
    entries: [
      { name: 'Bitmask', slug: 'bitmask', aliases: ['bit-manipulation', 'bits'], core: 19 },
      { name: 'XOR Tricks', slug: 'xor-tricks', aliases: ['xor'], core: 19 },
      { name: 'Bit DP', slug: 'bitmask-dp', aliases: ['bit-dp', 'dp-with-bitmask'], core: 19 },
    ],
  },
  {
    name: 'Intervals',
    entries: [
      { name: 'Merge Intervals', slug: 'merge-intervals', aliases: ['intervals', 'overlapping-intervals'] },
      { name: 'Line Sweep', slug: 'sweep-line', aliases: ['line-sweep', 'event-sorting', 'scanline'] },
      { name: 'Difference Array', slug: 'difference-array', aliases: ['diff-array', 'range-update'] },
    ],
  },
  {
    name: 'Linked Lists',
    entries: [
      {
        name: 'Fast & Slow Pointer',
        slug: 'fast-slow-pointers',
        aliases: ['fast-and-slow-pointers', 'floyd-cycle-detection', 'tortoise-and-hare'],
        core: 7,
      },
      {
        name: 'Reversal Pattern',
        slug: 'linked-list-reversal',
        aliases: ['reverse-linked-list', 'in-place-reversal'],
        core: 7,
      },
      { name: 'Dummy Node Pattern', slug: 'dummy-node', aliases: ['sentinel-node'], core: 7 },
    ],
  },
  {
    name: 'String Algorithms',
    entries: [
      { name: 'KMP', slug: 'kmp', aliases: ['knuth-morris-pratt', 'prefix-function'], core: 20 },
      { name: 'Rabin-Karp', slug: 'rabin-karp', core: 20 },
      { name: 'Z Algorithm', slug: 'z-algorithm', aliases: ['z-function'], core: 20 },
      { name: 'Trie', slug: 'trie', aliases: ['prefix-tree'], core: 15 },
      { name: 'Rolling Hash', slug: 'rolling-hash', aliases: ['string-hashing'] },
      { name: "Manacher's Algorithm", slug: 'manachers-algorithm', aliases: ['manacher'], tag: 'rare' },
      {
        name: 'Suffix Array / Suffix Automaton',
        slug: 'suffix-structures',
        aliases: ['suffix-array', 'suffix-automaton', 'suffix-tree'],
        tag: 'advanced',
      },
    ],
  },
  {
    name: 'Range Query Data Structures',
    entries: [
      { name: 'Segment Tree', slug: 'segment-tree', aliases: ['seg-tree', 'lazy-propagation'], core: 18 },
      {
        name: 'Fenwick Tree (BIT)',
        slug: 'fenwick-tree',
        aliases: ['bit', 'binary-indexed-tree'],
        core: 18,
      },
      { name: 'Sparse Table', slug: 'sparse-table', aliases: ['range-minimum-query', 'rmq'] },
      {
        name: 'Square Root Decomposition',
        slug: 'sqrt-decomposition',
        aliases: ['sqrt-decomp', 'block-decomposition'],
      },
    ],
  },
  {
    name: 'Mathematics',
    entries: [
      { name: 'GCD / LCM', slug: 'gcd-lcm', aliases: ['gcd', 'lcm', 'euclidean-algorithm'] },
      { name: 'Sieve of Eratosthenes', slug: 'sieve', aliases: ['sieve-of-eratosthenes', 'primes'] },
      { name: 'Modular Arithmetic', slug: 'modular-arithmetic', aliases: ['mod-math', 'modular-inverse'] },
      {
        name: 'Fast Exponentiation',
        slug: 'fast-exponentiation',
        aliases: ['binary-exponentiation', 'pow-mod'],
      },
      { name: 'Combinatorics', slug: 'combinatorics', aliases: ['counting-math', 'nck'] },
      { name: 'Matrix Exponentiation', slug: 'matrix-exponentiation', aliases: ['matrix-power'] },
    ],
  },
  {
    name: 'Miscellaneous',
    entries: [
      { name: 'Simulation', slug: 'simulation', aliases: ['brute-force-simulation'] },
      { name: 'Randomization', slug: 'randomization', aliases: ['random', 'reservoir-sampling'] },
      { name: 'Meet in the Middle', slug: 'meet-in-the-middle', aliases: ['mitm'] },
      { name: 'Coordinate Compression', slug: 'coordinate-compression', aliases: ['compression'] },
      {
        name: "Offline Queries (Mo's Algorithm)",
        slug: 'offline-queries',
        aliases: ['mos-algorithm', 'mo-algorithm'],
      },
      { name: 'Convex Hull Trick', slug: 'convex-hull-trick', aliases: ['cht', 'li-chao-tree'], tag: 'advanced' },
    ],
  },
];

/** Lowercase, strip punctuation and parentheticals, collapse to a single kebab token. */
export function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Every spelling a token should match under.
 *
 * The qualifier can lead or trail and both readings are common: the worker
 * seeds `dp-knapsack`, `dp-interval` and `dp-digit`, while this catalog and most
 * written material say "Knapsack DP". Registering both directions means a new
 * `dp-*` pattern on the worker resolves without anyone editing an alias list.
 */
function tokenVariants(token: string): string[] {
  const base = normalizeSlug(token);
  const variants = [base];

  if (base.startsWith('dp-')) variants.push(`${base.slice(3)}-dp`);
  else if (base.endsWith('-dp')) variants.push(`dp-${base.slice(0, -3)}`);

  return variants;
}

const ENTRY_BY_TOKEN = new Map<string, CatalogEntry>();
for (const category of PATTERN_CATALOG) {
  for (const entry of category.entries) {
    for (const token of [entry.slug, entry.name, ...(entry.aliases ?? [])]) {
      for (const key of tokenVariants(token)) {
        if (!ENTRY_BY_TOKEN.has(key)) ENTRY_BY_TOKEN.set(key, entry);
      }
    }
  }
}

/** The catalog entry a worker pattern corresponds to, if this catalog knows it. */
export function matchCatalogEntry(option: PatternOption): CatalogEntry | undefined {
  for (const token of [...tokenVariants(option.slug), ...tokenVariants(option.name)]) {
    const entry = ENTRY_BY_TOKEN.get(token);
    if (entry) return entry;
  }
  return undefined;
}

/* -- the picker's view model -------------------------------------------- */

/**
 * A selectable pattern. `id` is present only when the worker knows the pattern,
 * and only those can be submitted as the graded guess — catalog-only entries
 * can still be tagged as additional patterns, which travel in the rationale.
 */
export type PatternChoice = {
  key: string;
  name: string;
  slug: string;
  id: number | null;
  core?: number;
  tag?: 'rare' | 'advanced';
};

export type PatternGroup = {
  name: string;
  choices: PatternChoice[];
};

/**
 * Folds the worker's taxonomy into the catalog's categories.
 *
 * Every worker pattern appears exactly once: in its catalog category when the
 * catalog recognises it, otherwise under "Not in the catalog" so a taxonomy the
 * worker adds is never silently unreachable.
 */
export function buildPatternGroups(options: PatternOption[]): PatternGroup[] {
  const optionByEntrySlug = new Map<string, PatternOption>();

  for (const option of options) {
    const entry = matchCatalogEntry(option);
    if (entry) optionByEntrySlug.set(entry.slug, option);
  }

  /** Matched patterns share their catalog entry's key, so one click selects both listings. */
  const keyFor = (option: PatternOption, entry: CatalogEntry | undefined) =>
    entry ? entry.slug : `worker:${normalizeSlug(option.slug)}`;

  const groups: PatternGroup[] = [];

  // Lead with the patterns that can actually be submitted. The catalog is far
  // larger than the graded taxonomy, so burying these behind a filter is how
  // you end up with a selection that cannot be graded.
  if (options.length > 0) {
    groups.push({
      name: 'Graded taxonomy',
      choices: options.map((option) => {
        const entry = matchCatalogEntry(option);
        return {
          key: keyFor(option, entry),
          name: option.name,
          slug: option.slug,
          id: option.id,
          core: entry?.core,
          tag: entry?.tag,
        };
      }),
    });
  }

  for (const category of PATTERN_CATALOG) {
    const seen = new Set<string>();
    const choices: PatternChoice[] = [];

    for (const entry of category.entries) {
      if (seen.has(entry.slug)) continue;
      seen.add(entry.slug);

      const option = optionByEntrySlug.get(entry.slug);
      choices.push({
        key: entry.slug,
        // The worker's label wins when it has one — it is what the result
        // panel echoes back, so the two must read the same.
        name: option?.name ?? entry.name,
        slug: option?.slug ?? entry.slug,
        id: option?.id ?? null,
        core: entry.core,
        tag: entry.tag,
      });
    }

    if (choices.length > 0) groups.push({ name: category.name, choices });
  }

  return groups;
}
