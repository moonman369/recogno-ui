import { cx } from '../lib/format';

/**
 * The hero's focal visual: eight real algorithm patterns tracing themselves, on
 * a 24-second loop of 3-second scenes.
 *
 * This is the product argument in one image — every shape here is one of the
 * patterns the drill actually grades, and recognising them on sight is the
 * whole skill. An abstract blob would say nothing.
 *
 * The scenes are deliberately unlabelled. Naming each one turns the visual into
 * a lesson the viewer reads; leaving it unnamed makes it something they
 * recognise, which is the point of the product. The `aria-label` still
 * describes all eight, so nothing is lost to a screen reader.
 *
 * Implementation: pure SVG + CSS keyframes — no JS timer, no React re-renders,
 * one composited layer, nothing per frame. Only `transform` and `opacity` are
 * animated; anything that would change geometry per frame is expressed as a
 * transform against a derived resting position instead.
 *
 * Timing model — every child animation runs the *whole* 24s loop, not its own
 * 3s scene. A child's scene occupies the first 12.5% of that timeline (its
 * `animation-delay` puts it there); by 14% every keyframe is back at its
 * resting state and stays there for the remaining 86%. That single rule is what
 * makes staggering safe: a stagger that is not a whole number of scenes leaves
 * a child mid-timeline when its scene next appears, and with a long resting
 * tail "mid-timeline" always means "at rest". `backwards` fill covers the very
 * first cycle, before a delayed child's animation has started at all.
 *
 * Geometry model — nothing here is an eyeballed pixel offset. Every animated
 * distance is derived from the same data the static shapes are drawn from and
 * handed to CSS as a custom property, so moving a cell or a node moves the
 * animation with it.
 *
 * Under reduced motion the stylesheet freezes it on the first scene.
 */

const SCENE_SECONDS = 3;
const SCENE_COUNT = 8;

/** The surface every scene composes against. Scenes centre on its middle. */
const VIEW_W = 320;
const VIEW_H = 180;
const MID_X = VIEW_W / 2;
const MID_Y = VIEW_H / 2;

/** Hop counts from `start` over an undirected edge list — a BFS, fittingly. */
function hopsFrom(edges: readonly (readonly [number, number])[], start: number) {
  const hops = new Map<number, number>([[start, 0]]);
  const queue = [start];
  for (let head = 0; head < queue.length; head += 1) {
    const node = queue[head];
    for (const [a, b] of edges) {
      const next = a === node ? b : b === node ? a : null;
      if (next !== null && !hops.has(next)) {
        hops.set(next, hops.get(node)! + 1);
        queue.push(next);
      }
    }
  }
  return hops;
}

/* -- the array the window, pointer, search and bar scenes share ---------- */

const CELL_W = 30;
const CELL_H = 34;
const CELL_RX = 7;
const CELL_PITCH = 38;
const CELL_COUNT = 7;

const ARRAY_W = (CELL_COUNT - 1) * CELL_PITCH + CELL_W;
const CELL_X = (VIEW_W - ARRAY_W) / 2;
const CELL_Y = (VIEW_H - CELL_H) / 2;
const CELLS = Array.from({ length: CELL_COUNT }, (_, index) => CELL_X + index * CELL_PITCH);

/** Breathing room between a highlight and the cells it wraps, on both axes. */
const HL_PAD = 4;

/**
 * A highlight wrapping `span` cells starting at `from`. Padded equally on all
 * four sides and given a corner radius that stays concentric with the cells',
 * so it reads as a box drawn *around* them rather than one that happens to
 * overlap.
 */
function highlight(from: number, span: number) {
  const left = CELLS[from] - HL_PAD;
  const right = CELLS[from + span - 1] + CELL_W + HL_PAD;
  return {
    x: left,
    y: CELL_Y - HL_PAD,
    width: right - left,
    height: CELL_H + HL_PAD * 2,
    rx: CELL_RX + HL_PAD,
  };
}

const cellCentre = (index: number) => CELLS[index] + CELL_W / 2;

/** 1 — the window covers the leftmost cells and sweeps to the rightmost. */
const WINDOW_SPAN = 3;
const WINDOW = highlight(0, WINDOW_SPAN);
const WINDOW_SWEEP = highlight(CELL_COUNT - WINDOW_SPAN, WINDOW_SPAN).x - WINDOW.x;

