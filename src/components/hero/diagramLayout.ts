export type DiagramVariant = 'desktop' | 'mobile';

interface VariantConfig {
  width: number;
  height: number;
  colX: number[];
  rowStart: number;
  rowGap: number;
  rows: number;
  litRow: number;
  nodeW: number;
  nodeH: number;
  labelSize: number;
  questionSize: number;
  zoneLabelSize: number;
  staggerLabels: boolean;
  questionEndX: number;
  dashX: number;
  fanX: number;
  rayX: number;
  rayTextBelow: boolean;
  grownLabelX: number;
  grownLayers: number;
  grownMaxNodes: number;
  grownSpread: number;
  stroke: number;
  seed: number;
}

const CONFIGS: Record<DiagramVariant, VariantConfig> = {
  desktop: {
    width: 1000,
    height: 620,
    colX: [190, 290, 390, 490],
    rowStart: 100,
    rowGap: 56,
    rows: 8,
    litRow: 4,
    nodeW: 34,
    nodeH: 16,
    labelSize: 13,
    questionSize: 16,
    zoneLabelSize: 12,
    staggerLabels: false,
    questionEndX: 140,
    dashX: 560,
    fanX: 585,
    rayX: 905,
    rayTextBelow: false,
    grownLabelX: 690,
    grownLayers: 9,
    grownMaxNodes: 17,
    grownSpread: 285,
    stroke: 1.1,
    seed: 7,
  },
  mobile: {
    width: 760,
    height: 480,
    colX: [170, 262, 354, 446],
    rowStart: 120,
    rowGap: 64,
    rows: 5,
    litRow: 2,
    nodeW: 36,
    nodeH: 18,
    labelSize: 19,
    questionSize: 21,
    zoneLabelSize: 17,
    staggerLabels: true,
    questionEndX: 120,
    dashX: 495,
    fanX: 512,
    rayX: 690,
    rayTextBelow: true,
    grownLabelX: 600,
    grownLayers: 6,
    grownMaxNodes: 10,
    grownSpread: 195,
    stroke: 1.8,
    seed: 11,
  },
};

const LIT_LABELS = ['Network card', 'Grace CPU', 'NVLink-C2C', 'GPUs'];

export interface GridNode {
  x: number;
  y: number;
  lit: boolean;
  label?: string;
  labelAbove?: boolean;
}

export interface CurveSegment {
  d: string;
  len: number;
}

export interface GrownEdge extends CurveSegment {
  opacity: number;
  from: number;
  to: number;
}

export interface GrownNode {
  x: number;
  y: number;
  r: number;
  opacity: number;
  layer: number;
}

