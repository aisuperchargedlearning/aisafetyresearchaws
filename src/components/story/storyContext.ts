import { createContext, useContext } from 'react';

export type StoryPart = 'hardware' | 'software';

/** One narrated chapter of the full story: a hardware topic or a software step. */
export interface StoryChapter {
  part: StoryPart;
  /** Index within its own section (hardware topic or software journey step). */
  index: number;
  title: string;
  url: string;
  /** Id of the page section that shows this chapter. */
  anchor: string;
}

export type StoryStatus = 'idle' | 'playing' | 'paused' | 'finished';
/** Why the story is paused when the viewer didn't pause it themselves. */
export type StoryNotice = 'tap' | 'away' | 'error' | null;

export interface GoToOptions {
  /** Scroll to the chapter's section when it differs from the current one (default true). */
  scroll?: boolean;
}

export interface StoryValue {
  status: StoryStatus;
  /** True from the moment the story starts until the viewer stops it (also while paused or finished). */
  active: boolean;
  chapters: StoryChapter[];
  chapterIndex: number;
  chapter: StoryChapter | null;
  /** Playback position and length (seconds) of the current chapter. */
  position: number;
  duration: number;
  notice: StoryNotice;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  goTo: (index: number, options?: GoToOptions) => void;
  /** Global chapter index of a section's own item, or -1. */
  indexOf: (part: StoryPart, index: number) => number;
}

const noop = () => {};

// Sections rendered outside a provider behave as if no story exists.
export const StoryContext = createContext<StoryValue>({
  status: 'idle',
  active: false,
  chapters: [],
  chapterIndex: -1,
  chapter: null,
  position: 0,
  duration: 0,
  notice: null,
  start: noop,
  stop: noop,
  toggle: noop,
  next: noop,
  previous: noop,
  goTo: noop,
  indexOf: () => -1,
});

export const useStory = () => useContext(StoryContext);
