import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import type { DiagramFocus, EpisodeMeta, Journey, ViewBox } from '@/types/episode';
import { SOFTWARE_AUDIO } from '@/config/media';
import { scrollToAnchor } from '@/lib/scrollToAnchor';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { usePauseAudioOffscreen } from '@/hooks/usePauseAudioOffscreen';
import { useViewportSize } from '@/hooks/useViewportSize';
import NarrationPlayer from '@/components/audio/NarrationPlayer';
import { useStory } from '@/components/story/storyContext';
import { DiagramStage } from '@/components/inside/diagram/DiagramStage';
import type { DiagramLayout } from '@/components/inside/diagram/diagramLayout';

// Side-by-side layout (diagram left, controls right) from this width up; below it the diagram is
// pinned to the top and the controls to the bottom of the screen.
const WIDE_QUERY = '(min-width: 1024px)';
// The infographic is tall (portrait), so beside the controls it gets a column of its own that stays in view.
const SIDE_MIN = 380;
const SIDE_GAP = 40;
const WIDE_GUTTER = 48;
const MAX_WIDTH = 1280;
const DIAGRAM_COLUMN = 740;

// Diagram cues for the Conclusion narration: while the voice is between `from` and `to` (seconds into
// Conclusion.mp3), the listed journey step indices light up together. Adjust if the audio is re-recorded.
const CONCLUSION_CUES = [
  // "The specific safety checkpoints, marked by these two yellow shields at the top..." (Steps 1 and 7)
  { from: 41.5, to: 53.8, steps: [1, 7] },
  // "They sandwich a massive, intensely complicated computational loop at the bottom..." (Steps 3, 4, 5)
  { from: 53.8, to: 60.7, steps: [3, 4, 5] },
];

// Zoom into a step while its narration starts, then step back to the whole stack for reference: after this many
// seconds of audio, or (for short clips) after this share of the clip, whichever comes first.
const ZOOM_HOLD_SECONDS = 15;
const ZOOM_HOLD_SHORT_CLIP = 0.55;

// The player takes its colours from these variables (see components/audio/narration.css).
const NARRATION_THEME =
  '[--narration-muted:rgb(var(--ink-muted))] [--narration-button-bg:rgb(var(--field))] [--narration-button-border:rgb(var(--line))]';

interface SoftwareExplorerProps {
  episode: EpisodeMeta;
  journey: Journey;
  svg: string;
  viewBox: ViewBox;
}

