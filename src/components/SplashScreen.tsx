import { BrandMark } from './Brand';

/**
 * Shown while a stored refresh token is being exchanged for a confirmed session.
 *
 * Without it the header renders signed-out first and then snaps to signed-in a
 * moment later — a returning user sees "Sign in" flash before their own name.
 * This only appears when there is actually a token to check; a first-time
 * visitor is already known to be signed out and goes straight to the page.
 */
export function SplashScreen({ label = 'Checking your session…' }: { label?: string }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-6">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-drift absolute -top-32 left-1/2 size-[38rem] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <div className="relative flex flex-col items-center">
        <span className="animate-shimmer text-accent">
          <BrandMark className="size-9" />
        </span>
        <p className="mt-5 text-sm font-semibold tracking-tight text-ink">Recogno</p>
        <p className="mt-1 text-xs text-ink-faint" role="status" aria-live="polite">
          {label}
        </p>
      </div>
    </div>
  );
}