/** 2 — the pointers stop one either side of the middle cell. */
const CONVERGE_LEFT = cellCentre(Math.floor(CELL_COUNT / 2) - 1) - cellCentre(0);
const CONVERGE_RIGHT = cellCentre(Math.ceil(CELL_COUNT / 2)) - cellCentre(CELL_COUNT - 1);

/**
 * 4 — the live range after each discarded half, from an actual binary search
 * rather than three eyeballed widths. Every range ends on a cell boundary, so
 * no step ever cuts a cell down the middle.
 */
const BINARY_RANGES = (() => {
  const ranges = [];
  let lo = 0;
  const hi = CELL_COUNT - 1;
  ranges.push(highlight(lo, hi - lo + 1));
  while (lo < hi) {
    lo = Math.floor((lo + hi) / 2) + 1; // the answer lies right of the midpoint
    ranges.push(highlight(lo, hi - lo + 1));
  }
  return ranges;
})();

/* -- 3: breadth-first search -------------------------------------------- */

const BFS_ROOT_R = 7;
const BFS_NODE_R = 5.5;
/** Base radius of the frontier rings; each ring scales up to its own level. */
const BFS_RING_R = 12;
/** How far past a level's nodes its ring travels before dissolving. */
const BFS_RING_CLEAR = 5;
/** How long one level of the frontier takes. */
const BFS_LEVEL_SECONDS = 0.5;

const BFS_NODES = [
  { cx: MID_X, cy: MID_Y },
  { cx: MID_X - 44, cy: MID_Y },
  { cx: MID_X + 44, cy: MID_Y },
  { cx: MID_X, cy: MID_Y - 36 },
  { cx: MID_X, cy: MID_Y + 36 },
  { cx: MID_X - 68, cy: MID_Y - 34 },
  { cx: MID_X + 68, cy: MID_Y + 34 },
];

const BFS_EDGES = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [1, 5],
  [2, 6],
] as const;

const BFS_LEVEL = hopsFrom(BFS_EDGES, 0);
const BFS_LEVELS = Math.max(...BFS_LEVEL.values()) + 1;

/** The ring for a level lands just outside that level's furthest node. */
const bfsRingReach = (level: number) => {
  const root = BFS_NODES[0];
  const reach = Math.max(
    ...BFS_NODES.filter((_, index) => BFS_LEVEL.get(index) === level).map((node) =>
      Math.hypot(node.cx - root.cx, node.cy - root.cy),
    ),
  );
  return (reach + (level === 0 ? BFS_ROOT_R : BFS_NODE_R) + BFS_RING_CLEAR) / BFS_RING_R;
};

/* -- 5: monotonic stack -------------------------------------------------- */

/**
 * A decreasing monotonic stack over the same column positions as the array.
 * The kept bars descend left to right, so nothing on the stack is ever popped
 * twice, and every popped bar is shorter than the bar immediately after it —
 * which is exactly the bar that pops it. Both facts are read back out of the
 * heights below rather than asserted alongside them.
 */
const BAR_HEIGHTS = [28, 62, 20, 52, 16, 42, 32];
const BAR_RX = 5;
const BAR_BASELINE = MID_Y + Math.max(...BAR_HEIGHTS) / 2;
const BAR_POP_SECONDS = 0.32;

const barPopped = (index: number) =>
  index < BAR_HEIGHTS.length - 1 && BAR_HEIGHTS[index] < BAR_HEIGHTS[index + 1];

const BAR_POP_ORDER = BAR_HEIGHTS.map((_, index) => index).filter(barPopped);

/* -- 6: heap sift -------------------------------------------------------- */

const HEAP_LEVELS = 3;
const HEAP_LEVEL_GAP = 42;
const HEAP_LEAF_PITCH = 52;
const HEAP_NODE_R = 9;

/** A complete tree in array order: node `i`'s children are `2i+1` and `2i+2`. */
const HEAP = Array.from({ length: 2 ** HEAP_LEVELS - 1 }, (_, index) => {
  const level = Math.floor(Math.log2(index + 1));
  const withinLevel = index + 1 - 2 ** level;
  const pitch = HEAP_LEAF_PITCH * 2 ** (HEAP_LEVELS - 1 - level);
  return {
    cx: MID_X + (withinLevel - (2 ** level - 1) / 2) * pitch,
    cy: MID_Y + (level - (HEAP_LEVELS - 1) / 2) * HEAP_LEVEL_GAP,
  };
});

