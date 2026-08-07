import { useEffect } from 'react';

export type Hotkey = {
  /** Lowercase `event.key`, e.g. 'enter', '/', 'n'. */
  key: string;
  /** Require Cmd (mac) or Ctrl. */
  meta?: boolean;
  handler: (event: KeyboardEvent) => void;
  /**
   * Fire even while a text field has focus. Off by default so typing a slash
   * into the rationale does not jump focus to the pattern filter.
   */
  whileTyping?: boolean;
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

/**
 * Document-level shortcuts.
 *
 * Recogno is a speed drill — reaching for the mouse to pick a pattern is time
 * off the composite — so the whole loop is reachable from the keyboard.
 */
export function useHotkeys(hotkeys: Hotkey[], enabled = true): void {
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(event: KeyboardEvent) {
      const typing = isTypingTarget(event.target);

      for (const hotkey of hotkeys) {
        if (event.key.toLowerCase() !== hotkey.key) continue;
        if (Boolean(hotkey.meta) !== (event.metaKey || event.ctrlKey)) continue;
        if (typing && !hotkey.whileTyping) continue;

        event.preventDefault();
        hotkey.handler(event);
        return;
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [hotkeys, enabled]);
}
