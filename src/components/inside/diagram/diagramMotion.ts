import { animate } from 'framer-motion';
import type { Journey, Layer } from '@/types/episode';

export const OPACITY = { full: 1, completed: 0.72, dim: 0.45, layerDim: 0.3 } as const;

const FADE = { duration: 1.1, ease: [0.25, 0.1, 0.25, 1] as const };
const DRAW_SECONDS = 0.6;

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function findGroup(svg: SVGSVGElement, id: string | null | undefined) {
  return id ? svg.querySelector<SVGGElement>(`#${CSS.escape(id)}`) : null;
}

/** Bounding box in the root SVG's coordinate space, including the element's own transforms. */
export function boxInRoot(svg: SVGSVGElement, el: SVGGraphicsElement): Box {
  const box = el.getBBox();
  const rootCtm = svg.getScreenCTM();
  const elCtm = el.getScreenCTM();
  if (!rootCtm || !elCtm) return box;
  const m = rootCtm.inverse().multiply(elCtm);
  const corners = [
    [box.x, box.y],
    [box.x + box.width, box.y],
    [box.x, box.y + box.height],
    [box.x + box.width, box.y + box.height],
  ].map(([x, y]) => new DOMPoint(x, y).matrixTransform(m));
  const xs = corners.map((p) => p.x);
  const ys = corners.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

function journeyTargetIds(journey: Journey) {
  const ids = new Set<string>(journey.alwaysDimmed);
  Object.values(journey.layerBands).forEach((id) => id && ids.add(id));
  journey.steps.forEach((step) => {
    ids.add(step.svgGroupId);
    if (step.arrowGroupId) ids.add(step.arrowGroupId);
  });
  return ids;
}

export interface FadeModel {
  units: Element[];
  layerOf: Map<Element, Layer>;
}

/**
 * Splits the diagram into independently fadeable pieces and assigns each to the layer band it
 * sits in. Wrapper groups are descended into when they contain a journey target (a parent's
 * opacity caps its children's) or when they straddle more than one band.
 */
export function buildFadeModel(svg: SVGSVGElement, journey: Journey): FadeModel {
  const targetIds = journeyTargetIds(journey);
  const targets = [...targetIds].map((id) => findGroup(svg, id)).filter((el): el is SVGGElement => !!el);
  const bands = (Object.entries(journey.layerBands) as [Layer, string][])
    .map(([layer, id]) => {
      const el = findGroup(svg, id);
      return el ? { layer, el, box: boxInRoot(svg, el) } : null;
    })
    .filter((band): band is NonNullable<typeof band> => !!band);

  const bandsTouched = (box: Box) =>
    bands.filter((band) => box.y < band.box.y + band.box.height && box.y + box.height > band.box.y).length;

  const units: Element[] = [];
  const skipTags = new Set(['defs', 'style', 'title', 'desc', 'metadata']);

  const walk = (parent: Element) => {
    for (const child of Array.from(parent.children)) {
      const tag = child.tagName.toLowerCase();
      if (skipTags.has(tag)) continue;
      // Root-level rects are the background plates; they stay untouched.
      if (parent === svg && tag === 'rect') continue;
      if (targetIds.has(child.id)) units.push(child);
      else if (targets.some((t) => child.contains(t))) walk(child);
      else if (tag === 'g' && bandsTouched(boxInRoot(svg, child as SVGGElement)) > 1) walk(child);
      else units.push(child);
    }
  };
  walk(svg);

  const layerOf = new Map<Element, Layer>();
  units.forEach((unit) => {
    const own = bands.find((band) => band.el === unit);
    if (own) {
      layerOf.set(unit, own.layer);
      return;
    }
    const box = boxInRoot(svg, unit as SVGGraphicsElement);
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const home = bands.find(
      (band) =>
        cx >= band.box.x && cx <= band.box.x + band.box.width && cy >= band.box.y && cy <= band.box.y + band.box.height,
    );
    if (home) layerOf.set(unit, home.layer);
  });

  return { units, layerOf };
}

export function fadeTo(el: Element, opacity: number, reduceMotion: boolean) {
  animate(el, { opacity }, reduceMotion ? { duration: 0.4 } : FADE);
}

export function drawArrow(group: SVGGElement, reduceMotion: boolean) {
  const shapes = Array.from(group.querySelectorAll<SVGGeometryElement>('path, line, polyline'));
  const strokes: SVGGeometryElement[] = [];
  const heads: SVGGeometryElement[] = [];

  shapes.forEach((shape) => {
    const length = shape.getTotalLength();
    if (length < 1) return;
    if (getComputedStyle(shape).stroke !== 'none') strokes.push(shape);
    else heads.push(shape);
  });

  if (reduceMotion) {
    [...strokes, ...heads].forEach((shape) => {
      shape.style.strokeDasharray = '';
      shape.style.strokeDashoffset = '';
      animate(shape, { opacity: [0, 1] }, { duration: 0.4 });
    });
    return;
  }

  strokes.forEach((shape) => {
    const length = shape.getTotalLength() + 1;
    shape.style.strokeDasharray = `${length} ${length}`;
    animate(shape, { strokeDashoffset: [length, 0] }, { duration: DRAW_SECONDS, ease: 'easeInOut' });
  });
  heads.forEach((shape) => {
    animate(shape, { opacity: [0, 1] }, { duration: 0.3, delay: DRAW_SECONDS * 0.75, ease: 'easeOut' });
  });
}
