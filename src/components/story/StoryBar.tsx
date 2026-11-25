import { Pause, Play, RotateCcw, SkipBack, SkipForward, X } from 'lucide-react';
import { useStory } from './storyContext';

const PART_LABEL = { hardware: 'Hardware', software: 'Software' } as const;
const number = (index: number) => String(index).padStart(2, '0');

const roundButton =
  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-ink transition-colors duration-300 ease-quiet hover:bg-line/40 disabled:cursor-not-allowed disabled:opacity-40';

const NOTICE_TEXT = {
  tap: 'Tap play to continue',
  away: 'Paused while you were away',
  error: 'Audio could not load. Skip ahead or stop.',
} as const;

/** The one control bar for "watch the whole story": always on screen while it runs, so it can always be stopped. */
export function StoryBar() {
  const story = useStory();
  const { chapter, chapters, chapterIndex, status } = story;
  if (!story.active || !chapter) return null;

  const finished = status === 'finished';
  const playing = status === 'playing';
  const fraction = story.duration > 0 ? Math.min(1, story.position / story.duration) : 0;
  const progress = finished ? 1 : (chapterIndex + fraction) / chapters.length;
  const sectionNumber = number(chapter.index);
  const headline = finished
    ? 'Story finished'
    : story.notice
      ? NOTICE_TEXT[story.notice]
      : chapter.title;
  const softwareStart = story.indexOf('software', 0);

  return (
    <>
      <div
        role="region"
        aria-label="Story playback"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-field-raised/95 shadow-[0_-10px_24px_rgba(0,0,0,0.45)] backdrop-blur"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="h-0.5 bg-line/60" aria-hidden>
          <div className="h-full bg-[#b8f681] transition-[width] duration-500 ease-quiet" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="mx-auto flex max-w-[1280px] items-center gap-2 px-3 py-2 sm:gap-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.6875rem] uppercase tracking-[0.12em] text-ink-muted">
              {finished
                ? `${chapters.length} chapters`
                : `${PART_LABEL[chapter.part]} · Chapter ${chapterIndex + 1} of ${chapters.length}`}
            </p>
            <p className="truncate text-sm font-medium text-ink" aria-live="polite" aria-atomic="true">
              {!finished && !story.notice && (
                <span className="mr-2 tabular-nums text-[#b8f681]">{sectionNumber}</span>
              )}
              {headline}
            </p>
          </div>

          {chapter.part === 'hardware' && !finished && softwareStart >= 0 && (
            <button
              type="button"
              onClick={() => story.goTo(softwareStart)}
              className="hidden h-10 items-center rounded-full border border-line px-4 text-sm text-ink transition-colors duration-300 ease-quiet hover:bg-line/40 md:inline-flex"
            >
              Skip to software
            </button>
          )}

          <button type="button" aria-label="Previous chapter" className={roundButton} onClick={story.previous} disabled={finished}>
            <SkipBack aria-hidden className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={finished ? 'Watch again' : playing ? 'Pause' : 'Play'}
            onClick={story.toggle}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#b8f681] text-[#0a0d0a] transition-opacity duration-300 ease-quiet hover:opacity-90"
          >
            {finished ? (
              <RotateCcw aria-hidden className="h-5 w-5" />
            ) : playing ? (
              <Pause aria-hidden className="h-5 w-5" fill="currentColor" />
            ) : (
              <Play aria-hidden className="h-5 w-5" fill="currentColor" />
            )}
          </button>
          <button
            type="button"
            aria-label="Next chapter"
            className={roundButton}
            onClick={story.next}
            disabled={finished || chapterIndex >= chapters.length - 1}
          >
            <SkipForward aria-hidden className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={story.stop}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-line px-3 text-sm text-ink transition-colors duration-300 ease-quiet hover:bg-line/40"
          >
            <X aria-hidden className="h-4 w-4" />
            {finished ? 'Close' : 'Stop'}
          </button>
        </div>
      </div>
      {/* Keeps the end of the page from sitting under the bar. */}
      <div aria-hidden className="h-[80px]" />
    </>
  );
}
