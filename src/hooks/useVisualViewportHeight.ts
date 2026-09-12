import { useEffect, useRef, useState } from 'react';

// Tracks the visible viewport height, which shrinks when the on-screen keyboard opens on mobile —
// unlike the layout viewport that `100dvh`/`fixed inset-0` are measured against. Modals anchored to
// the bottom with `items-end` need this so they land above the keyboard instead of behind it.
export function useVisualViewportHeight() {
  const [height, setHeight] = useState<number | undefined>(
    () => window.visualViewport?.height
  );
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => setHeight(vv.height);
    update();

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);

    // iOS doesn't reliably fire visualViewport's own resize event right when the keyboard first
    // appears or when focus moves straight from one field to another with the keyboard already
    // up, which can leave this hook reporting a stale (too-tall) height. Re-measure a few times
    // as the keyboard animates in/out on every focus change, as a backstop.
    const clearTimers = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    const onFocusChange = () => {
      clearTimers();
      update();
      timers.current = [50, 150, 350].map(delay => setTimeout(update, delay));
    };
    document.addEventListener('focusin', onFocusChange);
    document.addEventListener('focusout', onFocusChange);

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      document.removeEventListener('focusin', onFocusChange);
      document.removeEventListener('focusout', onFocusChange);
      clearTimers();
    };
  }, []);

  return height;
}
