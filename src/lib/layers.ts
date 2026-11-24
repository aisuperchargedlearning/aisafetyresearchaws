import type { Layer } from '@/types/episode';

export const layerText: Record<Layer, string> = {
  gateway: 'text-layer-gateway',
  coordination: 'text-layer-coordination',
  model: 'text-layer-model',
  user: 'text-ink-muted',
};

export const layerBorder: Record<Layer, string> = {
  gateway: 'border-layer-gateway/25',
  coordination: 'border-layer-coordination/25',
  model: 'border-layer-model/25',
  user: 'border-line',
};

export const layerDot: Record<Layer, string> = {
  gateway: 'bg-layer-gateway',
  coordination: 'bg-layer-coordination',
  model: 'bg-layer-model',
  user: 'bg-ink-faint',
};

/** CSS colour values (not classes) for places that need the layer colour as a variable or inline style. */
export const layerAccent: Record<Layer, string> = {
  gateway: 'rgb(var(--layer-gateway))',
  coordination: 'rgb(var(--layer-coordination))',
  model: 'rgb(var(--layer-model))',
  user: 'rgb(var(--ink-muted))',
};
