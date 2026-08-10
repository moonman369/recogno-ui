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
 * describes all six, so nothing is lost to a screen reader.
 *
 * Implementation: pure SVG + CSS keyframes — no JS timer, no React re-renders,
 * one composited layer, nothing per frame. Every child animation runs on a 3s
 * period, which divides 24 exactly, so a scene is always at phase zero when it
 * appears. Staggered children carry `sceneDelay + stagger`, and every looping
 * keyframe ends where it began so a stagger cannot leave one mid-animation on
 * the second time round.
 * Under reduced motion the stylesheet freezes it on the first scene.
 */

const SCENE_SECONDS = 3;

/** The array the first four scenes operate on. */
const CELL_X = 24;
const CELL_W = 30;
const CELL_PITCH = 38;
const CELL_COUNT = 7;
const CELLS = Array.from({ length: CELL_COUNT }, (_, index) => CELL_X + index * CELL_PITCH);

/** Breathing room between a highlight and the cells it wraps. */
const HL_PAD = 4;

/** A highlight spanning `span` cells starting at `from`, derived rather than eyeballed. */
function highlight(from: number, span: number) {
  const left = CELLS[from] - HL_PAD;
  const right = CELLS[from + span - 1] + CELL_W + HL_PAD;
  return { x: left, width: right - left };
}

const cellCentre = (index: number) => CELLS[index] + CELL_W / 2;

/** Covers cells 0-2, and sweeps to cover 4-6. */
const WINDOW = highlight(0, 3);
/** The full range, for the binary-search scene. */
const FULL_RANGE = highlight(0, CELL_COUNT);

/** Monotonic-stack bar heights, chosen so the collapse reads as a pop sequence. */
const BARS = [
  { x: 24, height: 30 },
  { x: 62, height: 54 },
  { x: 100, height: 22 },
  { x: 138, height: 44 },
  { x: 176, height: 18 },
  { x: 214, height: 62 },
  { x: 252, height: 36 },
];

/** Heap nodes, root first, then each level left to right. */
const HEAP = [
  { cx: 160, cy: 58 },
  { cx: 108, cy: 100 },
  { cx: 212, cy: 100 },
  { cx: 82, cy: 142 },
  { cx: 134, cy: 142 },
  { cx: 186, cy: 142 },
  { cx: 238, cy: 142 },
];

const BAR_BASELINE = 150;

/**
 * Union-Find: two three-node components. Indices 0-2 are the surviving root's
 * side, 3-5 the one that gets absorbed; 1 and 4 are the pair the bridge joins.
 */
const DSU = [
  { cx: 74, cy: 62 },
  { cx: 116, cy: 90 },
  { cx: 78, cy: 120 },
  { cx: 244, cy: 62 },
  { cx: 204, cy: 90 },
  { cx: 240, cy: 120 },
];

const DSU_EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [3, 4],
  [4, 5],
];

/** Dynamic programming: a 6x3 table, centred. */
const DP_CELL = 26;
const DP_GAP = 6;
const DP_COLS = 6;
const DP_ROWS = 3;
const DP_ORIGIN_X = (320 - (DP_COLS * (DP_CELL + DP_GAP) - DP_GAP)) / 2;
const DP_ORIGIN_Y = 48;

const DP_CELLS = Array.from({ length: DP_ROWS * DP_COLS }, (_, index) => ({
  x: DP_ORIGIN_X + (index % DP_COLS) * (DP_CELL + DP_GAP),
  y: DP_ORIGIN_Y + Math.floor(index / DP_COLS) * (DP_CELL + DP_GAP),
}));

