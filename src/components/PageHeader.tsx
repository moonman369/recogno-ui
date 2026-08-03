import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/** Standard furniture at the top of every screen: where you are, and what you can do here. */
export function PageHeader({
  title,
  description,
  actions,
  back,
  meta,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** Breadcrumb up one level. */
  back?: { to: string; label: string };
  /** Small badges or counts sitting beside the title. */
  meta?: ReactNode;
}) {
  return (
    <header className="mb-8">
      {back ? (
        <Link
          to={back.to}
          className="mb-2 inline-flex items-center gap-1 text-xs text-ink-faint transition-colors hover:text-ink"
        >
          <span aria-hidden>←</span> {back.label}
        </Link>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
            {meta}
          </div>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-faint">{description}</p>
          ) : null}
        </div>

        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
