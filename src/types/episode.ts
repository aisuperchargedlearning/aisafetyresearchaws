export type Layer = 'gateway' | 'coordination' | 'model' | 'user';

export interface JourneyStep {
  id: string;
  layer: Layer;
  stepLabel: string;
  title: string;
  /** Accent colour for the step's row, card and narration; matches its card in the infographic. */
  color?: string;
  description: string;
  mirrorNote: string;
  svgGroupId: string;
  arrowGroupId: string | null;
  videoUrl: string | null;
  captionUrl: string | null;
}

export interface JourneyLayer {
  layer: Exclude<Layer, 'user'>;
  name: string;
  visibility: string;
  description: string;
}

export interface Journey {
  diagramLabel?: string;
  layerBands: Partial<Record<Layer, string>>;
  alwaysDimmed: string[];
  overview: { opening: string; transition: string };
  layers: JourneyLayer[];
  steps: JourneyStep[];
}

export type DiagramFocus =
  | { kind: 'full' }
  | { kind: 'layer'; layer: Layer }
  | { kind: 'step'; index: number; /** Keep the step marked but step back to the whole stack for reference. */ zoomOut?: boolean }
  /** Several steps lit together at full view (no zoom), e.g. while narration compares them. */
  | { kind: 'steps'; indices: number[] };

export interface EpisodeMeta {
  slug: string;
  anchor: string;
  number: number;
  title: string;
  summary: string;
  svg: string | null;
  /** Episodes with a bespoke component instead of the generic scroll walkthrough. */
  view?: 'hardware';
}

export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SeriesMeta {
  title: string;
  tagline: string;
}
