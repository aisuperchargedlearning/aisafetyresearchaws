import { useRef } from 'react';
import HeroDiagram from '@/components/hero/HeroDiagram';

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);

  const scrollToNext = () => {
    const next = heroRef.current?.nextElementSibling;
    if (!next) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    next.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-screen w-full items-center overflow-hidden bg-[#0a0d0a] text-white"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative flex w-full flex-col py-16 lg:flex-row lg:items-center lg:py-0">
        <div className="w-full px-6 sm:px-10 lg:w-[45%] lg:shrink-0 lg:pl-[clamp(2rem,3vw,4.5rem)] lg:pr-4">
          <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.28em] text-neutral-400 sm:text-sm">
            <span aria-hidden="true" className="h-4 w-[3px] rounded-full bg-lime-400" />
            The AI Foresight Paradox
          </p>

          <h1 className="mt-6 text-[clamp(1.875rem,7.5vw,2.75rem)] font-bold leading-[1.1] tracking-[-0.015em] lg:mt-8 lg:text-[clamp(1.375rem,2.05vw,3.25rem)]">
            <span className="block xl:whitespace-nowrap">We know how to build the machines.</span>
            <span className="block xl:whitespace-nowrap">We know how to scale the computation.</span>
          </h1>

          <div className="-mx-6 mt-10 sm:-mx-10 lg:hidden">
            <HeroDiagram variant="mobile" className="h-auto w-full" />
          </div>

          <p className="mt-10 border-l-2 border-lime-400 bg-gradient-to-r from-white/[0.06] via-white/[0.03] to-transparent py-4 pl-5 pr-4 text-[clamp(1.25rem,1.75vw,2rem)] font-medium leading-[1.3] text-lime-400 lg:mt-8 lg:py-5">
            How can we assure the safety of intelligence whose future capabilities we cannot yet
            predict?
          </p>

          <p className="mt-6 text-[clamp(1rem,1.35vw,1.375rem)] leading-normal text-white">
            Understanding cannot be outsourced.
          </p>

          <button
            type="button"
            onClick={scrollToNext}
            className="mt-6 rounded-md bg-lime-400 px-6 py-3 text-base font-bold text-[#0a0d0a] shadow-[0_0_0_0_rgba(163,230,53,0)] transition duration-200 hover:-translate-y-0.5 hover:bg-lime-300 hover:shadow-[0_8px_28px_-6px_rgba(163,230,53,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0d0a] active:translate-y-0 lg:text-[clamp(1rem,1.2vw,1.25rem)]"
          >
            Follow the Prompt
          </button>

          <p className="mt-4 text-sm leading-normal text-neutral-300 lg:text-[clamp(0.875rem,0.95vw,1rem)]">
            Trace it through the hardware and software, and form an opinion of your own.
          </p>
        </div>

        <div className="hidden lg:flex lg:w-[55%] lg:items-center">
          <HeroDiagram variant="desktop" className="h-auto w-full" />
        </div>
      </div>
    </section>
  );
}
