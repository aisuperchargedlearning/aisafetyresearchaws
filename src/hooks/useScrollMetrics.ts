import { useEffect, useState, type RefObject } from 'react';
import { useMotionValue, type MotionValue } from 'framer-motion';

export interface ScrollMetrics {
  scrollable: boolean;
  atStart: boolean;
  atEnd: boolean;
  /** True once the viewer has touched, dragged or wheeled the scroll area themselves. */
  interacted: boolean;
  thumbLeft: MotionValue<string>;
  thumbWidth: MotionValue<string>;
}

const EDGE_TOLERANCE = 2;

/** Live horizontal scroll position of `scrollerRef`, re-measured on scroll and whenever `contentRef` resizes. */
export function useScrollMetrics(
  scrollerRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): ScrollMetrics {
  const [edges, setEdges] = useState({ scrollable: false, atStart: true, atEnd: true });
  const [interacted, setInteracted] = useState(false);
  const thumbLeft = useMotionValue('0%');
  const thumbWidth = useMotionValue('100%');

  useEffect(() => {
    const scroller = scrollerRef.current;
    const content = contentRef.current;
    if (!enabled || !scroller || !content) return;

    const measure = () => {
      const { scrollLeft, scrollWidth, clientWidth } = scroller;
      if (scrollWidth <= 0) return;
      thumbWidth.set(`${Math.min(100, (clientWidth / scrollWidth) * 100)}%`);
      thumbLeft.set(`${(scrollLeft / scrollWidth) * 100}%`);
      const next = {
        scrollable: scrollWidth > clientWidth + EDGE_TOLERANCE,
        atStart: scrollLeft <= EDGE_TOLERANCE,
        atEnd: scrollLeft + clientWidth >= scrollWidth - EDGE_TOLERANCE,
      };
      setEdges((prev) =>
        prev.scrollable === next.scrollable && prev.atStart === next.atStart && prev.atEnd === next.atEnd ? prev : next,
      );
    };
    const markInteracted = () => setInteracted(true);

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(content);
    resizeObserver.observe(scroller);
    scroller.addEventListener('scroll', measure, { passive: true });
    scroller.addEventListener('touchstart', markInteracted, { passive: true });
    scroller.addEventListener('pointerdown', markInteracted);
    scroller.addEventListener('wheel', markInteracted, { passive: true });

    return () => {
      resizeObserver.disconnect();
      scroller.removeEventListener('scroll', measure);
      scroller.removeEventListener('touchstart', markInteracted);
      scroller.removeEventListener('pointerdown', markInteracted);
      scroller.removeEventListener('wheel', markInteracted);
    };
  }, [enabled, scrollerRef, contentRef, thumbLeft, thumbWidth]);

  return { ...edges, interacted, thumbLeft, thumbWidth };
}