export function PatternLoop({ className }: { className?: string }) {
  /** Scene groups are offset by whole scenes so each starts at phase zero. */
  const sceneDelay = (index: number) => index * SCENE_SECONDS;

  return (
    <div className={cx('relative', className)}>
      <svg
        viewBox="0 0 320 180"
        role="img"
        aria-label="Eight algorithm patterns animating in sequence: a sliding window, two converging pointers, a breadth-first search expanding from a centre node, a binary search halving its range, a monotonic stack popping shorter bars, a value sifting down a heap, a union-find joining two components, and a dynamic-programming table filling cell by cell."
        className="w-full"
      >
        <defs>
          <linearGradient id="windowFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* 1 — Sliding window: a contiguous range sweeping the array. */}
        <Scene index={0} delay={sceneDelay(0)}>
          <ArrayCells />
          <g className="animate-sweep" style={{ animationDelay: `${sceneDelay(0)}s` }}>
            <rect
              x={WINDOW.x}
              y="62"
              width={WINDOW.width}
              height="46"
              rx="9"
              fill="url(#windowFill)"
              stroke="var(--color-accent)"
              strokeWidth="1.5"
            />
          </g>
        </Scene>

        {/* 2 — Two pointers: closing on the answer from both ends. */}
        <Scene index={1} delay={sceneDelay(1)}>
          <ArrayCells />
          <g className="animate-converge-left" style={{ animationDelay: `${sceneDelay(1)}s` }}>
            <Pointer x={cellCentre(0)} />
          </g>
          <g className="animate-converge-right" style={{ animationDelay: `${sceneDelay(1)}s` }}>
            <Pointer x={cellCentre(CELL_COUNT - 1)} />
          </g>
        </Scene>

        {/* 3 — Breadth-first search: a frontier expanding level by level. */}
        <Scene index={2} delay={sceneDelay(2)}>
          <g stroke="var(--color-line-strong)" strokeWidth="1.5">
            <line x1="160" y1="88" x2="116" y2="88" />
            <line x1="160" y1="88" x2="204" y2="88" />
            <line x1="160" y1="88" x2="160" y2="52" />
            <line x1="160" y1="88" x2="160" y2="124" />
            <line x1="116" y1="88" x2="88" y2="52" />
            <line x1="204" y1="88" x2="232" y2="124" />
          </g>

          {[0, 1, 2].map((step) => (
            <circle
              key={step}
              cx="160"
              cy="88"
              r="20"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="1.5"
              className="animate-ripple"
              style={{
                animationDelay: `${sceneDelay(2) + step}s`,
                transformOrigin: '160px 88px',
              }}
            />
          ))}

          {[
            [160, 88],
            [116, 88],
            [204, 88],
            [160, 52],
            [160, 124],
            [88, 52],
            [232, 124],
          ].map(([x, y], index) => (
            <circle
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              r={index === 0 ? 7 : 5.5}
              fill={index === 0 ? 'var(--color-accent)' : 'var(--color-surface-raised)'}
              stroke={index === 0 ? 'none' : 'var(--color-line-strong)'}
              strokeWidth="1.5"
            />
          ))}
        </Scene>

        {/* 4 — Binary search on answer: the range halving, twice. */}
        <Scene index={3} delay={sceneDelay(3)}>
          <ArrayCells />
          <g
            className="animate-halve"
            style={{
              animationDelay: `${sceneDelay(3)}s`,
              transformBox: 'fill-box',
              transformOrigin: 'left',
            }}
          >
            <rect
              x={FULL_RANGE.x}
              y="62"
              width={FULL_RANGE.width}
              height="46"
              rx="9"
              fill="url(#windowFill)"
              stroke="var(--color-accent)"
              strokeWidth="1.5"
            />
          </g>
        </Scene>

        {/* 5 — Monotonic stack: shorter bars popping as a taller one arrives. */}
        <Scene index={4} delay={sceneDelay(4)}>
          {BARS.map((bar, index) => {
            // Bars that a later, taller bar would pop. The survivors stay lit.
            const popped = [0, 2, 4].includes(index);
            return (
              <rect
                key={bar.x}
                x={bar.x}
                y={BAR_BASELINE - bar.height}
                width={30}
                height={bar.height}
                rx={5}
                fill={popped ? 'var(--color-surface-raised)' : 'var(--color-accent)'}
                fillOpacity={popped ? 1 : 0.75}
                stroke={popped ? 'var(--color-line-strong)' : 'none'}
                strokeWidth="1.5"
                className={popped ? 'animate-pop-bar' : undefined}
                style={
                  popped
                    ? {
                        animationDelay: `${sceneDelay(4) + index * 0.14}s`,
                        transformBox: 'fill-box',
                        transformOrigin: 'bottom',
                      }
                    : undefined
                }
              />
            );
          })}
        </Scene>

        {/* 6 — Heap: a value sifting down, one level at a time. */}
        <Scene index={5} delay={sceneDelay(5)}>
          <g stroke="var(--color-line-strong)" strokeWidth="1.5">
            <line x1="160" y1="58" x2="108" y2="100" />
            <line x1="160" y1="58" x2="212" y2="100" />
            <line x1="108" y1="100" x2="82" y2="142" />
            <line x1="108" y1="100" x2="134" y2="142" />
            <line x1="212" y1="100" x2="186" y2="142" />
            <line x1="212" y1="100" x2="238" y2="142" />
          </g>

          {HEAP.map((node) => (
            <circle
              key={`${node.cx}-${node.cy}`}
              cx={node.cx}
              cy={node.cy}
              r="9"
              fill="var(--color-surface-raised)"
              stroke="var(--color-line-strong)"
              strokeWidth="1.5"
            />
          ))}

          {/* The sift path: root → right child → its right child. */}
          {[HEAP[0], HEAP[2], HEAP[6]].map((node, step) => (
            <circle
              key={`sift-${node.cx}`}
              cx={node.cx}
              cy={node.cy}
              r="9"
              fill="var(--color-accent)"
              className="animate-sift"
              style={{
                animationDelay: `${sceneDelay(5) + step * 0.5}s`,
                transformBox: 'fill-box',
                transformOrigin: 'center',
              }}
            />
          ))}
        </Scene>

        {/* 7 — Union-Find: two components discovering they are one. */}
        <Scene index={6} delay={sceneDelay(6)}>
          <g stroke="var(--color-line-strong)" strokeWidth="1.5">
            {DSU_EDGES.map(([a, b]) => (
              <line key={`${a}-${b}`} x1={DSU[a].cx} y1={DSU[a].cy} x2={DSU[b].cx} y2={DSU[b].cy} />
            ))}
          </g>

          {/* The union itself: a bridge drawn from the surviving root outward. */}
          <rect
            x={DSU[1].cx}
            y={DSU[1].cy - 1.5}
            width={DSU[4].cx - DSU[1].cx}
            height="3"
            rx="1.5"
            fill="var(--color-accent)"
            className="animate-link"
            style={{
              animationDelay: `${sceneDelay(6)}s`,
              transformBox: 'fill-box',
              transformOrigin: 'left',
            }}
          />

          {DSU.map((node) => (
            <circle
              key={`dsu-${node.cx}-${node.cy}`}
              cx={node.cx}
              cy={node.cy}
              r="8"
              fill="var(--color-surface-raised)"
              stroke="var(--color-line-strong)"
              strokeWidth="1.5"
            />
          ))}

          {/* The left component is already the root's colour. */}
          {DSU.slice(0, 3).map((node) => (
            <circle key={`root-${node.cx}`} cx={node.cx} cy={node.cy} r="8" fill="var(--color-accent)" />
          ))}

          {/* The right component adopts it once the bridge lands. */}
          {DSU.slice(3).map((node, step) => (
            <circle
              key={`merged-${node.cx}`}
              cx={node.cx}
              cy={node.cy}
              r="8"
              fill="var(--color-accent)"
              className="animate-merge"
              style={{
                animationDelay: `${sceneDelay(6) + step * 0.12}s`,
                transformBox: 'fill-box',
                transformOrigin: 'center',
              }}
            />
          ))}
        </Scene>

        {/* 8 — Dynamic programming: a table filling from a base case outward. */}
        <Scene index={7} delay={sceneDelay(7)}>
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

          {DP_CELLS.map(({ x, y }, index) => (
            <rect
              key={`dp-fill-${x}-${y}`}
              x={x}
              y={y}
              width={DP_CELL}
              height={DP_CELL}
              rx="4"
              fill="var(--color-accent)"
              fillOpacity="0.8"
              className="animate-fill"
              style={{
                // Row-major, so it reads as a recurrence sweeping the table.
                animationDelay: `${sceneDelay(7) + index * 0.07}s`,
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

function Scene({
  index,
  delay,
  children,
}: {
  index: number;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <g data-scene={index} className="animate-scene" style={{ animationDelay: `${delay}s` }}>
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
          y={68}
          width={30}
          height={34}
          rx={7}
          fill="var(--color-surface-raised)"
          stroke="var(--color-line)"
          strokeWidth="1"
        />
      ))}
    </g>
  );
}

/** A marker below the array, apex up, pointing at the cell it sits under. */
function Pointer({ x }: { x: number }) {
  return (
    <g>
      <path d={`M${x} 110 l7 12 h-14 z`} fill="var(--color-accent)" />
      <circle cx={x} cy={131} r="4" fill="var(--color-accent)" />
    </g>
  );
}