/** The sift path: from the root, taking the right child every time. */
const SIFT_PATH = [0];
for (let node = 0; node * 2 + 2 < HEAP.length; node = node * 2 + 2) {
  SIFT_PATH.push(node * 2 + 2);
}

/** Each hop as an offset from the root, which is where the moving value starts. */
const SIFT_HOPS = SIFT_PATH.slice(1).map((node) => ({
  dx: HEAP[node].cx - HEAP[0].cx,
  dy: HEAP[node].cy - HEAP[0].cy,
}));

/* -- 7: union-find ------------------------------------------------------- */

const DSU_NODE_R = 8;
const DSU_BRIDGE_W = 3;
/** One extra hop out from the bridge. */
const DSU_HOP_SECONDS = 0.34;
/** Tie-break between nodes the same distance out, so the colour still travels. */
const DSU_RANK_SECONDS = 0.14;

/** Two mirrored three-node components; the middle node of each anchors the bridge. */
const DSU_SIDE = [
  { dx: 86, dy: -28 },
  { dx: 44, dy: 0 },
  { dx: 82, dy: 28 },
];

const DSU = [
  ...DSU_SIDE.map(({ dx, dy }) => ({ cx: MID_X - dx, cy: MID_Y + dy })),
  ...DSU_SIDE.map(({ dx, dy }) => ({ cx: MID_X + dx, cy: MID_Y + dy })),
];

const DSU_EDGES = [
  [0, 1],
  [1, 2],
  [3, 4],
  [4, 5],
] as const;

/** The bridge joins the two anchors; index 4 is the side that gets absorbed. */
const DSU_BRIDGE = [1, 4] as const;
const DSU_LINK = {
  x: DSU[DSU_BRIDGE[0]].cx,
  y: (DSU[DSU_BRIDGE[0]].cy + DSU[DSU_BRIDGE[1]].cy) / 2 - DSU_BRIDGE_W / 2,
  width: DSU[DSU_BRIDGE[1]].cx - DSU[DSU_BRIDGE[0]].cx,
};

/**
 * The absorbed component, ordered the way the root's colour actually reaches
 * it: outward from where the bridge lands, left to right within a hop. Ordering
 * by array index instead would light the far corner before the node the bridge
 * touched.
 */
const DSU_HOPS = hopsFrom(DSU_EDGES, DSU_BRIDGE[1]);
const DSU_ABSORBED = DSU.map((_, index) => index)
  .filter((index) => DSU_HOPS.has(index))
  .sort((a, b) => DSU_HOPS.get(a)! - DSU_HOPS.get(b)! || DSU[a].cx - DSU[b].cx);
const DSU_ROOT_SIDE = DSU.map((_, index) => index).filter((index) => !DSU_HOPS.has(index));

const dsuMergeDelay = (index: number) => {
  const hop = DSU_HOPS.get(index)!;
  const rank = DSU_ABSORBED.filter((other) => DSU_HOPS.get(other) === hop).indexOf(index);
  return hop * DSU_HOP_SECONDS + rank * DSU_RANK_SECONDS;
};

/** The bridge has to land before anything adopts a colour across it. */
const DSU_MERGE_START = 0.96;

/* -- 8: dynamic programming ---------------------------------------------- */

const DP_CELL = 26;
const DP_GAP = 6;
const DP_COLS = 6;
const DP_ROWS = 3;
const DP_ORIGIN_X = (VIEW_W - (DP_COLS * (DP_CELL + DP_GAP) - DP_GAP)) / 2;
const DP_ORIGIN_Y = (VIEW_H - (DP_ROWS * (DP_CELL + DP_GAP) - DP_GAP)) / 2;

/** Cell to cell along a row, then an extra beat at each row break so the
 *  row-major order is legible rather than one undifferentiated wash. */
const DP_COL_SECONDS = 0.075;
const DP_ROW_SECONDS = DP_COLS * DP_COL_SECONDS + 0.06;

