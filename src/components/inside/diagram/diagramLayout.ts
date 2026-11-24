import type { ViewBox } from '@/types/episode';

const MAX_HEIGHT_RATIO = 0.45;
// Below this rendered width the diagram's labels become too small to read, so it overflows and pans instead.
const MIN_READABLE_WIDTH = 1280;

const COMPACT_HEIGHT_RATIO = 0.4;
const COMPACT_MAX_HEIGHT_RATIO = 0.48;
// Smallest scale at which component labels stay legible on a phone (~10px text).
const COMPACT_MIN_SCALE = 0.42;

export const PROGRESS_BAR_HEIGHT = 12;

export interface DiagramLayout {
  width: number;
  height: number;
  pans: boolean;
  compact: boolean;
  /** Height of the diagram plus any chrome rendered directly beneath it. */
  totalHeight: number;
  /**
   * Tall (portrait) artwork: `height` is the visible window, `overviewScale` the scale that shows the
   * overview, and a focused step zooms in and scrolls in both directions.
   */
  portrait?: boolean;
  overviewScale?: number;
  /** Scale that fits the entire picture in the frame (used when stepping back for reference). */
  fitScale?: number;
}

export function computeDiagramLayout(
  viewBox: ViewBox,
  frameWidth: number,
  viewportHeight: number,
  compact: boolean,
): DiagramLayout {
  const aspect = viewBox.width / viewBox.height;

  if (compact) {
    const height = Math.min(
      viewportHeight * COMPACT_MAX_HEIGHT_RATIO,
      Math.max(viewportHeight * COMPACT_HEIGHT_RATIO, viewBox.height * COMPACT_MIN_SCALE),
    );
    const width = height * aspect;
    return { width, height, pans: width > frameWidth + 1, compact, totalHeight: height + PROGRESS_BAR_HEIGHT };
  }

  const widthAtMaxHeight = viewportHeight * MAX_HEIGHT_RATIO * aspect;
  const width = Math.min(Math.max(frameWidth, MIN_READABLE_WIDTH), widthAtMaxHeight);
  const height = width / aspect;
  return { width, height, pans: width > frameWidth + 1, compact, totalHeight: height };
}
