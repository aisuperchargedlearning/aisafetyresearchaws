import { motion } from 'framer-motion';
import type { JourneyStep } from '@/types/episode';
import { layerBorder, layerText } from '@/lib/layers';

interface StepSectionProps {
  step: JourneyStep;
  isActive: boolean;
  minHeight: number;
  sectionRef: (el: HTMLElement | null) => void;
}

export function StepSection({ step, isActive, minHeight, sectionRef }: StepSectionProps) {
  return (
    <section
      ref={sectionRef}
      aria-labelledby={`step-${step.id}`}
      tabIndex={-1}
      className="flex items-center py-8 outline-none md:py-10"
      style={{ minHeight }}
    >
      <motion.div
        className="grid w-full grid-cols-1 items-center gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-10 lg:gap-16"
        initial={false}
        animate={{ opacity: isActive ? 1 : 0.32 }}
        transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div
          className={`aspect-video w-full rounded-sm border bg-field-raised/60 transition-colors duration-1000 ease-quiet ${
            isActive ? layerBorder[step.layer] : 'border-line/60'
          }`}
        />
        <div>
          <p className={`text-xs font-medium uppercase tracking-[0.24em] ${layerText[step.layer]}`}>{step.stepLabel}</p>
          <h2 id={`step-${step.id}`} className="mt-3 text-2xl text-ink md:mt-4 lg:text-3xl xl:text-4xl">
            {step.title}
          </h2>
          <p className="mt-4 max-w-prose text-base text-ink-muted">{step.description}</p>
          <p className="mt-6 max-w-prose border-l border-line pl-4 font-serif text-base italic text-ink-muted">
            {step.mirrorNote}
          </p>
        </div>
      </motion.div>
    </section>
  );
}
