import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ApiError } from '../api/client';
import { cx } from '../lib/format';

/* -- button ------------------------------------------------------------- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
};

const VARIANTS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-accent text-canvas shadow-raised hover:bg-accent-strong hover:shadow-float hover:-translate-y-px',
  secondary:
    'bg-surface-raised text-ink border border-line hover:border-line-strong hover:-translate-y-px',
  ghost: 'text-ink-muted hover:text-ink hover:bg-surface-raised',
  danger: 'bg-negative/15 text-negative border border-negative/40 hover:bg-negative/25',
};

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        // Lifts on hover, presses on click. Transform and shadow only — both
        // composited, so neither costs a layout pass.
        'transition-all duration-200 ease-[var(--ease-quint)] active:translate-y-0 active:scale-[0.98]',
        'disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0',
        size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}

/* -- surfaces ----------------------------------------------------------- */

export function Card({
  className,
  children,
  /**
   * Frosted rather than opaque. For surfaces that float above the page — menus,
   * hero panels, the sign-in card. Content-bearing cards stay opaque, because
   * translucency over a scrolling background costs legibility.
   */
  glass = false,
}: {
  className?: string;
  children: ReactNode;
  glass?: boolean;
}) {
  return (
    <div className={cx('rounded-xl p-5', glass ? 'glass' : 'border border-line bg-surface', className)}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-faint">{children}</h2>
      {hint ? <span className="text-xs text-ink-faint">{hint}</span> : null}
    </div>
  );
}

/* -- badge -------------------------------------------------------------- */

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'positive' | 'caution' | 'negative';
  className?: string;
}) {
  const tones = {
    neutral: 'border-line text-ink-muted',
    accent: 'border-accent/40 text-accent',
    positive: 'border-positive/40 text-positive',
    caution: 'border-caution/40 text-caution',
    negative: 'border-negative/40 text-negative',
  } as const;

  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* -- states ------------------------------------------------------------- */

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cx(
        'inline-block size-4 animate-spin rounded-full border-2 border-line border-t-accent',
        className,
      )}
    />
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-10 text-sm text-ink-muted">
      <Spinner />
      {label}
    </div>
  );
}

/**
 * A placeholder shaped like the content that is coming.
 *
 * Preferred over a spinner wherever the layout is known ahead of time: it holds
 * the space, so arriving data does not shove the page around.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx('animate-shimmer rounded-md bg-surface-raised', className)} />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cx('space-y-2', className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className={cx('h-3', index === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
}

/* -- keyboard ----------------------------------------------------------- */

/** A key cap. Used to advertise shortcuts inline rather than hiding them in a help modal. */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-5 items-center justify-center rounded border border-line bg-surface-raised px-1.5 py-0.5 font-sans text-[10px] font-medium leading-none text-ink-faint">
      {children}
    </kbd>
  );
}

export function ShortcutHint({ keys, children }: { keys: ReactNode[]; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-faint">
      {keys.map((key, index) => (
        <Kbd key={index}>{key}</Kbd>
      ))}
      <span className="ml-0.5">{children}</span>
    </span>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : 'Something went wrong.';

  return (
    <Card className="border-negative/40">
      <p className="text-sm text-negative">{message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </Card>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line px-6 py-16 text-center">
      <p className="text-base font-medium text-ink">{title}</p>
      {body ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-faint">{body}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

/* -- form --------------------------------------------------------------- */

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-ink-faint">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  'w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none';

export const textareaClass = cx(inputClass, 'resize-y leading-relaxed scrollbar-slim');
