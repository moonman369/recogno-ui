import { useEffect, useState } from 'react';

export type Countdown = {
  /** 3, 2, 1 while running; null once finished. */
  value: number | null;
  done: boolean;
};

/**
 * A short "get ready" count before a timed task.
 *
 * Restarts whenever `key` changes, so every drawn problem gets its own. When
 * `enabled` is false it reports done immediately, which is what a re-render
 * after the answer is submitted needs.
 */
export function useCountdown(key: string | number | undefined, from = 3, enabled = true): Countdown {
  const [value, setValue] = useState<number | null>(enabled ? from : null);

  useEffect(() => {
    if (!enabled) {
      setValue(null);
      return;
    }

    setValue(from);

    const id = setInterval(() => {
      setValue((current) => {
        if (current === null) return null;
        // Below 1 the count is over; null is the signal to start the clock.
        return current <= 1 ? null : current - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [key, from, enabled]);

  return { value, done: value === null };
}
