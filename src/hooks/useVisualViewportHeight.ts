import { useEffect, useState } from 'react';

// Tracks the visible viewport height, which shrinks when the on-screen keyboard opens on mobile —
// unlike the layout viewport that `100dvh`/`fixed inset-0` are measured against. Modals anchored to
// the bottom with `items-end` need this so they land above the keyboard instead of behind it.
export function useVisualViewportHeight() {
  const [height, setHeight] = useState<number | undefined>(
    () => window.visualViewport?.height
  );

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => setHeight(vv.height);
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return height;
}
