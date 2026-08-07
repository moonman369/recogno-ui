import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Brand } from '../components/Brand';
import { Card } from '../components/ui';
import { cx } from '../lib/format';

export function AuthFormShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      {/* Same ambient light as the landing page, so sign-in feels continuous with it. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-drift absolute -top-32 left-1/2 size-[38rem] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <Link to="/" className="relative mb-6 inline-flex w-fit" aria-label="Recogno home">
        <Brand />
      </Link>

      <Card glass className="animate-rise relative">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-ink-faint">{subtitle}</p> : null}
        <div className="mt-6 space-y-4">{children}</div>
      </Card>

      {footer ? (
        <div className="relative mt-4 text-center text-sm text-ink-faint">{footer}</div>
      ) : null}

      <Link
        to="/"
        className="relative mt-6 text-center text-xs text-ink-faint transition-colors hover:text-ink"
      >
        ← What is Recogno?
      </Link>
    </div>
  );
}

export function FormError({ children, tone = 'negative' }: { children: ReactNode; tone?: 'negative' | 'caution' }) {
  return (
    <p
      role="alert"
      className={cx(
        'rounded-lg border px-3 py-2 text-sm',
        tone === 'caution'
          ? 'border-caution/40 bg-caution/10 text-caution'
          : 'border-negative/40 bg-negative/10 text-negative',
      )}
    >
      {children}
    </p>
  );
}

export function FieldError({ children }: { children: ReactNode }) {
  return <span className="mt-1.5 block text-xs text-negative">{children}</span>;
}

export function GoogleButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-surface-raised px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink-faint disabled:cursor-not-allowed disabled:opacity-45"
    >
      <svg viewBox="0 0 18 18" aria-hidden className="size-4">
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
        />
        <path
          fill="#FBBC05"
          d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
        />
      </svg>
      Continue with Google
    </button>
  );
}

export function Divider({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-line" />
      <span className="text-xs uppercase tracking-widest text-ink-faint">{children}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
