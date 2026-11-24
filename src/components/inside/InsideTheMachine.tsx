import { ArrowRight, Layers } from 'lucide-react';
import { episodes, series } from '@/lib/episodes';
import { scrollToAnchor } from '@/lib/scrollToAnchor';
import { EpisodeSection } from '@/components/inside/episode/EpisodeSection';
import HardwareExplainer from '@/components/hardware/HardwareExplainer';

export function InsideTheMachine() {
  const isPublished = (episode: (typeof episodes)[number]) => Boolean(episode.svg || episode.view);
  const published = episodes.filter(isPublished);

  return (
    <section id="inside-the-machine">
      <div className="theme-inside">
        <div className="mx-auto min-h-screen max-w-4xl px-6 py-16 md:px-12 md:py-24">
          <header>
            <Layers aria-hidden className="h-5 w-5 text-layer-gateway" strokeWidth={1.5} />
            <h1 className="mt-8 text-4xl text-ink md:text-6xl">{series.title}</h1>
            <p className="mt-4 max-w-xl text-base text-ink-muted md:text-lg">{series.tagline}</p>
          </header>

          <ol id="episodes" className="mt-16 border-t border-line/60 md:mt-24">
            {episodes.map((episode) => {
              const number = (
                <span className="text-sm tabular-nums text-ink-faint">{String(episode.number).padStart(2, '0')}</span>
              );
              const rowClass = 'grid grid-cols-[3rem_1fr_auto] items-baseline gap-4 py-8 md:grid-cols-[5rem_1fr_auto] md:gap-8';

              return (
                <li key={episode.slug} className="border-b border-line/60">
                  {isPublished(episode) ? (
                    <a
                      href={`#${episode.anchor}`}
                      onClick={(event) => scrollToAnchor(event, episode.anchor)}
                      className={`group ${rowClass}`}
                    >
                      {number}
                      <span>
                        <span className="block font-serif text-2xl text-ink transition-colors duration-700 ease-quiet group-hover:text-layer-gateway md:text-3xl">
                          {episode.title}
                        </span>
                        <span className="mt-2 block max-w-prose text-sm text-ink-muted">{episode.summary}</span>
                      </span>
                      <ArrowRight
                        aria-hidden
                        className="h-4 w-4 self-center text-ink-faint transition-all duration-700 ease-quiet group-hover:translate-x-1 group-hover:text-ink"
                      />
                    </a>
                  ) : (
                    <div className={rowClass}>
                      {number}
                      <span>
                        <span className="block font-serif text-2xl text-ink-muted md:text-3xl">{episode.title}</span>
                        <span className="mt-2 block max-w-prose text-sm text-ink-faint">{episode.summary}</span>
                      </span>
                      <span className="self-center whitespace-nowrap text-xs uppercase tracking-[0.2em] text-ink-faint">
                        In production
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {published.map((episode) =>
        episode.view === 'hardware' ? (
          <HardwareExplainer key={episode.slug} id={episode.anchor} episodeNumber={episode.number} />
        ) : (
          <div key={episode.slug} className="theme-inside">
            <EpisodeSection episode={episode} />
          </div>
        ),
      )}
    </section>
  );
}
