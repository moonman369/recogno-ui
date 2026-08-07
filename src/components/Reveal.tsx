import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import { cx } from '../lib/format';

/**
 * Can this environment animate a reveal at all?
 *
 * Decided at first render rather than in an effect, so an element that will
 * animate is hidden on its very first paint — checking later would flash the
 * content in, out, and back. When the answer is no (no IntersectionObserver,
 * reduced motion, server render) the content simply renders visible and static,
 * so a failure here can never leave the page blank.
 */
function canReveal(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof IntersectionObserver === 'undefined') return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  className,
}: {
  children: ReactNode;
  as?: ElementType;
  /** Milliseconds, for staggering siblings. */
  delay?: number;
  className?: string;
}) {
  const [animated] = useState(canReveal);
  const [shown, setShown] = useState(!animated);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!animated || shown) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setShown(true);
          // Reveal once. Re-animating on every scroll past is noise.
          observer.disconnect();
        }
      },
      // Fire a little before the element reaches the fold, so it has settled
      // by the time it is actually being read.
      { rootMargin: '0px 0px -12% 0px', threshold: 0.1 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [animated, shown]);

  return (
    <Tag
      ref={ref}
      className={cx(animated && (shown ? 'reveal-shown' : 'reveal-hidden'), className)}
      style={shown && delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
