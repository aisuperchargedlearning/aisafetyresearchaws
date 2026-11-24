import source from '@/assets/hardware/gb200-board.svg?raw';
import { HARDWARE_AUDIO } from '@/config/media';

const artwork = new DOMParser().parseFromString(source, 'image/svg+xml');
const svg = artwork.documentElement;

// Defence in depth: the markup is injected as raw HTML, so never let scripts or inline handlers through.
svg.querySelectorAll('script, foreignObject').forEach((node) => node.remove());
svg.querySelectorAll('*').forEach((node) => {
  for (const attr of [...node.attributes]) {
    if (attr.name.toLowerCase().startsWith('on')) node.removeAttribute(attr.name);
  }
});

export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
  transform?: string;
  'data-component'?: string;
}

export interface Topic {
  id: string;
  name: string;
  audioUrl: string;
  color: string;
  regions: Region[];
  paths?: string[];
}

// Use the existing artwork as the coordinate source for the interactive layer.
function rectangles(selector: string, adjust: Partial<Region> = {}): Region[] {
  return [...svg.querySelectorAll(selector)].map((element) => {
    const [x, y, width, height, rx] = ['x', 'y', 'width', 'height', 'rx'].map((name) =>
      Number(element.getAttribute(name)),
    );

    return {
      x,
      y,
      width,
      height,
      rx,
      transform: element.parentElement?.getAttribute('transform') ?? undefined,
      ...adjust,
    };
  });
}

function label(id: string) {
  return rectangles(`#label-${id} > rect`);
}

const nvlinkColor = '#a7ec62';
const gpuColor = '#ffd36c';
const memoryColor = '#ce9bfa';
const ioColor = '#80c7ff';

// The artwork uses a grid overlay for the central dies and 34-unit rectangles for the outer HBM stacks.
const processorDie = 'rect[fill="url(#grid)"]';
const memoryStack = 'rect[width="34"][fill="url(#die)"]';

const audio = (id: string) => HARDWARE_AUDIO[id] ?? '';

export const topics: Topic[] = [
  {
    id: 'intro',
    name: 'Introduction',
    audioUrl: audio('intro'),
    color: 'var(--muted)',
    regions: [],
  },
  {
    id: 'power',
    name: 'Power sockets',
    audioUrl: audio('power'),
    color: ioColor,
    regions: [...rectangles('#power-sockets > rect[y="908"]'), ...label('power')],
  },
  {
    id: 'firmware',
    name: 'Firmware & Boot Initialization',
    audioUrl: audio('firmware'),
    color: svg.querySelector('#firmware-annotations')?.getAttribute('color') ?? ioColor,
    regions: [
      ...rectangles('#firmware-blackwell > rect', { 'data-component': 'firmware-blackwell' }),
      ...rectangles('#firmware-grace > rect', { 'data-component': 'firmware-grace' }),
    ],
  },
  {
    id: 'mcio',
    name: 'High-speed I/O (MCIO)',
    audioUrl: audio('mcio'),
    color: ioColor,
    regions: [...rectangles('#mcio-ports > rect[height="160"]', { height: 170 }), ...label('mcio')],
  },
  {
    id: 'grace',
    name: 'Grace CPU',
    audioUrl: audio('grace'),
    color: '#ff8984',
    regions: [...rectangles('#grace-cpu > rect[width="228"]'), ...label('cpu')],
  },
  {
    id: 'lpddr',
    name: 'LPDDR5X System Memory',
    audioUrl: audio('lpddr'),
    color: memoryColor,
    regions: [
      ...rectangles('#lpddr5x > rect[x="425"][y="408"]', {
        width: 136,
        height: 194,
        'data-component': 'lpddr-left',
      }),
      ...label('lpddr-left'),
      ...rectangles('#lpddr5x > rect[x="890"][y="408"]', {
        width: 136,
        height: 194,
        'data-component': 'lpddr-right',
      }),
      ...label('lpddr-right'),
    ],
  },
  {
    id: 'c2c',
    name: 'NVLink-C2C',
    audioUrl: audio('c2c'),
    color: nvlinkColor,
    regions: label('c2c'),
    paths: ['M502 690 V632 H579', 'M869 632 H945 V690'],
  },
  {
    id: 'gpu',
    name: 'Blackwell GPUs',
    audioUrl: audio('gpu'),
    color: gpuColor,
    regions: [
      ...rectangles(`#gpu-left > ${processorDie}`, { 'data-component': 'gpu-left' }),
      ...rectangles(`#gpu-right > ${processorDie}`, { 'data-component': 'gpu-right' }),
      ...label('gpu'),
    ],
  },
  {
    id: 'hbm',
    name: 'GPU memory (HBM3e)',
    audioUrl: audio('hbm'),
    color: ioColor,
    regions: [...rectangles(`#gpu-left > ${memoryStack}, #gpu-right > ${memoryStack}`), ...label('hbm')],
  },
  {
    id: 'nvlink',
    name: 'NVLink',
    audioUrl: audio('nvlink'),
    color: nvlinkColor,
    regions: [...rectangles('#nvlink-connectors > rect[width="210"]', { height: 90 }), ...label('nvlink')],
  },
];

svg.querySelector('metadata')?.remove();
const boardGroup = svg.querySelector('g[id="board"]');
if (boardGroup) boardGroup.id = 'board-outline';

export const viewBox = svg.getAttribute('viewBox') ?? '0 0 1448 1800';
export const boardMarkup = Array.from(svg.children, (element) => element.outerHTML).join('');
