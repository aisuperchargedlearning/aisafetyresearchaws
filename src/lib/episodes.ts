import { useEffect, useState } from 'react';
import catalog from '@/content/episodes.json';
import type { EpisodeMeta, Journey, SeriesMeta, ViewBox } from '@/types/episode';

// New episodes: drop the SVG into src/assets/svg, add src/content/episodes/<slug>/journey.json,
// and list the episode in src/content/episodes.json.
const svgFiles = import.meta.glob<string>('/src/assets/svg/*.svg', { query: '?raw', import: 'default' });
const journeyFiles = import.meta.glob<Journey>('/src/content/episodes/*/journey.json', { import: 'default' });

export const series: SeriesMeta = catalog.series;
export const episodes = [...catalog.episodes].sort((a, b) => a.number - b.number) as EpisodeMeta[];

function cleanSvgMarkup(raw: string) {
  return raw.replace(/<\?xml[^>]*\?>/, '').replace(/<!--[\s\S]*?-->/g, '').trim();
}

function readViewBox(svg: string): ViewBox | null {
  const match = svg.match(/<svg[^>]*\sviewBox="([^"]+)"/);
  const values = match?.[1].trim().split(/[\s,]+/).map(Number);
  if (!values || values.length !== 4 || values.some(Number.isNaN) || values[2] <= 0 || values[3] <= 0) return null;
  const [x, y, width, height] = values;
  return { x, y, width, height };
}

type EpisodeAssets =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; svg: string; viewBox: ViewBox; journey: Journey };

export function useEpisodeAssets(episode: EpisodeMeta | undefined): EpisodeAssets {
  const [assets, setAssets] = useState<EpisodeAssets>({ status: 'loading' });

  useEffect(() => {
    if (!episode) return;
    if (!episode.svg) {
      setAssets({ status: 'error', message: 'This episode is still in production.' });
      return;
    }
    const loadSvg = svgFiles[`/src/assets/svg/${episode.svg}`];
    const loadJourney = journeyFiles[`/src/content/episodes/${episode.slug}/journey.json`];
    if (!loadSvg || !loadJourney) {
      setAssets({ status: 'error', message: 'This episode is missing its diagram or journey file.' });
      return;
    }

    let cancelled = false;
    setAssets({ status: 'loading' });
    Promise.all([loadSvg(), loadJourney()])
      .then(([svg, journey]) => {
        if (cancelled) return;
        if (!Array.isArray(journey?.steps) || !Array.isArray(journey.layers) || !journey.overview) {
          setAssets({ status: 'error', message: 'This episode journey file is incomplete.' });
          return;
        }
        const viewBox = readViewBox(svg);
        if (!viewBox) {
          setAssets({ status: 'error', message: 'This episode diagram has no usable dimensions.' });
          return;
        }
        setAssets({ status: 'ready', svg: cleanSvgMarkup(svg), viewBox, journey });
      })
      .catch(() => {
        if (!cancelled) setAssets({ status: 'error', message: 'This episode could not be loaded.' });
      });

    return () => {
      cancelled = true;
    };
  }, [episode]);

  return assets;
}
