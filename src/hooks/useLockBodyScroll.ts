import { useEffect } from 'react';

// Locks background scrolling while a modal is open. Plain overflow:hidden on body doesn't
// reliably stop iOS Safari's elastic rubber-band overscroll, which can briefly reveal a sliver
// of unblurred page content at the top/bottom edges through a backdrop-blur overlay — pinning
// the body with position:fixed (and restoring scroll position after) avoids that.
export function useLockBodyScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const scrollY = window.scrollY;
    const { style } = document.body;
    const prev = {
      position: style.position,
      top: style.top,
      left: style.left,
      right: style.right,
      overflow: style.overflow
    };

    style.position = 'fixed';
    style.top = `-${scrollY}px`;
    style.left = '0';
    style.right = '0';
    style.overflow = 'hidden';

    return () => {
      style.position = prev.position;
      style.top = prev.top;
      style.left = prev.left;
      style.right = prev.right;
      style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}
