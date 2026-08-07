import { useEffect, useRef, useState } from 'react';

/**
 * Seconds since `key` last changed, ticking once a second while `running`.
 * Reads the clock rather than counting ticks so a backgrounded tab does not
 * under-report the time taken.
 */
export function useElapsedSeconds(key: string | number | undefined, running: boolean) {
  const startedAt = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    startedAt.current = Date.now();
    setElapsed(0);
  }, [key]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [running, key]);

  return elapsed;
}
