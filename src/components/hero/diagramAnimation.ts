import { curve, type DiagramLayout } from '@/components/hero/diagramLayout';

const SVG_NS = 'http://www.w3.org/2000/svg';
const LOAD_END = 6;
const BUILT_START = 1;
const BUILT_END = 3;
const CROSS_END = 3.3;
const GROWN_START = 3.5;
const GROWN_END = 5.35;
const PULSE_EASE = 2.2;
const AMBIENT_PULSE_DUR = 2.8;
const AMBIENT_STEP = 0.26;
const MAX_FAINT_BRANCHES = 9;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const progress = (t: number, start: number, dur: number) => clamp01((t - start) / dur);
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const randBetween = (a: number, b: number) => a + Math.random() * (b - a);

interface Stroke {
  el: SVGElement;
  len: number;
}

function prepStroke(el: SVGElement, len: number): Stroke {
  el.style.strokeDasharray = `${len} ${len}`;
  el.style.strokeDashoffset = `${len}`;
  return { el, len };
}

function draw(s: Stroke, f: number) {
  s.el.style.strokeDashoffset = `${s.len * (1 - f)}`;
}

function all<T extends Element>(root: Element, selector: string) {
  return Array.from(root.querySelectorAll<T>(selector));
}

function one<T extends Element>(root: Element, selector: string) {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Diagram element missing: ${selector}`);
  return el;
}

interface Highlight {
  stroke: Stroke;
  start: number;
}

interface HighlightNode {
  el: SVGCircleElement;
  start: number;
}

interface AmbientCycle {
  start: number;
  cross: number;
  end: number;
  edges: Highlight[];
  nodes: HighlightNode[];
  branchesSpawned: boolean;
}

interface FaintBranch {
  group: SVGGElement;
  stroke: Stroke;
  tip: SVGCircleElement;
  born: number;
  dyingAt: number | null;
}

export function animateDiagram(svg: SVGSVGElement, layout: DiagramLayout): () => void {
  const c = layout.config;
  const qx = layout.questionDotX;
  const lastX = c.colX[c.colX.length - 1];

  const gridLines = all<SVGPathElement>(svg, '[data-grid-line]').map((el) =>
    prepStroke(el, Number(el.dataset.gridLine) + 2),
  );
  const gridNodes = all<SVGRectElement>(svg, '[data-grid-node]');
  const litNodes = all<SVGRectElement>(svg, '[data-lit-node]');
  const litLabels = all<SVGTextElement>(svg, '[data-lit-label]');
  const dashLine = one<SVGLineElement>(svg, '[data-dash-line]');
  const trail = prepStroke(one<SVGPathElement>(svg, '[data-trail]'), c.fanX - qx + 2);
  const pulse = one<SVGCircleElement>(svg, '[data-pulse]');
  const ambientPulse = one<SVGCircleElement>(svg, '[data-ambient-pulse]');
  const grownEdges = all<SVGPathElement>(svg, '[data-grown-edge]').map((el, i) =>
    prepStroke(el, layout.grownEdges[i].len),
  );
  const grownNodes = all<SVGCircleElement>(svg, '[data-grown-node]');
  const converge = all<SVGPathElement>(svg, '[data-converge]').map((el, i) =>
    prepStroke(el, layout.convergeEdges[i].len),
  );
  const branchesGroup = one<SVGGElement>(svg, '[data-ambient-branches]');
  const highlightsGroup = one<SVGGElement>(svg, '[data-ambient-highlights]');
  const rayHalo = one<SVGCircleElement>(svg, '[data-ray-halo]');
  const rayDot = one<SVGCircleElement>(svg, '[data-ray-dot]');
  const rayText = one<SVGTextElement>(svg, '[data-ray-text]');

  const pulseR = Number(pulse.getAttribute('r'));
  const haloR = Number(rayHalo.getAttribute('r'));
  const cols = c.colX.length;

  const pulseXAt = (t: number) => {
    if (t <= BUILT_START) return qx;
    if (t <= BUILT_END) {
      const p = (t - BUILT_START) / (BUILT_END - BUILT_START);
      return qx + (lastX - qx) * Math.pow(p, PULSE_EASE);
    }
    return lastX + (c.fanX - lastX) * progress(t, BUILT_END, CROSS_END - BUILT_END);
  };

  const litAt = c.colX.map((x) => {
    const threshold = x - c.nodeW / 2;
    const p = Math.pow((threshold - qx) / (lastX - qx), 1 / PULSE_EASE);
    return BUILT_START + p * (BUILT_END - BUILT_START);
  });

  const edgeStart: number[] = [];
  const edgeDur: number[] = [];
  const nodeArrival = new Array<number>(layout.grownNodes.length).fill(Infinity);
  layout.grownEdges.forEach((e, i) => {
    const from = e.from === -1 ? GROWN_START : nodeArrival[e.from];
    edgeStart[i] = from + Math.random() * 0.12;
    edgeDur[i] = 0.12 + Math.random() * 0.12;
    nodeArrival[e.to] = Math.min(nodeArrival[e.to], edgeStart[i] + edgeDur[i]);
  });
  const latest = Math.max(...nodeArrival);
  const scale = (GROWN_END - GROWN_START) / (latest - GROWN_START);
  edgeStart.forEach((s, i) => {
    edgeStart[i] = GROWN_START + (s - GROWN_START) * scale;
    edgeDur[i] *= scale;
  });
  const nodeLight = nodeArrival.map((a) => GROWN_START + (a - GROWN_START) * scale + Math.random() * 0.1);

  const renderLoad = (t: number) => {
    gridLines.forEach((s, i) => draw(s, easeOut(progress(t, 0.05 + i * 0.035, 0.4))));
    gridNodes.forEach((el, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      el.style.opacity = `${progress(t, 0.45 + (row + col) * 0.035, 0.2)}`;
    });
    dashLine.style.opacity = `${progress(t, 0.4, 0.6)}`;

    const x = pulseXAt(t);
    draw(trail, t < BUILT_START ? 0 : (x - qx) / (c.fanX - qx));
    pulse.setAttribute('cx', `${x}`);
    const swell = progress(t, CROSS_END, GROWN_START - CROSS_END);
    pulse.setAttribute('r', `${pulseR * (1 + swell * 0.6)}`);
    pulse.style.opacity = `${progress(t, BUILT_START, 0.15) * (1 - progress(t, GROWN_START, 0.15))}`;

    litNodes.forEach((el, i) => (el.style.opacity = `${progress(t, litAt[i], 0.25)}`));
    litLabels.forEach((el, i) => (el.style.opacity = `${progress(t, litAt[i], 0.4)}`));

    grownEdges.forEach((s, i) => draw(s, progress(t, edgeStart[i], edgeDur[i])));
    grownNodes.forEach((el, i) => {
      el.style.opacity = `${layout.grownNodes[i].opacity * progress(t, nodeLight[i], 0.2)}`;
    });

    converge.forEach((s, i) => draw(s, easeOut(progress(t, 5.5 + i * 0.04, 0.35))));
    rayDot.style.opacity = `${0.25 + 0.75 * progress(t, 5.6, 0.35)}`;
    const flare = progress(t, 5.6, 0.25) - progress(t, 5.85, 0.25);
    rayHalo.style.opacity = `${0.05 + 0.13 * progress(t, 5.6, 0.25) + 0.24 * flare}`;
    rayHalo.setAttribute('r', `${haloR * (1 + flare * 0.6)}`);
    rayText.style.opacity = `${progress(t, 5.65, 0.35)}`;
  };

  const outgoing = new Map<number, number[]>();
  layout.grownEdges.forEach((e, i) => {
    const list = outgoing.get(e.from) ?? [];
    list.push(i);
    outgoing.set(e.from, list);
  });
  const seenPatterns = new Set<string>();

  const pickPattern = () => {
    let depths = new Map<number, number>();
    for (let attempt = 0; attempt < 10; attempt++) {
      depths = new Map();
      const walks = 5 + Math.floor(Math.random() * 4);
      for (let w = 0; w < walks; w++) {
        let node = -1;
        for (let depth = 0; ; depth++) {
          const options = outgoing.get(node);
          if (!options || (depth > 3 && Math.random() < 0.12)) break;
          const edge = options[Math.floor(Math.random() * options.length)];
          depths.set(edge, Math.min(depths.get(edge) ?? Infinity, depth));
          node = layout.grownEdges[edge].to;
        }
      }
      const signature = [...depths.keys()].sort((a, b) => a - b).join(',');
      if (!seenPatterns.has(signature)) {
        seenPatterns.add(signature);
        break;
      }
    }
    return depths;
  };

  const startCycle = (now: number): AmbientCycle => {
    const cross = now + AMBIENT_PULSE_DUR;
    const edges: Highlight[] = [];
    const nodes: HighlightNode[] = [];
    pickPattern().forEach((depth, edgeIdx) => {
      const data = layout.grownEdges[edgeIdx];
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', data.d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-width', `${c.stroke * 1.15}`);
      path.style.opacity = '0';
      highlightsGroup.appendChild(path);
      const start = cross + depth * AMBIENT_STEP + Math.random() * 0.08;
      edges.push({ stroke: prepStroke(path, data.len), start });

      const target = layout.grownNodes[data.to];
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', `${target.x}`);
      dot.setAttribute('cy', `${target.y}`);
      dot.setAttribute('r', `${target.r * 1.2}`);
      dot.setAttribute('stroke', 'none');
      dot.style.opacity = '0';
      highlightsGroup.appendChild(dot);
      nodes.push({ el: dot, start: start + 0.3 });
    });
    const lastStart = Math.max(cross, ...edges.map((e) => e.start));
    return { start: now, cross, end: lastStart + 3, edges, nodes, branchesSpawned: false };
  };

  const endCycle = (cycle: AmbientCycle) => {
    cycle.edges.forEach((h) => h.stroke.el.remove());
    cycle.nodes.forEach((n) => n.el.remove());
  };

  const faintBranches: FaintBranch[] = [];
  const spawnBranches = (now: number) => {
    const candidates = layout.grownNodes.filter((n) => n.layer >= 2 && n.x < c.width - 20);
    for (let i = 0; i < 3; i++) {
      const from = candidates[Math.floor(Math.random() * candidates.length)];
      const toX = from.x + randBetween(35, 90);
      const toY = Math.min(c.height - 20, Math.max(20, from.y + randBetween(-70, 70)));
      const seg = curve(from.x, from.y, toX, toY);
      const group = document.createElementNS(SVG_NS, 'g');
      group.style.opacity = '0.4';
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', seg.d);
      const tip = document.createElementNS(SVG_NS, 'circle');
      tip.setAttribute('cx', `${toX}`);
      tip.setAttribute('cy', `${toY}`);
      tip.setAttribute('r', `${from.r * 0.8}`);
      tip.setAttribute('fill', branchesGroup.getAttribute('stroke') ?? 'none');
      tip.setAttribute('stroke', 'none');
      tip.style.opacity = '0';
      group.append(path, tip);
      branchesGroup.appendChild(group);
      faintBranches.push({ group, stroke: prepStroke(path, seg.len), tip, born: now, dyingAt: null });
    }
    const alive = faintBranches.filter((b) => b.dyingAt === null);
    alive.slice(0, Math.max(0, alive.length - MAX_FAINT_BRANCHES)).forEach((b) => (b.dyingAt = now));
  };

  const renderBranches = (t: number) => {
    for (let i = faintBranches.length - 1; i >= 0; i--) {
      const b = faintBranches[i];
      const grow = easeOut(progress(t, b.born, 2.2));
      draw(b.stroke, grow);
      b.tip.style.opacity = `${progress(t, b.born + 1.8, 0.5)}`;
      if (b.dyingAt !== null) {
        const fade = progress(t, b.dyingAt, 2.5);
        b.group.style.opacity = `${0.4 * (1 - fade)}`;
        if (fade >= 1) {
          b.group.remove();
          faintBranches.splice(i, 1);
        }
      }
    }
  };

  const renderCycle = (cycle: AmbientCycle, t: number) => {
    const p = progress(t, cycle.start, AMBIENT_PULSE_DUR);
    ambientPulse.setAttribute('cx', `${qx + (c.fanX - qx) * p}`);
    ambientPulse.style.opacity = `${0.5 * progress(t, cycle.start, 0.3) * (1 - progress(t, cycle.cross - 0.1, 0.3))}`;

    cycle.edges.forEach((h) => {
      draw(h.stroke, progress(t, h.start, 0.3));
      h.stroke.el.style.opacity = `${0.55 * progress(t, h.start, 0.05) * (1 - progress(t, h.start + 1.4, 1.2))}`;
    });
    cycle.nodes.forEach((n) => {
      n.el.style.opacity = `${0.7 * progress(t, n.start, 0.2) * (1 - progress(t, n.start + 1.1, 1.2))}`;
    });

    if (!cycle.branchesSpawned && t >= cycle.cross + 0.6) {
      cycle.branchesSpawned = true;
      spawnBranches(t);
    }
  };

  let clock = 0;
  let last: number | null = null;
  let raf = 0;
  let running = false;
  let loadDone = false;
  let cycle: AmbientCycle | null = null;
  let nextCycle = LOAD_END + randBetween(8, 10);

  const render = (t: number) => {
    if (!loadDone) {
      renderLoad(Math.min(t, LOAD_END + 0.5));
      loadDone = t >= LOAD_END + 0.5;
      return;
    }
    if (!cycle && t >= nextCycle) cycle = startCycle(t);
    if (cycle) {
      renderCycle(cycle, t);
      if (t >= cycle.end) {
        endCycle(cycle);
        nextCycle = Math.max(t, cycle.start + randBetween(8, 10));
        cycle = null;
      }
    }
    renderBranches(t);
  };

  const frame = (ts: number) => {
    if (last !== null) clock += Math.min(0.05, (ts - last) / 1000);
    last = ts;
    render(clock);
    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (running) return;
    running = true;
    last = null;
    raf = requestAnimationFrame(frame);
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  renderLoad(0);

  const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
  observer.observe(svg);

  return () => {
    stop();
    observer.disconnect();
    if (cycle) endCycle(cycle);
    faintBranches.forEach((b) => b.group.remove());
    const touched: SVGElement[] = [
      ...gridLines.map((s) => s.el),
      ...gridNodes,
      ...litNodes,
      ...litLabels,
      dashLine,
      trail.el,
      pulse,
      ambientPulse,
      ...grownEdges.map((s) => s.el),
      ...grownNodes,
      ...converge.map((s) => s.el),
      rayHalo,
      rayDot,
      rayText,
    ];
    touched.forEach((el) => {
      el.style.removeProperty('opacity');
      el.style.removeProperty('stroke-dasharray');
      el.style.removeProperty('stroke-dashoffset');
    });
    pulse.setAttribute('cx', `${qx}`);
    pulse.setAttribute('r', `${pulseR}`);
    ambientPulse.setAttribute('cx', `${qx}`);
    rayHalo.setAttribute('r', `${haloR}`);
  };
}
