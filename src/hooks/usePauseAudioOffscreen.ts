import { useEffect, type RefObject } from 'react';

/** Pauses any narration inside `ref` once that element has scrolled completely out of view. */
export function usePauseAudioOffscreen(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) element.querySelectorAll('audio').forEach((audio) => audio.pause());
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
}
