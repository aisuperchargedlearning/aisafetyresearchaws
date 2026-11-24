import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ChevronsDown } from 'lucide-react';
import type { DiagramFocus, EpisodeMeta, Journey, ViewBox } from '@/types/episode';
import { scrollToAnchor } from '@/lib/scrollToAnchor';
import { useActiveSection } from '@/hooks/useActiveSection';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useViewportSize } from '@/hooks/useViewportSize';
import { DiagramStage } from '@/components/inside/diagram/DiagramStage';
import { computeDiagramLayout } from '@/components/inside/diagram/diagramLayout';
import { LayerSection, OpeningSection, TransitionSection } from './OverviewSections';
import { StepSection } from './StepSection';

const QUIET = { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const };

interface EpisodeViewProps {
  episode: EpisodeMeta;
  journey: Journey;
  svg: string;
  viewBox: ViewBox;
}

export function EpisodeView({ episode, journey, svg, viewBox }: EpisodeViewProps) {
  const viewport = useViewportSize();
  const compact = !useMediaQuery('(min-width: 768px)');
  const headerHeight = compact ? 48 : 56;
  const captionHeight = journey.diagramLabel ? 32 : 0;
  const layout = computeDiagramLayout(viewBox, viewport.width, viewport.height - captionHeight, compact);
  const bandHeight = headerHeight + layout.totalHeight + captionHeight;
  const hasSteps = journey.steps.length > 0;
  const lowerHeight = Math.max(compact ? 240 : 320, viewport.height - bandHeight);
  const { activeIndex, register, getElement } = useActiveSection(bandHeight + lowerHeight / 2, viewport.height);
  const episodeLabel = `Episode ${String(episode.number).padStart(2, '0')}`;

  // Section order: opening, one per layer, transition, then one per step.
  const layerStart = 1;
  const transitionIndex = layerStart + journey.layers.length;
  const stepStart = transitionIndex + 1;

  const focus: DiagramFocus =
    activeIndex >= stepStart
      ? { kind: 'step', index: activeIndex - stepStart }
      : activeIndex >= layerStart && activeIndex < transitionIndex
        ? { kind: 'layer', layer: journey.layers[activeIndex - layerStart].layer }
        : { kind: 'full' };

  const skipToWalkthrough = () => {
    const firstStep = getElement(stepStart);
    if (!firstStep) return;
    window.scrollTo({ top: firstStep.getBoundingClientRect().top + window.scrollY - bandHeight });
    firstStep.focus({ preventScroll: true });
  };

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-line/50 bg-field">
        <header
          className="flex items-center justify-between gap-4 px-5 text-sm text-ink-muted md:px-8 lg:px-12"
          style={{ height: headerHeight }}
        >
          <a
            href="#episodes"
            onClick={(event) => scrollToAnchor(event, 'episodes')}
            className="group inline-flex shrink-0 items-center gap-2 transition-colors duration-500 ease-quiet hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-500 ease-quiet group-hover:-translate-x-0.5" />
            All episodes
          </a>
          <div className="flex items-center gap-8">
            <AnimatePresence initial={false}>
              {hasSteps && activeIndex < stepStart && (
                <motion.button
                  key="skip"
                  type="button"
                  onClick={skipToWalkthrough}
                  className="group inline-flex items-center gap-2 whitespace-nowrap transition-colors duration-500 ease-quiet hover:text-ink"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={QUIET}
                >
                  Skip to the walkthrough
                  <ChevronsDown className="h-4 w-4 transition-transform duration-500 ease-quiet group-hover:translate-y-0.5" />
                </motion.button>
              )}
            </AnimatePresence>
            <span className="hidden text-xs uppercase tracking-[0.2em] text-ink-faint md:inline">{episodeLabel}</span>
          </div>
        </header>
        <DiagramStage
          svg={svg}
          viewBox={viewBox}
          layout={layout}
          frameWidth={viewport.width}
          journey={journey}
          focus={focus}
          label={journey.diagramLabel ?? episode.title}
        />
        {journey.diagramLabel && (
          <p
            className="flex items-center justify-center px-5 text-center text-[11px] uppercase tracking-[0.24em] text-ink-muted"
            style={{ height: captionHeight }}
          >
            {journey.diagramLabel}
          </p>
        )}
      </div>

      <div className="mx-auto max-w-6xl px-5 md:px-8 lg:px-12">
        <OpeningSection
          episodeLabel={episodeLabel}
          title={episode.title}
          summary={episode.summary}
          opening={journey.overview.opening}
          isActive={activeIndex === 0}
          minHeight={lowerHeight}
          sectionRef={register(0)}
        />

        {journey.layers.map((layer, i) => (
          <LayerSection
            key={layer.layer}
            layer={layer}
            position={i + 1}
            total={journey.layers.length}
            isActive={activeIndex === layerStart + i}
            minHeight={lowerHeight}
            sectionRef={register(layerStart + i)}
          />
        ))}

        {hasSteps && (
          <TransitionSection
            text={journey.overview.transition}
            isActive={activeIndex === transitionIndex}
            minHeight={lowerHeight * 0.6}
            sectionRef={register(transitionIndex)}
          />
        )}

        {journey.steps.map((step, i) => (
          <StepSection
            key={step.id}
            step={step}
            isActive={activeIndex === stepStart + i}
            minHeight={lowerHeight}
            sectionRef={register(stepStart + i)}
          />
        ))}

        <div aria-hidden style={{ height: lowerHeight / 2 }} />
      </div>
    </div>
  );
}
