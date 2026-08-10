import { cx } from '../lib/format';

/**
 * The hero's focal visual: six real algorithm patterns tracing themselves, on
 * an 18-second loop of 3-second scenes.
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
 * period, which divides 18 exactly, so a scene is always at phase zero when it
 * appears. Staggered children carry `sceneDelay + stagger` for the same reason.
 * Under reduced motion the stylesheet freezes it on the first scene.
 */

const SCENE_SECONDS = 3;

/** 7 cells, evenly spaced — the array the first three scenes operate on. */
const CELLS = Array.from({ length: 7 }, (_, index) => 24 + index * 38);

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

export function PatternLoop({ className }: { className?: string }) {
  /** Scene groups are offset by whole scenes so each starts at phase zero. */
  const sceneDelay = (index: number) => index * SCENE_SECONDS;

  return (
    <div className={cx('relative', className)}>
      <svg
        viewBox="0 0 320 180"
        role="img"
        aria-label="Six algorithm patterns animating in sequence: a sliding window, two converging pointers, a breadth-first search expanding from a centre node, a binary search halving its range, a monotonic stack popping shorter bars, and a value sifting down a heap."
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
              x="20"
              y="62"
              width="106"
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
            <Pointer x={39} />
          </g>
          <g className="animate-converge-right" style={{ animationDelay: `${sceneDelay(1)}s` }}>
            <Pointer x={267} />
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
              x="20"
              y="62"
              width="266"
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

function Pointer({ x }: { x: number }) {
  return (
    <g>
      <path d={`M${x} 116 l6 10 h-12 z`} fill="var(--color-accent)" transform={`rotate(180 ${x} 121)`} />
      <circle cx={x} cy={134} r="4" fill="var(--color-accent)" />
    </g>
  );
}
