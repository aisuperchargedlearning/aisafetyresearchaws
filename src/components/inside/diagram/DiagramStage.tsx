import { useEffect, useLayoutEffect, useMemo, useRef, type MouseEvent } from 'react';
import { animate, useReducedMotion, type AnimationPlaybackControls } from 'framer-motion';
import type { DiagramFocus, Journey, ViewBox } from '@/types/episode';
import { useScrollMetrics } from '@/hooks/useScrollMetrics';
import type { DiagramLayout } from './diagramLayout';
import { OPACITY, buildFadeModel, drawArrow, fadeTo, findGroup, type FadeModel } from './diagramMotion';
import { computeView, lerpView, type DiagramView } from './diagramView';
import { DiagramEdgeCues, DiagramProgressBar } from './DiagramScrollCues';

const PAN = { duration: 0.8, ease: [0.45, 0, 0.25, 1] as const };

interface DiagramStageProps {
  svg: string;
  viewBox: ViewBox;
  layout: DiagramLayout;
  frameWidth: number;
  journey: Journey;
  focus: DiagramFocus;
  label: string;
  /** When provided, tapping a step's group in the diagram selects that step. */
  onSelectStep?: (index: number) => void;
}

function focusTargets(root: SVGSVGElement, model: FadeModel, journey: Journey, focus: DiagramFocus) {
  const targets = new Map<Element, number>();
  const setGroup = (id: string | null | undefined, opacity: number) => {
    const group = findGroup(root, id);
    if (group) targets.set(group, opacity);
  };

  if (focus.kind === 'full') {
    model.units.forEach((unit) => targets.set(unit, OPACITY.full));
    return targets;
  }

  if (focus.kind === 'layer') {
    model.units.forEach((unit) =>
      targets.set(unit, model.layerOf.get(unit) === focus.layer ? OPACITY.full : OPACITY.layerDim),
    );
    journey.alwaysDimmed.forEach((id) => setGroup(id, OPACITY.layerDim));
    return targets;
  }

  if (focus.kind === 'steps') {
    model.units.forEach((unit) => targets.set(unit, OPACITY.dim));
    focus.indices.forEach((index) => {
      const lit = journey.steps[index];
      if (!lit) return;
      setGroup(journey.layerBands[lit.layer], OPACITY.full);
      setGroup(lit.svgGroupId, OPACITY.full);
    });
    journey.alwaysDimmed.forEach((id) => setGroup(id, OPACITY.dim));
    return targets;
  }

  const active = journey.steps[focus.index];
  model.units.forEach((unit) => targets.set(unit, OPACITY.dim));
  journey.steps.slice(0, focus.index).forEach((step) => {
    setGroup(step.svgGroupId, OPACITY.completed);
    setGroup(step.arrowGroupId, OPACITY.completed);
  });
  if (active) {
    setGroup(journey.layerBands[active.layer], OPACITY.full);
    setGroup(active.svgGroupId, OPACITY.full);
    setGroup(active.arrowGroupId, OPACITY.full);
  }
  journey.alwaysDimmed.forEach((id) => setGroup(id, OPACITY.dim));
  return targets;
}

