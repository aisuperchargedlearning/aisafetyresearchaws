import { useLayoutEffect, useMemo, useRef } from 'react';
import { animateDiagram } from '@/components/hero/diagramAnimation';
import { buildLayout, type DiagramVariant } from '@/components/hero/diagramLayout';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const LIME = '#a3e635';
const LIME_BRIGHT = '#e4fbb8';
const BG = '#0a0d0a';
const ARIA_LABEL =
  'A question travels through a regular, labeled grid of hardware, then crosses into a branching, untraceable network before arriving at a correct answer.';

interface HeroDiagramProps {
  variant: DiagramVariant;
  className?: string;
}

export default function HeroDiagram({ variant, className }: HeroDiagramProps) {
  const layout = useMemo(() => buildLayout(variant), [variant]);
  const svgRef = useRef<SVGSVGElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (reducedMotion || !svgRef.current) return;
    return animateDiagram(svgRef.current, layout);
  }, [layout, reducedMotion]);
  const { config: c, centerY: cy, rowY, gridNodes } = layout;
  const glowId = `hero-glow-${variant}`;
  const softGlowId = `hero-soft-glow-${variant}`;
  const firstX = c.colX[0];
  const lastX = c.colX[c.colX.length - 1];
  const topY = rowY[0];
  const bottomY = rowY[rowY.length - 1];
  const textHalo = { stroke: BG, strokeWidth: c.labelSize * 0.45, paintOrder: 'stroke' as const, strokeLinejoin: 'round' as const };

  return (
    <svg
      ref={svgRef}
      role="img"
      aria-label={ARIA_LABEL}
      viewBox={`0 0 ${c.width} ${c.height}`}
      preserveAspectRatio="xMinYMid meet"
      className={className}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={c.stroke * 2.6} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={softGlowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={c.stroke * 1.6} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <text
        x={c.questionEndX}
        textAnchor="end"
        fill="#ffffff"
        fontStyle="italic"
        fontWeight={500}
        fontSize={c.questionSize}
      >
        <tspan x={c.questionEndX} y={cy - c.questionSize * 0.45}>
          Why is the
        </tspan>
        <tspan x={c.questionEndX} y={cy + c.questionSize * 0.85}>
          sky blue?
        </tspan>
      </text>

      <g stroke="rgba(255,255,255,0.42)" strokeWidth={c.stroke} fill="none">
        {rowY.map((y) => (
          <path key={`h${y}`} data-grid-line={lastX - firstX} d={`M${firstX} ${y}H${lastX}`} />
        ))}
        {c.colX.map((x) => (
          <path key={`v${x}`} data-grid-line={bottomY - topY} d={`M${x} ${topY}V${bottomY}`} />
        ))}
      </g>

      <line
        data-dash-line
        x1={c.dashX}
        y1={topY - 60}
        x2={c.dashX}
        y2={bottomY + 60}
        stroke="rgba(255,255,255,0.32)"
        strokeWidth={c.stroke}
        strokeDasharray={`${c.stroke * 4} ${c.stroke * 5}`}
      />

      <path
        data-trail
        d={`M${layout.questionDotX} ${cy}H${c.fanX}`}
        stroke={LIME}
        strokeWidth={c.stroke * 2.2}
        fill="none"
        filter={`url(#${glowId})`}
      />
      <circle cx={layout.questionDotX} cy={cy} r={c.stroke * 3.2} fill={LIME} filter={`url(#${glowId})`} />

      <g>
        {gridNodes.map((n) => (
          <rect
            key={`${n.x}-${n.y}`}
            data-grid-node
            x={n.x - c.nodeW / 2}
            y={n.y - c.nodeH / 2}
            width={c.nodeW}
            height={c.nodeH}
            rx={1.5}
            fill={BG}
            stroke="rgba(255,255,255,0.72)"
            strokeWidth={c.stroke}
          />
        ))}
        {gridNodes
          .filter((n) => n.lit)
          .map((n) => (
            <rect
              key={`lit-${n.x}`}
              data-lit-node
              x={n.x - c.nodeW / 2}
              y={n.y - c.nodeH / 2}
              width={c.nodeW}
              height={c.nodeH}
              rx={1.5}
              fill="rgba(163,230,53,0.28)"
              stroke={LIME}
              strokeWidth={c.stroke * 1.8}
              filter={`url(#${glowId})`}
            />
          ))}
      </g>

      <g fill="#ffffff" fontSize={c.labelSize} fontWeight={500} textAnchor="middle" style={textHalo}>
        {gridNodes
          .filter((n) => n.label)
          .map((n) => (
            <text
              key={n.label}
              data-lit-label
              x={n.x}
              y={n.labelAbove ? n.y - c.nodeH / 2 - c.labelSize * 0.6 : n.y + c.nodeH / 2 + c.labelSize * 1.25}
            >
              {n.label}
            </text>
          ))}
      </g>

      <g
        fill="#8b9088"
        fontSize={c.zoneLabelSize}
        fontWeight={500}
        letterSpacing={c.zoneLabelSize * 0.32}
        textAnchor="middle"
      >
        <text x={(firstX + lastX) / 2} y={bottomY + 58}>
          BUILT
        </text>
        <text x={c.grownLabelX} y={topY - 46}>
          GROWN
        </text>
      </g>

      <g opacity={0.75} filter={`url(#${softGlowId})`}>
        <g stroke={LIME} strokeWidth={c.stroke} fill="none" strokeLinecap="round">
          {layout.grownEdges.map((e, i) => (
            <path key={i} data-grown-edge d={e.d} opacity={e.opacity * 0.85} />
          ))}
          {layout.convergeEdges.map((e, i) => (
            <path
              key={`c${i}`}
              data-converge
              d={e.d}
              stroke={LIME_BRIGHT}
              strokeWidth={c.stroke * 1.1}
              opacity={0.75}
            />
          ))}
        </g>
        <g data-ambient-branches stroke={LIME} strokeWidth={c.stroke * 0.8} fill="none" strokeLinecap="round" />
        <g fill={LIME}>
          {layout.grownNodes.map((n, i) => (
            <circle key={i} data-grown-node cx={n.x} cy={n.y} r={n.r} opacity={n.opacity} />
          ))}
        </g>
        <g data-ambient-highlights stroke={LIME_BRIGHT} fill={LIME_BRIGHT} strokeLinecap="round" />
      </g>

      <circle data-pulse cx={layout.questionDotX} cy={cy} r={c.stroke * 4.2} fill={LIME_BRIGHT} opacity={0} filter={`url(#${glowId})`} />
      <circle data-ambient-pulse cx={layout.questionDotX} cy={cy} r={c.stroke * 3} fill={LIME_BRIGHT} opacity={0} filter={`url(#${glowId})`} />

      <circle data-ray-halo cx={c.rayX} cy={cy} r={c.stroke * 7} fill={LIME} opacity={0.18} />
      <circle data-ray-dot cx={c.rayX} cy={cy} r={c.stroke * 3.6} fill={LIME_BRIGHT} filter={`url(#${glowId})`} />

      <text
        data-ray-text
        textAnchor={c.rayTextBelow ? 'end' : 'start'}
        fill="#ffffff"
        fontStyle="italic"
        fontWeight={500}
        fontSize={c.questionSize}
        style={{ ...textHalo, strokeWidth: c.questionSize * 0.4 }}
      >
        {c.rayTextBelow ? (
          <>
            <tspan x={c.width - 8} y={cy + c.questionSize * 1.9}>
              Rayleigh
            </tspan>
            <tspan x={c.width - 8} y={cy + c.questionSize * 3.1}>
              scattering.
            </tspan>
          </>
        ) : (
          <>
            <tspan x={c.rayX + 14} y={cy - c.questionSize * 0.35}>
              Rayleigh
            </tspan>
            <tspan x={c.rayX + 14} y={cy + c.questionSize * 0.85}>
              scattering.
            </tspan>
          </>
        )}
      </text>
    </svg>
  );
}
