import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tracks which registered section crosses a horizontal line `lineY` pixels from the top of the
 * viewport. Starts at 0 (the first section).
 */
export function useActiveSection(lineY: number, viewportHeight: number) {
  const [activeIndex, setActiveIndex] = useState(0);
  const elements = useRef(new Map<number, HTMLElement>());
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const top = Math.max(0, Math.round(lineY));
    const bottom = Math.max(0, Math.round(viewportHeight - lineY - 2));
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveIndex(Number((entry.target as HTMLElement).dataset.sectionIndex));
        });
      },
      { rootMargin: `-${top}px 0px -${bottom}px 0px` },
    );
    elements.current.forEach((el) => observer.current?.observe(el));
    return () => observer.current?.disconnect();
  }, [lineY, viewportHeight]);

  const register = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      const previous = elements.current.get(index);
      if (previous && previous !== el) observer.current?.unobserve(previous);
      if (el) {
        el.dataset.sectionIndex = String(index);
        elements.current.set(index, el);
        observer.current?.observe(el);
      } else {
        elements.current.delete(index);
      }
    },
    [],
  );

  const getElement = useCallback((index: number) => elements.current.get(index) ?? null, []);

  return { activeIndex, register, getElement };
}