export function DiagramStage({ svg, viewBox, layout, frameWidth, journey, focus, label, onSelectStep }: DiagramStageProps) {
  const selectable = Boolean(onSelectStep);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<FadeModel>({ units: [], layerOf: new Map() });
  const drawnStepRef = useRef<number | null>(null);
  const viewRef = useRef<DiagramView | null>(null);
  const targetRef = useRef<DiagramView | null>(null);
  const controlsRef = useRef<AnimationPlaybackControls | null>(null);
  const lastLayoutRef = useRef<string | null>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const markup = useMemo(() => ({ __html: svg }), [svg]);
  const metrics = useScrollMetrics(scrollerRef, canvasRef, layout.compact);
  const focusKey = focus.kind === 'layer' ? `layer:${focus.layer}` : focus.kind === 'step' ? `step:${focus.index}${focus.zoomOut ? ':out' : ''}` : focus.kind === 'steps' ? `steps:${focus.indices.join(',')}` : 'full';
  const aspect = viewBox.width / viewBox.height;

  const applyView = (view: DiagramView) => {
    const canvas = canvasRef.current;
    const scroller = scrollerRef.current;
    if (!canvas || !scroller) return;
    canvas.style.width = `${view.width}px`;
    canvas.style.height = `${view.width / aspect}px`;
    canvas.style.marginLeft = `${Math.max(0, (frameWidth - view.width) / 2)}px`;
    canvas.style.transform = `translateY(${view.y}px)`;
    scroller.scrollLeft = view.scrollLeft;
    scroller.scrollTop = view.scrollTop ?? 0;
    viewRef.current = view;
  };

  useLayoutEffect(() => {
    const root = canvasRef.current?.querySelector('svg');
    if (!root) return;
    root.setAttribute('aria-hidden', 'true');
    modelRef.current = buildFadeModel(root, journey);
    drawnStepRef.current = null;
    journey.steps.forEach((step) => {
      const group = findGroup(root, step.svgGroupId);
      if (group) group.style.cursor = selectable ? 'pointer' : '';
    });
  }, [markup, journey, selectable]);

  useEffect(() => {
    const root = canvasRef.current?.querySelector('svg');
    if (!root) return;

    focusTargets(root, modelRef.current, journey, focus).forEach((opacity, el) => fadeTo(el, opacity, reduceMotion));

    const stepIndex = focus.kind === 'step' ? focus.index : null;
    if (stepIndex !== null && drawnStepRef.current !== stepIndex) {
      const arrow = findGroup(root, journey.steps[stepIndex]?.arrowGroupId);
      if (arrow) drawArrow(arrow, reduceMotion);
    }
    drawnStepRef.current = stepIndex;
    // focusKey captures every change to focus that matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, journey, reduceMotion, markup]);

  useLayoutEffect(() => {
    const root = canvasRef.current?.querySelector('svg');
    const scroller = scrollerRef.current;
    if (!root || !scroller) return;

    const target = computeView({ root, viewBox, layout, frameWidth, journey, focus });
    targetRef.current = target;

    const layoutKey = `${layout.width}x${layout.height}x${frameWidth}`;
    const resized = lastLayoutRef.current !== layoutKey;
    lastLayoutRef.current = layoutKey;

    controlsRef.current?.stop();
    if (resized || reduceMotion || !viewRef.current) {
      applyView(target);
      return;
    }

    const from = { ...viewRef.current, scrollLeft: scroller.scrollLeft, scrollTop: scroller.scrollTop };
    const controls = animate(0, 1, {
      ...PAN,
      onUpdate: (t) => applyView(lerpView(from, target, t)),
      onComplete: () => {
        controlsRef.current = null;
      },
    });
    controlsRef.current = controls;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, journey, layout, frameWidth, viewBox, reduceMotion, markup]);

  // A swipe always wins over automatic panning: stop the pan, settle the zoom, keep the viewer's position.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!(layout.compact || layout.portrait) || !scroller) return;
    const interrupt = () => {
      if (!controlsRef.current) return;
      controlsRef.current.stop();
      controlsRef.current = null;
      if (targetRef.current) {
        applyView({ ...targetRef.current, scrollLeft: scroller.scrollLeft, scrollTop: scroller.scrollTop });
      }
    };
    scroller.addEventListener('touchstart', interrupt, { passive: true });
    scroller.addEventListener('pointerdown', interrupt);
    scroller.addEventListener('wheel', interrupt, { passive: true });
    return () => {
      scroller.removeEventListener('touchstart', interrupt);
      scroller.removeEventListener('pointerdown', interrupt);
      scroller.removeEventListener('wheel', interrupt);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout.compact, layout.portrait, frameWidth, aspect]);

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!onSelectStep) return;
    let node = event.target instanceof Element ? event.target : null;
    while (node && node !== event.currentTarget) {
      const index = node.id ? journey.steps.findIndex((step) => step.svgGroupId === node!.id) : -1;
      if (index >= 0) {
        onSelectStep(index);
        return;
      }
      node = node.parentElement;
    }
  };

  return (
    <div role="img" aria-label={label} className="diagram-stage w-full" onClick={handleClick}>
      <div className="relative" style={{ height: layout.height }}>
        <div
          ref={scrollerRef}
          className={`h-full w-full ${
            layout.portrait
              ? 'no-scrollbar overflow-auto [overflow-anchor:none]'
              : layout.compact
                ? 'no-scrollbar overflow-x-auto overflow-y-hidden overscroll-x-contain'
                : 'overflow-hidden'
          }`}
        >
          <div ref={canvasRef} dangerouslySetInnerHTML={markup} />
        </div>
        {layout.compact && <DiagramEdgeCues metrics={metrics} />}
      </div>
      {layout.compact && <DiagramProgressBar metrics={metrics} />}
    </div>
  );
}
