import type { EpisodeMeta } from '@/types/episode';
import { useEpisodeAssets } from '@/lib/episodes';
import { scrollToAnchor } from '@/lib/scrollToAnchor';
import { SoftwareExplorer } from './SoftwareExplorer';

function Notice({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-ink-muted">{message}</p>
      <a
        href="#episodes"
        onClick={(event) => scrollToAnchor(event, 'episodes')}
        className="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
      >
        Back to all episodes
      </a>
    </div>
  );
}

export function EpisodeSection({ episode }: { episode: EpisodeMeta }) {
  const assets = useEpisodeAssets(episode);

  return (
    <section id={episode.anchor} aria-label={episode.title}>
      {assets.status === 'error' && <Notice message={assets.message} />}
      {assets.status === 'loading' && <div className="min-h-screen" aria-busy="true" />}
      {assets.status === 'ready' && (
        <SoftwareExplorer episode={episode} journey={assets.journey} svg={assets.svg} viewBox={assets.viewBox} />
      )}
    </section>
  );
}
