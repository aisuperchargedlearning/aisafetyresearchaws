import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import type { JourneyLayer } from '@/types/episode';
import { layerBorder, layerText } from '@/lib/layers';

const QUIET = { duration: 1, ease: [0.25, 0.1, 0.25, 1] as const };

interface SectionBaseProps {
  isActive: boolean;
  minHeight: number;
  sectionRef: (el: HTMLElement | null) => void;
}

interface OpeningSectionProps extends SectionBaseProps {
  episodeLabel: string;
  title: string;
  summary: string;
  opening: string;
}

export function OpeningSection({ episodeLabel, title, summary, opening, isActive, minHeight, sectionRef }: OpeningSectionProps) {
  return (
    <section ref={sectionRef} className="flex items-center py-8 md:py-10" style={{ minHeight }}>
      <motion.div initial={false} animate={{ opacity: isActive ? 1 : 0.32 }} transition={QUIET}>
        <p className="text-xs uppercase tracking-[0.24em] text-ink-faint">{episodeLabel}</p>
        <h2 className="mt-4 text-3xl text-ink md:text-4xl xl:text-5xl">{title}</h2>
        <p className="mt-6 max-w-prose text-base text-ink-muted">{summary}</p>
        <p className="mt-4 max-w-prose text-base text-ink">{opening}</p>
        <ArrowDown aria-hidden className="mt-10 h-4 w-4 text-ink-faint" />
      </motion.div>
    </section>
  );
}

interface LayerSectionProps extends SectionBaseProps {
  layer: JourneyLayer;
  position: number;
  total: number;
}

export function LayerSection({ layer, position, total, isActive, minHeight, sectionRef }: LayerSectionProps) {
  const headingId = `layer-${layer.layer}`;
  return (
    <section ref={sectionRef} aria-labelledby={headingId} className="flex items-center py-8 md:py-10" style={{ minHeight }}>
      <motion.div
        className="grid w-full grid-cols-1 items-center gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-10 lg:gap-16"
        initial={false}
        animate={{ opacity: isActive ? 1 : 0.32 }}
        transition={QUIET}
      >
        <div
          className={`flex aspect-video w-full flex-col justify-end rounded-sm border bg-field-raised/40 p-6 transition-colors md:p-8 duration-1000 ease-quiet lg:p-10 ${
            isActive ? layerBorder[layer.layer] : 'border-line/60'
          }`}
        >
          <p className="text-xs uppercase tracking-[0.24em] text-ink-faint">
            Layer {position} of {total}
          </p>
          <h2 id={headingId} className={`mt-3 text-2xl md:mt-4 md:text-3xl xl:text-4xl ${layerText[layer.layer]}`}>
            {layer.name}
          </h2>
          <p className="mt-3 font-serif text-lg italic text-ink-muted">{layer.visibility}</p>
        </div>
        <p className="max-w-prose text-base text-ink-muted">{layer.description}</p>
      </motion.div>
    </section>
  );
}

interface TransitionSectionProps extends SectionBaseProps {
  text: string;
}

export function TransitionSection({ text, isActive, minHeight, sectionRef }: TransitionSectionProps) {
  return (
    <section ref={sectionRef} className="flex items-center justify-center py-8 md:py-10" style={{ minHeight }}>
      <motion.p
        className="max-w-2xl text-center font-serif text-2xl italic text-ink lg:text-3xl"
        initial={false}
        animate={{ opacity: isActive ? 1 : 0.32 }}
        transition={QUIET}
      >
        {text}
      </motion.p>
    </section>
  );
}
