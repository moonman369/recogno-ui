import { useEffect, useRef, useState } from 'react';

/**
 * Seconds since the clock started, ticking once a second while `running`.
 *
 * The clock starts when `running` first becomes true, not when `key` changes —
 * the drill counts down before it begins, and those three seconds are not the
 * learner's thinking time. Charging them would quietly cost speed score.
 *
 * Reads the wall clock rather than counting ticks, so a backgrounded tab does
 * not under-report the time taken.
 */
export function useElapsedSeconds(key: string | number | undefined, running: boolean) {
  const startedAt = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // A new problem resets the display even before its clock is allowed to run.
  useEffect(() => {
    startedAt.current = Date.now();
    setElapsed(0);
  }, [key]);

  useEffect(() => {
    if (!running) return;

    startedAt.current = Date.now();
    setElapsed(0);

    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);

    return () => clearInterval(id);
  }, [running, key]);

  return elapsed;
}
