import { ArrowRight, Layers, Play } from 'lucide-react';
import { episodes, series } from '@/lib/episodes';
import { scrollToAnchor } from '@/lib/scrollToAnchor';
import { EpisodeSection } from '@/components/inside/episode/EpisodeSection';
import HardwareExplainer from '@/components/hardware/HardwareExplainer';
import { topics } from '@/components/hardware/board';
import { SOFTWARE_AUDIO } from '@/config/media';
import softwareJourney from '@/content/episodes/software-security-ai-stack/journey.json';
import { StoryBar } from '@/components/story/StoryBar';
import { StoryProvider } from '@/components/story/StoryProvider';
import { useStory, type StoryChapter } from '@/components/story/storyContext';

// "Watch the whole story": every hardware topic in order, then every software step. A chapter with no audio is skipped.
const hardwareAnchor = episodes.find((episode) => episode.view === 'hardware')?.anchor ?? 'hardware';
const softwareAnchor = episodes.find((episode) => episode.slug === 'software-security-ai-stack')?.anchor ?? 'software';
const storyChapters: StoryChapter[] = [
  ...topics.map((topic, index) => ({
    part: 'hardware' as const,
    index,
    title: topic.name,
    url: topic.audioUrl,
    anchor: hardwareAnchor,
  })),
  ...softwareJourney.steps.map((step, index) => ({
    part: 'software' as const,
    index,
    title: step.title,
    url: SOFTWARE_AUDIO[step.id] ?? '',
    anchor: softwareAnchor,
  })),
].filter((chapter) => chapter.url);

export function InsideTheMachine() {
  return (
    <StoryProvider chapters={storyChapters}>
      <InsideTheMachineContent />
      <StoryBar />
    </StoryProvider>
  );
}

function InsideTheMachineContent() {
  const story = useStory();
  const isPublished = (episode: (typeof episodes)[number]) => Boolean(episode.svg || episode.view);
  const published = episodes.filter(isPublished);

  return (
    <section id="inside-the-machine">
      <div className="theme-inside">
        <div className="mx-auto max-w-4xl px-6 py-12 md:px-12 md:py-16">
          <header>
            <Layers aria-hidden className="h-5 w-5 text-layer-gateway" strokeWidth={1.5} />
            <h1 className="mt-6 text-4xl text-ink md:text-6xl">{series.title}</h1>
            <p className="mt-4 max-w-xl text-base text-ink-muted md:text-lg">{series.tagline}</p>
          </header>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 md:mt-10">
            <button
              type="button"
              onClick={story.start}
              className="inline-flex min-h-12 items-center gap-2.5 rounded-full bg-[#b8f681] px-6 py-3 text-base font-semibold text-[#0a0d0a] transition-opacity duration-300 ease-quiet hover:opacity-90"
            >
              <Play aria-hidden className="h-4 w-4" fill="currentColor" />
              {story.active ? 'Restart the whole story' : 'Watch the whole story'}
            </button>
            <p className="text-sm text-ink-muted">
              Hardware, then software: {storyChapters.length} short chapters that play on their own. Stop any time.
            </p>
          </div>

          <ol id="episodes" className="mt-10 border-t border-line/60 md:mt-14">
            {episodes.map((episode) => {
              const number = (
                <span className="text-sm tabular-nums text-ink-faint">{String(episode.number).padStart(2, '0')}</span>
              );
              const rowClass = 'grid grid-cols-[3rem_1fr_auto] items-baseline gap-4 py-5 md:grid-cols-[5rem_1fr_auto] md:gap-8 md:py-6';

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
                        <span className="block font-serif text-xl text-ink transition-colors duration-700 ease-quiet group-hover:text-layer-gateway md:text-2xl">
                          {episode.title}
                        </span>
                        <span className="mt-1.5 block max-w-prose text-sm text-ink-muted">{episode.summary}</span>
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
                        <span className="block font-serif text-xl text-ink-muted md:text-2xl">{episode.title}</span>
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
