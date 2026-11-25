import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  StoryContext,
  type GoToOptions,
  type StoryChapter,
  type StoryNotice,
  type StoryStatus,
  type StoryValue,
} from './storyContext';

// Pauses between chapters so the diagram/board can settle before the next narration starts.
const GAP_SAME_SECTION_MS = 700;
const GAP_NEW_SECTION_MS = 1600;
// While the page scrolls itself to a section, the "scrolled away" rule must not fire.
const SCROLL_GRACE_MS = 3000;
// "Previous" restarts the chapter if it has played longer than this, otherwise goes back one.
const RESTART_AFTER_SECONDS = 3;

function scrollToSection(anchor: string, suppressUntil: { current: number }) {
  const target = document.getElementById(anchor);
  if (!target) return;
  suppressUntil.current = Date.now() + SCROLL_GRACE_MS;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
}

/**
 * Plays every chapter in order ("watch the whole story") through ONE audio element, so a phone that allowed the
 * first tap keeps allowing the following clips. Sections read the current chapter from context and follow it.
 */
export function StoryProvider({ chapters, children }: { chapters: StoryChapter[]; children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [status, setStatusState] = useState<StoryStatus>('idle');
  const [chapterIndex, setChapterIndex] = useState(-1);
  const [clock, setClock] = useState({ position: 0, duration: 0 });
  const [notice, setNotice] = useState<StoryNotice>(null);

  // Mirrors of state for use inside audio event handlers and timers.
  const statusRef = useRef<StoryStatus>('idle');
  const chapterRef = useRef(-1);
  const loadedRef = useRef(-1);
  const timerRef = useRef<number | undefined>(undefined);
  const suppressUntil = useRef(0);
  // True from loading a new clip until it is playing, so the browser's own pause on a source change isn't misread.
  const switchingRef = useRef(false);

  const setStatus = useCallback((value: StoryStatus) => {
    statusRef.current = value;
    setStatusState(value);
  }, []);

  const startPlayback = useCallback(
    (index: number, restart: boolean) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (loadedRef.current !== index) {
        switchingRef.current = true;
        audio.src = chapters[index].url;
        loadedRef.current = index;
      } else if (restart) {
        audio.currentTime = 0;
      }
      audio.play().catch((error: Error) => {
        if (error.name === 'AbortError' || statusRef.current !== 'playing') return;
        // Some phones refuse to start a clip without a tap: wait for the viewer to press play.
        setStatus('paused');
        setNotice(error.name === 'NotAllowedError' ? 'tap' : 'error');
      });
    },
    [chapters, setStatus],
  );

  const goTo = useCallback(
    (index: number, options: GoToOptions & { delay?: number } = {}) => {
      if (index < 0 || index >= chapters.length) return;
      window.clearTimeout(timerRef.current);
      const previous = statusRef.current !== 'idle' && chapterRef.current >= 0 ? chapters[chapterRef.current] : null;
      chapterRef.current = index;
      setChapterIndex(index);
      setClock({ position: 0, duration: 0 });
      setNotice(null);
      setStatus('playing');
      if (options.scroll !== false && previous?.anchor !== chapters[index].anchor) {
        scrollToSection(chapters[index].anchor, suppressUntil);
      }
      if (options.delay) {
        timerRef.current = window.setTimeout(() => startPlayback(index, true), options.delay);
      } else {
        startPlayback(index, true);
      }
    },
    [chapters, setStatus, startPlayback],
  );

  const start = useCallback(() => goTo(0), [goTo]);

  const stop = useCallback(() => {
    window.clearTimeout(timerRef.current);
    setStatus('idle');
    audioRef.current?.pause();
    loadedRef.current = -1;
    setNotice(null);
  }, [setStatus]);

  const pause = useCallback(
    (reason: StoryNotice) => {
      if (statusRef.current !== 'playing') return;
      window.clearTimeout(timerRef.current);
      setStatus('paused');
      audioRef.current?.pause();
      setNotice(reason);
    },
    [setStatus],
  );

  const toggle = useCallback(() => {
    if (statusRef.current === 'finished') {
      goTo(0);
    } else if (statusRef.current === 'playing') {
      pause(null);
    } else if (statusRef.current === 'paused') {
      const index = chapterRef.current;
      const wasAway = notice === 'away';
      setNotice(null);
      setStatus('playing');
      if (wasAway) scrollToSection(chapters[index].anchor, suppressUntil);
      startPlayback(index, loadedRef.current !== index || audioRef.current?.ended === true);
    }
  }, [chapters, goTo, notice, pause, setStatus, startPlayback]);

  const next = useCallback(() => goTo(chapterRef.current + 1), [goTo]);
  const previous = useCallback(() => {
    const audio = audioRef.current;
    const played = loadedRef.current === chapterRef.current && audio ? audio.currentTime : 0;
    goTo(played > RESTART_AFTER_SECONDS ? chapterRef.current : Math.max(0, chapterRef.current - 1));
  }, [goTo]);

  // Pause when the viewer scrolls completely away from the section being narrated.
  const anchor = status !== 'idle' && chapterIndex >= 0 ? chapters[chapterIndex].anchor : null;
  useEffect(() => {
    if (!anchor) return;
    const element = document.getElementById(anchor);
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting || Date.now() < suppressUntil.current) return;
      pause('away');
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [anchor, pause]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const value = useMemo<StoryValue>(
    () => ({
      status,
      active: status !== 'idle',
      chapters,
      chapterIndex,
      chapter: status !== 'idle' && chapterIndex >= 0 ? chapters[chapterIndex] : null,
      position: clock.position,
      duration: clock.duration,
      notice,
      start,
      stop,
      toggle,
      next,
      previous,
      goTo,
      indexOf: (part, index) => chapters.findIndex((chapter) => chapter.part === part && chapter.index === index),
    }),
    [status, chapters, chapterIndex, clock, notice, start, stop, toggle, next, previous, goTo],
  );

  return (
    <StoryContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="auto"
        onLoadedMetadata={(event) => {
          if (loadedRef.current !== chapterRef.current) return;
          const seconds = event.currentTarget.duration;
          setClock((current) => ({ ...current, duration: Number.isFinite(seconds) ? seconds : 0 }));
        }}
        onTimeUpdate={(event) => {
          if (loadedRef.current !== chapterRef.current) return;
          const audio = event.currentTarget;
          setClock({ position: audio.currentTime, duration: Number.isFinite(audio.duration) ? audio.duration : 0 });
        }}
        onPlaying={() => {
          switchingRef.current = false;
        }}
        onPause={(event) => {
          // A call or another app interrupted playback: show it as paused instead of silently stuck.
          if (statusRef.current === 'playing' && !switchingRef.current && !event.currentTarget.ended) {
            setStatus('paused');
            setNotice('tap');
          }
        }}
        onEnded={() => {
          if (statusRef.current !== 'playing') return;
          const index = chapterRef.current;
          if (index >= chapters.length - 1) {
            setStatus('finished');
            return;
          }
          const sameSection = chapters[index + 1].anchor === chapters[index].anchor;
          goTo(index + 1, { delay: sameSection ? GAP_SAME_SECTION_MS : GAP_NEW_SECTION_MS });
        }}
        onError={() => {
          if (statusRef.current !== 'playing') return;
          setStatus('paused');
          setNotice('error');
        }}
      />
    </StoryContext.Provider>
  );
}