export function SoftwareExplorer({ episode, journey, svg, viewBox }: SoftwareExplorerProps) {
  const viewport = useViewportSize();
  const wide = useMediaQuery(WIDE_QUERY);
  const rootRef = useRef<HTMLDivElement>(null);
  const stackedDiagramRef = useRef<HTMLDivElement>(null);
  const [localSelected, setLocalSelected] = useState<number | null>(null);
  const story = useStory();
  // While "watch the whole story" is in the software part, the story picks the step; otherwise the viewer does.
  const storyIndex = story.chapter?.part === 'software' ? story.chapter.index : null;
  const selected = storyIndex ?? localSelected;
  // Keep the viewer's own selection where the story left off when it stops.
  useEffect(() => {
    if (storyIndex !== null) setLocalSelected(storyIndex);
  }, [storyIndex]);
  const setSelected = (index: number | null) => {
    if (story.active) {
      if (index !== null) story.goTo(story.indexOf('software', index), { scroll: false });
    } else {
      setLocalSelected(index);
    }
  };
  const [cue, setCue] = useState<number | null>(null);
  const [steppedBack, setSteppedBack] = useState<string | null>(null);
  usePauseAudioOffscreen(rootRef);

  const steps = journey.steps;
  const step = selected === null ? null : steps[selected];
  // The Conclusion (the last item) steps back to the whole architecture rather than zooming into one part.
  const isConclusion = step?.id === 'finish';
  // The intro (step 00) also stays on the whole architecture while it introduces the stack.
  const showAll = selected === null || isConclusion || step?.id === 'start';
  const focus: DiagramFocus =
    isConclusion && cue !== null
      ? { kind: 'steps', indices: CONCLUSION_CUES[cue].steps }
      : showAll
        ? { kind: 'full' }
        : { kind: 'step', index: selected, zoomOut: step?.id === steppedBack };
  const onNarrationTime = step
    ? isConclusion
      ? (seconds: number) => {
          const index = CONCLUSION_CUES.findIndex((item) => seconds >= item.from && seconds < item.to);
          setCue(index === -1 ? null : index);
        }
      : (seconds: number, duration: number) => {
          const hold = Number.isFinite(duration) && duration > 0
            ? Math.min(ZOOM_HOLD_SECONDS, duration * ZOOM_HOLD_SHORT_CLIP)
            : ZOOM_HOLD_SECONDS;
          setSteppedBack(seconds >= hold ? step.id : null);
        }
    : undefined;
  // The story's shared audio feeds the same diagram timing the step's own player does.
  const timeRef = useRef(onNarrationTime);
  useLayoutEffect(() => {
    timeRef.current = onNarrationTime;
  });
  useEffect(() => {
    if (storyIndex !== null) timeRef.current?.(story.position, story.duration);
  }, [storyIndex, story.position, story.duration]);
  const audioUrl = step ? (SOFTWARE_AUDIO[step.id] ?? '') : '';
  const accent = step?.color ?? 'rgb(var(--ink-muted))';
  // Two-digit numbers like the hardware topics: Start is 00, the steps 01 to 07, the Conclusion 08.
  const num = (index: number) => String(index).padStart(2, '0');
  const lastStep = steps.length - 1;
  const episodeLabel = `Episode ${String(episode.number).padStart(2, '0')}`;

  // On phones the diagram scrolls away with the page; choosing a step from the list or Previous/Next brings it back
  // into view so the zoom isn't missed.
  useEffect(() => {
    const el = stackedDiagramRef.current;
    if (wide || selected === null || !el) return;
    if (el.getBoundingClientRect().top < -4) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [selected, wide]);

  const goPrevious = () => setSelected(selected === null || selected === 0 ? null : selected - 1);
  const goNext = () => setSelected(selected === null ? 0 : Math.min(selected + 1, steps.length - 1));
  const canPrevious = selected !== null && !(story.active && selected === 0);
  const canNext = selected === null || selected < steps.length - 1;

  // The infographic is portrait: the frame is a window onto it. The overview always fits the whole picture in the
  // frame (phones included, so the first view is the full stack for reference); a selected step zooms in and scrolls to it (swipe to look around).
  const frameWidth = wide
    ? Math.min(DIAGRAM_COLUMN, Math.min(viewport.width, MAX_WIDTH) - WIDE_GUTTER * 2 - SIDE_MIN - SIDE_GAP)
    : viewport.width;
  const frameHeight = wide
    ? Math.max(480, Math.min(viewport.height * 0.86, 1000))
    : Math.max(260, viewport.height * 0.58);
  const fitScale = Math.min(frameWidth / viewBox.width, frameHeight / viewBox.height);
  const overviewScale = fitScale;
  // Stable between renders so the diagram's pan animation isn't restarted by unrelated updates (audio progress).
  const layout = useMemo<DiagramLayout>(
    () => ({
      width: viewBox.width * overviewScale,
      height: frameHeight,
      pans: false,
      compact: false,
      portrait: true,
      overviewScale,
      fitScale,
      totalHeight: frameHeight,
    }),
    [viewBox.width, overviewScale, fitScale, frameHeight],
  );

  const diagram = (
    <DiagramStage
      svg={svg}
      viewBox={viewBox}
      layout={layout}
      frameWidth={frameWidth}
      journey={journey}
      focus={focus}
      label={journey.diagramLabel ?? episode.title}
      onSelectStep={setSelected}
    />
  );

  const stepList = (
    <ol className="grid gap-0.5 p-[7px]">
      {steps.map((item, index) => {
        const isSelected = index === selected;
        return (
          <li key={item.id} style={{ '--step-color': item.color ?? 'rgb(var(--ink-muted))' } as CSSProperties}>
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelected(index)}
              className="group grid min-h-11 w-full grid-cols-[24px_minmax(0,1fr)_8px] items-center gap-2 rounded-lg border border-transparent px-[9px] py-1.5 text-left text-sm leading-tight text-ink transition-colors duration-300 ease-quiet hover:bg-line/30 aria-pressed:border-[color-mix(in_srgb,var(--step-color)_48%,rgb(var(--line)))] aria-pressed:bg-[color-mix(in_srgb,var(--step-color)_12%,rgb(var(--field-raised)))] aria-pressed:font-semibold"
            >
              <span className="text-xs tabular-nums text-ink-muted transition-colors duration-300 ease-quiet group-aria-pressed:text-[color:var(--step-color)]">
                {num(index)}
              </span>
              <span>{item.title}</span>
              <span aria-hidden className="h-[7px] w-[7px] rounded-full bg-[color:var(--step-color)]" />
            </button>
            {wide && isSelected && !story.active && (
              <div className="px-[9px] pb-1.5 pt-2">
                <NarrationPlayer key={item.id} audioUrl={audioUrl} onTime={onNarrationTime} />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );

  const stepsHeader = (
    <div className="flex min-h-[47px] items-center border-b border-line px-4 py-[13px]">
      <p className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink">Software steps</p>
    </div>
  );

  const navButton =
    'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-field p-1.5 text-sm text-ink transition-colors duration-300 ease-quiet hover:bg-line/40 disabled:cursor-not-allowed disabled:opacity-40';
  const navArrow = 'text-base text-[#b8f681]';

  return (
    <div ref={rootRef} style={{ '--narration-accent': accent } as CSSProperties} className={NARRATION_THEME}>
      <header className="mx-auto max-w-[1280px] px-5 pb-5 pt-6 md:px-8 md:pt-10 lg:px-12 lg:pb-8">
        <a
          href="#episodes"
          onClick={(event) => scrollToAnchor(event, 'episodes')}
          className="group inline-flex items-center gap-2 text-sm text-ink-muted transition-colors duration-500 ease-quiet hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-500 ease-quiet group-hover:-translate-x-0.5" />
          All episodes
        </a>
        <p className="mt-6 text-xs uppercase tracking-[0.24em] text-ink-faint">{episodeLabel}</p>
        {/* Same title style as the hardware section (Inter, heavy, tight), with the accent word in green. */}
        <h2
          className="mt-2"
          style={{
            color: '#edf2ed',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 'clamp(1.85rem, 5vw, 3.75rem)',
            fontWeight: 750,
            lineHeight: 1.05,
            letterSpacing: '-0.055em',
          }}
        >
          Frontier AI Software Stack <span style={{ color: '#b8f681' }}>Explained</span>
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-ink-muted md:text-base">
          Follow one question through the software and security layers. Tap a step on the diagram or in the list, or
          press Next to begin.
        </p>
      </header>

      {wide ? (
        <div
          className="mx-auto grid items-start pb-16"
          style={{
            maxWidth: MAX_WIDTH,
            gridTemplateColumns: `${frameWidth}px minmax(0, 1fr)`,
            columnGap: SIDE_GAP,
            paddingInline: WIDE_GUTTER,
          }}
        >
          <div className="sticky top-6 overflow-hidden rounded-lg border border-line/60 bg-field">{diagram}</div>

          <aside className="flex flex-col gap-4">
            <section aria-label="Selected step" className="rounded-2xl border border-line bg-field-raised p-[15px]">
              <div className="mb-3.5 mt-0.5 border-l-[3px] pl-3" style={{ borderLeftColor: accent }}>
                <p className="mb-1.5 flex justify-between gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.095em] text-ink-muted">
                  Selected step
                  <span className="tabular-nums">
                    {selected === null ? 'Overview' : `${num(selected)} / ${num(lastStep)}`}
                  </span>
                </p>
                <h3
                  className="text-ink"
                  style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    letterSpacing: '-0.025em',
                  }}
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {step ? step.title : 'The full architecture'}
                </h3>
              </div>
              <div className="flex gap-2">
                <button type="button" className={navButton} onClick={goPrevious} disabled={!canPrevious}>
                  <span aria-hidden className={navArrow}>←</span> Previous
                </button>
                <button type="button" className={navButton} onClick={goNext} disabled={!canNext}>
                  Next <span aria-hidden className={navArrow}>→</span>
                </button>
              </div>
            </section>

            <nav aria-label="Steps" className="rounded-2xl border border-line bg-field-raised">
              {stepsHeader}
              {stepList}
            </nav>
          </aside>
        </div>
      ) : (
        <>
          <div ref={stackedDiagramRef} className="border-y border-line/50 bg-field">{diagram}</div>
          <div className="px-3 pb-8 pt-4 md:px-8">
            <nav aria-label="Steps" className="mx-auto max-w-3xl rounded-2xl border border-line bg-field-raised">
              {stepsHeader}
              {stepList}
            </nav>
          </div>
          {!story.active && (
          <div
            role="region"
            aria-label="Step narration"
            className="sticky bottom-0 z-20 border-t border-line bg-field-raised/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_24px_rgba(0,0,0,0.45)] backdrop-blur"
          >
            <div className="mb-2 flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink" aria-live="polite" aria-atomic="true">
                {step && selected !== null ? (
                  <>
                    <span className="mr-2 text-[0.8125rem] tabular-nums" style={{ color: accent }}>
                      {num(selected)}
                    </span>
                    {step.title}
                  </>
                ) : (
                  'The full architecture'
                )}
              </p>
              <button
                type="button"
                aria-label="Previous step"
                onClick={goPrevious}
                disabled={!canPrevious}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink disabled:opacity-40"
              >
                <ChevronLeft aria-hidden className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next step"
                onClick={goNext}
                disabled={!canNext}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink disabled:opacity-40"
              >
                <ChevronRight aria-hidden className="h-4 w-4" />
              </button>
            </div>
            {step ? (
              <NarrationPlayer key={step.id} audioUrl={audioUrl} onTime={onNarrationTime} />
            ) : (
              <p className="text-xs text-ink-muted">Tap a step on the diagram, or press Next to begin.</p>
            )}
          </div>
          )}
        </>
      )}
    </div>
  );
}