export interface DiagramLayout {
  config: VariantConfig;
  centerY: number;
  rowY: number[];
  gridNodes: GridNode[];
  questionDotX: number;
  grownEdges: GrownEdge[];
  grownNodes: GrownNode[];
  convergeEdges: CurveSegment[];
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function curve(x1: number, y1: number, x2: number, y2: number): CurveSegment {
  const mx = (x1 + x2) / 2;
  const d = `M${x1.toFixed(1)} ${y1.toFixed(1)}C${mx.toFixed(1)} ${y1.toFixed(1)} ${mx.toFixed(1)} ${y2.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  let len = 0;
  let px = x1;
  let py = y1;
  for (let i = 1; i <= 16; i++) {
    const t = i / 16;
    const u = 1 - t;
    const x = u * u * u * x1 + 3 * u * t * mx + t * t * t * x2;
    const y = (u * u * u + 3 * u * u * t) * y1 + (3 * u * t * t + t * t * t) * y2;
    len += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return { d, len: len * 1.02 + 1 };
}

function fadeAt(x: number, c: VariantConfig) {
  const start = c.rayX - 40;
  const end = c.width + 40;
  if (x <= start) return 1;
  return Math.max(0.08, 1 - ((x - start) / (end - start)) * 0.92);
}

function buildGrown(c: VariantConfig, cy: number) {
  const rand = mulberry32(c.seed);
  const endX = c.width + 40;
  const layers: { x: number; y: number }[][] = [[{ x: c.fanX, y: cy }]];

  for (let k = 1; k <= c.grownLayers; k++) {
    const t = k / c.grownLayers;
    const x = c.fanX + (endX - c.fanX) * Math.pow(t, 0.85);
    const count = Math.min(c.grownMaxNodes, 3 + Math.round(k * 2.6));
    const spread = c.grownSpread * (1 - Math.pow(1 - t, 2.2));
    const step = count > 1 ? (spread * 2) / (count - 1) : 0;
    const layer: { x: number; y: number }[] = [];
    for (let i = 0; i < count; i++) {
      const baseY = count > 1 ? cy - spread + i * step : cy;
      layer.push({
        x: x + (rand() - 0.5) * 18,
        y: baseY + (rand() - 0.5) * step * 0.7,
      });
    }
    layers.push(layer);
  }

  const offsets: number[] = [-1];
  let total = 0;
  for (let k = 1; k < layers.length; k++) {
    offsets.push(total);
    total += layers[k].length;
  }
  const nodeIndex = (k: number, i: number) => (k === 0 ? -1 : offsets[k] + i);

  const edges: GrownEdge[] = [];
  for (let k = 1; k < layers.length; k++) {
    const prev = layers[k - 1];
    const cur = layers[k];
    const incoming = new Array(cur.length).fill(false);
    const link = (a: { x: number; y: number }, j: number) => {
      const b = cur[j];
      incoming[j] = true;
      const midX = (a.x + b.x) / 2;
      edges.push({
        ...curve(a.x, a.y, b.x, b.y),
        opacity: fadeAt(midX, c) * (0.55 + rand() * 0.45),
        from: nodeIndex(k - 1, prev.indexOf(a)),
        to: nodeIndex(k, j),
      });
    };

    prev.forEach((a, i) => {
      if (prev.length === 1) {
        cur.forEach((_, j) => link(a, j));
        return;
      }
      const j0 = Math.round((i / (prev.length - 1)) * (cur.length - 1));
      link(a, j0);
      const spreadOut = Math.max(1, Math.round(rand() * 2));
      const j1 = Math.min(cur.length - 1, Math.max(0, j0 + (rand() > 0.5 ? spreadOut : -spreadOut)));
      if (j1 !== j0) link(a, j1);
      if (rand() > 0.65) {
        const j2 = Math.min(cur.length - 1, Math.max(0, j0 + (j1 > j0 ? -1 : 1)));
        if (j2 !== j0 && j2 !== j1) link(a, j2);
      }
    });

    incoming.forEach((has, j) => {
      if (has) return;
      const i = Math.round((j / (cur.length - 1)) * (prev.length - 1));
      link(prev[i], j);
    });
  }

  const nodes: GrownNode[] = layers.slice(1).flatMap((layer, k) =>
    layer.map((p) => ({
      x: p.x,
      y: p.y,
      r: (c.stroke + 1.2) * (0.8 + rand() * 0.6),
      opacity: fadeAt(p.x, c),
      layer: k + 1,
    })),
  );

  const feeder = layers
    .slice(1)
    .filter((layer) => layer[0].x < c.rayX - 50)
    .pop();
  const convergeEdges = (feeder ?? [])
    .slice()
    .sort((a, b) => Math.abs(a.y - cy) - Math.abs(b.y - cy))
    .slice(0, 6)
    .map((p) => curve(p.x, p.y, c.rayX, cy));

  return { edges, nodes, convergeEdges };
}

export function buildLayout(variant: DiagramVariant): DiagramLayout {
  const c = CONFIGS[variant];
  const rowY = Array.from({ length: c.rows }, (_, i) => c.rowStart + i * c.rowGap);
  const centerY = rowY[c.litRow];

  const gridNodes: GridNode[] = rowY.flatMap((y, r) =>
    c.colX.map((x, col) => {
      const lit = r === c.litRow;
      return {
        x,
        y,
        lit,
        label: lit ? LIT_LABELS[col] : undefined,
        labelAbove: lit ? !c.staggerLabels || col % 2 === 0 : undefined,
      };
    }),
  );

  const grown = buildGrown(c, centerY);

  return {
    config: c,
    centerY,
    rowY,
    gridNodes,
    questionDotX: c.questionEndX + 13,
    grownEdges: grown.edges,
    grownNodes: grown.nodes,
    convergeEdges: grown.convergeEdges,
  };
}