const DP_CELLS = Array.from({ length: DP_ROWS * DP_COLS }, (_, index) => {
  const row = Math.floor(index / DP_COLS);
  const col = index % DP_COLS;
  return {
    x: DP_ORIGIN_X + col * (DP_CELL + DP_GAP),
    y: DP_ORIGIN_Y + row * (DP_CELL + DP_GAP),
    delay: row * DP_ROW_SECONDS + col * DP_COL_SECONDS,
  };
});

/** Custom properties are the only way derived geometry reaches the keyframes. */
type Vars = React.CSSProperties & Record<`--${string}`, string | number>;

export function PatternLoop({ className }: { className?: string }) {
  /** Scene groups are offset by whole scenes so each starts at phase zero. */
  const sceneDelay = (index: number) => index * SCENE_SECONDS;

  return (
    <div
      className={cx('relative', className)}
      // Every keyframe in the stylesheet is a fraction of this, so the scene
      // length below is the single source of truth for the whole loop.
      style={{ '--loop': `${SCENE_SECONDS * SCENE_COUNT}s` } as Vars}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label="Eight algorithm patterns animating in sequence: a sliding window sweeping an array, two converging pointers closing from both ends, a breadth-first search lighting up one level of nodes at a time from a centre node, a binary search discarding half its range twice until a single cell is left, a monotonic stack popping its shorter bars to leave a descending staircase, a value sifting down a heap one level at a time, a union-find bridging two components so one adopts the other's colour, and a dynamic-programming table filling row by row."
        className="w-full"
      >
        <defs>
          <linearGradient id="windowFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* 1 — Sliding window: a contiguous range sweeping the array. */}
        <Scene index={0}>
          <ArrayCells />
          <g
            className="animate-slide"
            style={
              { animationDelay: `${sceneDelay(0)}s`, '--slide-x': `${WINDOW_SWEEP}px` } as Vars
            }
          >
            <Highlight {...WINDOW} />
          </g>
        </Scene>

        {/* 2 — Two pointers: closing on the answer from both ends. */}
        <Scene index={1}>
          <ArrayCells />
          <g
            className="animate-slide"
            style={
              { animationDelay: `${sceneDelay(1)}s`, '--slide-x': `${CONVERGE_LEFT}px` } as Vars
            }
          >
            <Pointer x={cellCentre(0)} />
          </g>
          <g
            className="animate-slide"
            style={
              { animationDelay: `${sceneDelay(1)}s`, '--slide-x': `${CONVERGE_RIGHT}px` } as Vars
            }
          >
            <Pointer x={cellCentre(CELL_COUNT - 1)} />
          </g>
        </Scene>

        {/* 3 — Breadth-first search: a frontier expanding level by level. */}
        <Scene index={2}>
          <g stroke="var(--color-line-strong)" strokeWidth="1.5">
            {BFS_EDGES.map(([a, b]) => (
              <line
                key={`bfs-${a}-${b}`}
                x1={BFS_NODES[a].cx}
                y1={BFS_NODES[a].cy}
                x2={BFS_NODES[b].cx}
                y2={BFS_NODES[b].cy}
              />
            ))}
          </g>

          {/* One ring per level, each sized to the level it announces. */}
          {Array.from({ length: BFS_LEVELS }, (_, level) => (
            <circle
              key={`ring-${level}`}
              cx={BFS_NODES[0].cx}
              cy={BFS_NODES[0].cy}
              r={BFS_RING_R}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              className="animate-ripple"
              style={
                {
                  animationDelay: `${sceneDelay(2) + level * BFS_LEVEL_SECONDS}s`,
                  transformOrigin: `${BFS_NODES[0].cx}px ${BFS_NODES[0].cy}px`,
                  '--ripple-reach': bfsRingReach(level),
                } as Vars
              }
            />
          ))}

          {BFS_NODES.map((node, index) => (
            <circle
              key={`bfs-node-${index}`}
              cx={node.cx}
              cy={node.cy}
              r={index === 0 ? BFS_ROOT_R : BFS_NODE_R}
              fill="var(--color-surface-raised)"
              stroke="var(--color-line-strong)"
              strokeWidth="1.5"
            />
          ))}

          {/* Each level lights as its ring arrives, which is what "visited" means. */}
          {BFS_NODES.map((node, index) => (
            <circle
              key={`bfs-visit-${index}`}
              cx={node.cx}
              cy={node.cy}
              r={index === 0 ? BFS_ROOT_R : BFS_NODE_R}
              fill="var(--color-accent)"
              className="animate-reveal"
              style={{
                animationDelay: `${sceneDelay(2) + BFS_LEVEL.get(index)! * BFS_LEVEL_SECONDS}s`,
                transformBox: 'fill-box',
                transformOrigin: 'center',
              }}
            />
          ))}
        </Scene>

        {/* 4 — Binary search on answer: the range halving until one cell is left. */}
        <Scene index={3}>
          <ArrayCells />
          {BINARY_RANGES.map((range, step) => {
            const last = step === BINARY_RANGES.length - 1;
            return (
              <g
                key={`range-${range.x}-${range.width}`}
                className={last ? 'animate-range-final' : 'animate-range'}
                style={{
                  // Each range appears where the last one ended, so the steps
                  // read as two discrete decisions rather than one long shrink.
                  animationDelay: `${sceneDelay(3) + step * 0.7}s`,
                  transformBox: 'fill-box',
                  // Every range keeps the same right edge, so collapsing toward
                  // it is what the discarded half looks like.
                  transformOrigin: 'right',
                }}
              >
                <Highlight {...range} />
              </g>
            );
          })}
        </Scene>

        {/* 5 — Monotonic stack: shorter bars popping as a taller one arrives. */}
        <Scene index={4}>
          {BAR_HEIGHTS.map((height, index) => {
            const popped = barPopped(index);
            // Left to right in the order the taller bars actually reach them.
            const popAt = sceneDelay(4) + BAR_POP_ORDER.indexOf(index) * BAR_POP_SECONDS;
            return (
              <rect
                key={`bar-${index}`}
                x={CELLS[index]}
                y={BAR_BASELINE - height}
                width={CELL_W}
                height={height}
                rx={BAR_RX}
                fill={popped ? 'var(--color-surface-raised)' : 'var(--color-accent)'}
                fillOpacity={popped ? 1 : 0.75}
                stroke={popped ? 'var(--color-line-strong)' : 'none'}
                strokeWidth="1.5"
                className={popped ? 'animate-pop-bar' : undefined}
                style={
                  popped
                    ? {
                        animationDelay: `${popAt}s`,
                        transformBox: 'fill-box',
                        transformOrigin: 'bottom',
                      }
                    : undefined
                }
              />
            );
          })}
        </Scene>

        {/* 6 — Heap: one value sifting down, a level at a time. */}
        <Scene index={5}>
          <g stroke="var(--color-line-strong)" strokeWidth="1.5">
            {HEAP.slice(1).map((node, offset) => {
              const parent = HEAP[Math.floor(offset / 2)];
              return (
                <line
                  key={`heap-edge-${node.cx}-${node.cy}`}
                  x1={parent.cx}
                  y1={parent.cy}
                  x2={node.cx}
                  y2={node.cy}
                />
              );
            })}
          </g>

          {HEAP.map((node) => (
            <circle
              key={`heap-${node.cx}-${node.cy}`}
              cx={node.cx}
              cy={node.cy}
              r={HEAP_NODE_R}
              fill="var(--color-surface-raised)"
              stroke="var(--color-line-strong)"
              strokeWidth="1.5"
            />
          ))}

          {/*
           * A single circle travelling the path, rather than one per stop
           * fading in and out — a value that moves is the thing sift-down
           * actually does, and it leaves the seat it came from visibly empty.
           */}
          <circle
            cx={HEAP[0].cx}
            cy={HEAP[0].cy}
            r={HEAP_NODE_R}
            fill="var(--color-accent)"
            className="animate-sift"
            style={
              {
                animationDelay: `${sceneDelay(5)}s`,
                transformBox: 'fill-box',
                transformOrigin: 'center',
                '--sift-x1': `${SIFT_HOPS[0].dx}px`,
                '--sift-y1': `${SIFT_HOPS[0].dy}px`,
                '--sift-x2': `${SIFT_HOPS[1].dx}px`,
                '--sift-y2': `${SIFT_HOPS[1].dy}px`,
              } as Vars
            }
          />
        </Scene>

        {/* 7 — Union-Find: two components discovering they are one. */}
        <Scene index={6}>
          <g stroke="var(--color-line-strong)" strokeWidth="1.5">
            {DSU_EDGES.map(([a, b]) => (
              <line
                key={`dsu-${a}-${b}`}
                x1={DSU[a].cx}
                y1={DSU[a].cy}
                x2={DSU[b].cx}
                y2={DSU[b].cy}
              />
            ))}
          </g>

          {/* The union itself: a bridge drawn from the surviving root outward. */}
          <rect
            x={DSU_LINK.x}
            y={DSU_LINK.y}
            width={DSU_LINK.width}
            height={DSU_BRIDGE_W}
            rx={DSU_BRIDGE_W / 2}
            fill="var(--color-accent)"
            className="animate-link"
            style={{
              animationDelay: `${sceneDelay(6)}s`,
              transformBox: 'fill-box',
              transformOrigin: 'left',
            }}
          />

          {DSU.map((node, index) => (
            <circle
              key={`dsu-node-${index}`}
              cx={node.cx}
              cy={node.cy}
              r={DSU_NODE_R}
              fill="var(--color-surface-raised)"
              stroke="var(--color-line-strong)"
              strokeWidth="1.5"
            />
          ))}

          {/* The left component is already the root's colour. */}
          {DSU_ROOT_SIDE.map((index) => (
            <circle
              key={`dsu-root-${index}`}
              cx={DSU[index].cx}
              cy={DSU[index].cy}
              r={DSU_NODE_R}
              fill="var(--color-accent)"
            />
          ))}

          {/* The right component adopts it, spreading out from where the bridge lands. */}
          {DSU_ABSORBED.map((index) => (
            <circle
              key={`dsu-merged-${index}`}
              cx={DSU[index].cx}
              cy={DSU[index].cy}
              r={DSU_NODE_R}
              fill="var(--color-accent)"
              className="animate-reveal"
              style={{
                animationDelay: `${sceneDelay(6) + DSU_MERGE_START + dsuMergeDelay(index)}s`,
                transformBox: 'fill-box',
                transformOrigin: 'center',
              }}
            />
          ))}
        </Scene>

        {/* 8 — Dynamic programming: a table filling from a base case outward. */}
        <Scene index={7}>
          {DP_CELLS.map(({ x, y }) => (
            <rect
              key={`dp-slot-${x}-${y}`}
              x={x}
              y={y}
              width={DP_CELL}
              height={DP_CELL}
              rx="4"
              fill="var(--color-surface-raised)"
              stroke="var(--color-line)"
              strokeWidth="1"
            />
          ))}

          {DP_CELLS.map(({ x, y, delay }) => (
            <rect
              key={`dp-fill-${x}-${y}`}
              x={x}
              y={y}
              width={DP_CELL}
              height={DP_CELL}
              rx="4"
              fill="var(--color-accent)"
              fillOpacity="0.8"
              className="animate-reveal"
              style={{
                // Row-major, so it reads as a recurrence sweeping the table.
                animationDelay: `${sceneDelay(7) + delay}s`,
                transformBox: 'fill-box',
                transformOrigin: 'center',
              }}
            />
          ))}
        </Scene>
      </svg>
    </div>
  );
}

function Scene({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <g
      data-scene={index}
      className="animate-scene"
      style={{ animationDelay: `${index * SCENE_SECONDS}s` }}
    >
      {children}
    </g>
  );
}

function ArrayCells() {
  return (
    <g>
      {CELLS.map((x) => (
        <rect
          key={x}
          x={x}
          y={CELL_Y}
          width={CELL_W}
          height={CELL_H}
          rx={CELL_RX}
          fill="var(--color-surface-raised)"
          stroke="var(--color-line)"
          strokeWidth="1"
        />
      ))}
    </g>
  );
}

/** The box the window and search scenes draw around a run of cells. */
function Highlight({ x, y, width, height, rx }: ReturnType<typeof highlight>) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={rx}
      fill="url(#windowFill)"
      stroke="var(--color-accent)"
      strokeWidth="1.5"
    />
  );
}

/** A marker below the array, apex up, pointing at the cell it sits under. */
function Pointer({ x }: { x: number }) {
  const apex = CELL_Y + CELL_H + HL_PAD;
  return (
    <g>
      <path d={`M${x} ${apex} l7 12 h-14 z`} fill="var(--color-accent)" />
      <circle cx={x} cy={apex + 21} r="4" fill="var(--color-accent)" />
    </g>
  );
}
