import { cx } from '../lib/format';

/**
 * The hero's focal visual: three algorithm patterns tracing themselves over the
 * same array, on a 12-second loop.
 *
 * This is the product argument in one image — the shapes here are literally
 * three of the thirteen patterns the drill grades, and recognising them on
 * sight is the whole skill. A generic abstract blob would say nothing.
 *
 * Implementation notes: pure SVG + CSS keyframes, no JS timer and no React
 * re-renders, so it costs one composited layer and nothing per frame. Every
 * child animation shares a period that divides 12s, so the scenes stay
 * phase-locked no matter how long the tab sits open. Under reduced motion the
 * stylesheet freezes it on the first scene rather than blanking it.
 */

/** 7 cells, evenly spaced — the array every scene operates on. */
const CELLS = Array.from({ length: 7 }, (_, index) => 24 + index * 38);

const SCENES = ['Sliding window', 'Two pointers', 'Breadth-first search'];

export function PatternLoop({ className }: { className?: string }) {
  return (
    <div className={cx('relative', className)}>
      <svg
        viewBox="0 0 320 210"
        role="img"
        aria-label="Three algorithm patterns animating over an array: a sliding window, two converging pointers, and a breadth-first search expanding from a centre node."
        className="w-full"
      >
        <defs>
          <linearGradient id="windowFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Scene 1 — a window sweeping a contiguous range. */}
        <g data-scene="0" className="animate-scene">
          <ArrayCells />
          <g className="animate-sweep">
            <rect
              x="20"
              y="72"
              width="106"
              height="46"
              rx="9"
              fill="url(#windowFill)"
              stroke="var(--color-accent)"
              strokeWidth="1.5"
            />
          </g>
        </g>

        {/* Scene 2 — two pointers closing on the answer from both ends. */}
        <g data-scene="1" className="animate-scene" style={{ animationDelay: '4s' }}>
          <ArrayCells />
          <g className="animate-converge-left">
            <Pointer x={39} />
          </g>
          <g className="animate-converge-right">
            <Pointer x={267} />
          </g>
        </g>

        {/* Scene 3 — a frontier expanding outward, level by level. */}
        <g data-scene="2" className="animate-scene" style={{ animationDelay: '8s' }}>
          <g stroke="var(--color-line-strong)" strokeWidth="1.5">
            <line x1="160" y1="98" x2="116" y2="98" />
            <line x1="160" y1="98" x2="204" y2="98" />
            <line x1="160" y1="98" x2="160" y2="58" />
            <line x1="160" y1="98" x2="160" y2="138" />
            <line x1="116" y1="98" x2="86" y2="58" />
            <line x1="204" y1="98" x2="234" y2="138" />
          </g>

          {[0, 1.1, 2.2].map((delay) => (
            <circle
              key={delay}
              cx="160"
              cy="98"
              r="22"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="1.5"
              className="animate-ripple"
              style={{ animationDelay: `${delay}s`, transformOrigin: '160px 98px' }}
            />
          ))}

          {[
            [160, 98],
            [116, 98],
            [204, 98],
            [160, 58],
            [160, 138],
            [86, 58],
            [234, 138],
          ].map(([cx1, cy], index) => (
            <circle
              key={`${cx1}-${cy}`}
              cx={cx1}
              cy={cy}
              r={index === 0 ? 7 : 5.5}
              fill={index === 0 ? 'var(--color-accent)' : 'var(--color-surface-raised)'}
              stroke={index === 0 ? 'none' : 'var(--color-line-strong)'}
              strokeWidth="1.5"
            />
          ))}
        </g>

        {/* Caption, cycling on the same clock as the scenes. */}
        {SCENES.map((label, index) => (
          <text
            key={label}
            x="160"
            y="182"
            textAnchor="middle"
            data-scene={index}
            className="animate-scene fill-ink-faint text-[11px] font-medium uppercase tracking-[0.2em]"
            style={{ animationDelay: `${index * 4}s` }}
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function ArrayCells() {
  return (
    <g>
      {CELLS.map((x) => (
        <rect
          key={x}
          x={x}
          y={78}
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
      <path
        d={`M${x} 126 l6 10 h-12 z`}
        fill="var(--color-accent)"
        transform={`rotate(180 ${x} 131)`}
      />
      <circle cx={x} cy={144} r="4" fill="var(--color-accent)" />
    </g>
  );
}
