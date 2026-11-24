import { useEffect, useState } from 'react';

// Mobile browsers resize the viewport as the address bar slides in and out. Ignoring those small
// height-only changes on touch devices keeps the pinned diagram from jumping mid-scroll.
const TOUCH_HEIGHT_TOLERANCE = 120;

function read() {
  return { width: document.documentElement.clientWidth, height: window.innerHeight };
}

/** Viewport size excluding the vertical scrollbar. */
export function useViewportSize() {
  const [size, setSize] = useState(read);

  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)');
    const update = () =>
      setSize((prev) => {
        const next = read();
        const heightOnly = next.width === prev.width;
        if (heightOnly && coarse.matches && Math.abs(next.height - prev.height) < TOUCH_HEIGHT_TOLERANCE) return prev;
        if (heightOnly && next.height === prev.height) return prev;
        return next;
      });
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return size;
}
