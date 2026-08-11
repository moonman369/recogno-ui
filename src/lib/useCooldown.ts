import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A client-side send limit.
 *
 * The two "email me a link" endpoints have no server-side rate limiting yet, so
 * nothing but this stops an impatient person from firing off a dozen requests —
 * each of which invalidates the last link, so hammering the button actively
 * breaks the flow it is trying to complete.
 *
 * This is a courtesy, not a control: it lives in memory and a reload clears it.
 * Real limiting belongs on the server.
 */
export function useCooldown(seconds = 45) {
  const [remaining, setRemaining] = useState(0);
  const deadline = useRef(0);

  useEffect(() => {
    if (remaining <= 0) return;

    const id = setInterval(() => {
      // Read the clock rather than counting ticks, so a backgrounded tab does
      // not hold the button hostage longer than it should.
      setRemaining(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)));
    }, 500);

    return () => clearInterval(id);
  }, [remaining]);

  const start = useCallback(() => {
    deadline.current = Date.now() + seconds * 1000;
    setRemaining(seconds);
  }, [seconds]);

  return { remaining, active: remaining > 0, start };
}
