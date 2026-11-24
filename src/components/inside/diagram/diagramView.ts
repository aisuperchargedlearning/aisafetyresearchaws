import type { DiagramFocus, Journey, ViewBox } from '@/types/episode';
import type { DiagramLayout } from './diagramLayout';
import { boxInRoot, findGroup } from './diagramMotion';

/** Where the diagram sits inside its frame: rendered width, vertical offset and horizontal scroll. */
export interface DiagramView {
  width: number;
  y: number;
  scrollLeft: number;
  /** Vertical scroll inside the frame (portrait artwork only). */
  scrollTop?: number;
}

interface ViewContext {
  root: SVGSVGElement;
  viewBox: ViewBox;
  layout: DiagramLayout;
  frameWidth: number;
  journey: Journey;
  focus: DiagramFocus;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function lerpView(from: DiagramView, to: DiagramView, t: number): DiagramView {
  return {
    width: from.width + (to.width - from.width) * t,
    y: from.y + (to.y - from.y) * t,
    scrollLeft: from.scrollLeft + (to.scrollLeft - from.scrollLeft) * t,
    scrollTop: (from.scrollTop ?? 0) + ((to.scrollTop ?? 0) - (from.scrollTop ?? 0)) * t,
  };
}

/**
 * Nudges the scroll position so the frame's right edge slices through a component rather than
 * landing in empty space, which signals that the diagram continues.
 */
function withRightEdgeCutOff(ctx: ViewContext, width: number, scrollLeft: number) {
  const maxScroll = width - ctx.frameWidth;
  if (scrollLeft >= maxScroll - 1) return scrollLeft;
  const scale = width / ctx.viewBox.width;
  const edge = (scrollLeft + ctx.frameWidth) / scale + ctx.viewBox.x;
  const boxes = ctx.journey.steps
    .map((step) => findGroup(ctx.root, step.svgGroupId))
    .filter((el): el is SVGGElement => !!el)
    .map((el) => boxInRoot(ctx.root, el));
  if (boxes.length === 0 || boxes.some((box) => box.x + 8 < edge && edge < box.x + box.width - 8)) return scrollLeft;

  const nearest = boxes.reduce((best, box) => (Math.abs(box.x - edge) < Math.abs(best.x - edge) ? box : best));
  const desiredEdge = nearest.x + nearest.width * 0.3;
  return clamp((desiredEdge - ctx.viewBox.x) * scale - ctx.frameWidth, 0, maxScroll);
}

const ZOOM_FILL = 0.72; // how much of the frame a focused step should fill
const MAX_ZOOM = 1.1;

/** Portrait artwork: zoom to the focused group(s) and centre them, scrolling in both directions. */
function computePortraitView(ctx: ViewContext): DiagramView {
  const { root, viewBox, layout, frameWidth, journey, focus } = ctx;
  const frameHeight = layout.height;
  const overview = layout.overviewScale ?? frameWidth / viewBox.width;
  const aspect = viewBox.width / viewBox.height;

  const ids =
    focus.kind === 'step'
      ? [journey.steps[focus.index]?.svgGroupId]
      : focus.kind === 'steps'
        ? focus.indices.map((index) => journey.steps[index]?.svgGroupId)
        : focus.kind === 'layer'
          ? [journey.layerBands[focus.layer]]
          : [];
  const stepBack = focus.kind === 'step' && focus.zoomOut;
  const boxes = (stepBack ? [] : ids)
    .map((id) => findGroup(root, id))
    .filter((el): el is SVGGElement => !!el)
    .map((el) => boxInRoot(root, el));

  let scale = stepBack ? (layout.fitScale ?? overview) : overview;
  let cx = viewBox.x + viewBox.width / 2;
  let cy = viewBox.y;
  let top = true;
  if (boxes.length) {
    const x0 = Math.min(...boxes.map((b) => b.x));
    const y0 = Math.min(...boxes.map((b) => b.y));
    const x1 = Math.max(...boxes.map((b) => b.x + b.width));
    const y1 = Math.max(...boxes.map((b) => b.y + b.height));
    const fit = Math.min((ZOOM_FILL * frameWidth) / (x1 - x0), (0.9 * frameHeight) / (y1 - y0), MAX_ZOOM);
    scale = Math.max(overview, fit);
    cx = (x0 + x1) / 2;
    cy = (y0 + y1) / 2;
    top = false;
  }

  const width = viewBox.width * scale;
  const height = width / aspect;
  const scrollLeft = clamp((cx - viewBox.x) * scale - frameWidth / 2, 0, Math.max(0, width - frameWidth));
  const scrollTop = top ? 0 : clamp((cy - viewBox.y) * scale - frameHeight / 2, 0, Math.max(0, height - frameHeight));
  const y = height < frameHeight ? (frameHeight - height) / 2 : 0;
  return { width, y, scrollLeft: width <= frameWidth ? 0 : top ? (width - frameWidth) / 2 : scrollLeft, scrollTop };
}

export function computeView(ctx: ViewContext): DiagramView {
  if (ctx.layout.portrait) return computePortraitView(ctx);
  const { root, viewBox, layout, frameWidth, journey, focus } = ctx;
  const aspect = viewBox.width / viewBox.height;

  if (layout.compact && focus.kind === 'layer') {
    const band = findGroup(root, journey.layerBands[focus.layer]);
    if (band) {
      const box = boxInRoot(root, band);
      const width = Math.min(layout.width, (viewBox.width * frameWidth) / box.width);
      const scale = width / viewBox.width;
      const height = width / aspect;
      const lowest = Math.min(0, layout.height - height);
      const highest = Math.max(0, layout.height - height);
      const y = clamp(layout.height / 2 - (box.y + box.height / 2 - viewBox.y) * scale, lowest, highest);
      const scrollLeft = clamp((box.x - viewBox.x) * scale, 0, Math.max(0, width - frameWidth));
      return { width, y, scrollLeft };
    }
  }

  const width = layout.width;
  if (!layout.pans) return { width, y: 0, scrollLeft: 0 };

  const scale = width / viewBox.width;
  const maxScroll = width - frameWidth;
  const groupId =
    focus.kind === 'step'
      ? journey.steps[focus.index]?.svgGroupId
      : focus.kind === 'layer'
        ? journey.layerBands[focus.layer]
        : null;
  const group = findGroup(root, groupId);

  let scrollLeft: number;
  if (group) {
    const box = boxInRoot(root, group);
    scrollLeft = clamp((box.x + box.width / 2 - viewBox.x) * scale - frameWidth / 2, 0, maxScroll);
  } else {
    // Fully lit view: compact screens start at the beginning of the journey, wide ones centre the whole picture.
    scrollLeft = layout.compact ? 0 : maxScroll / 2;
  }

  if (layout.compact) scrollLeft = withRightEdgeCutOff(ctx, width, scrollLeft);
  return { width, y: 0, scrollLeft };
}
