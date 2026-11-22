"use client";

import * as d3 from "d3";
import React, { useRef, useState } from "react";

export interface WheelChromosome {
  id: string;
  name: string;
  length: number;
  start_bp: number;
  end_bp: number;
  gc_percent: number;
  is_circular: boolean;
  color: string;
}

export interface WheelRibbon {
  id: string;
  source_chr: string;
  source_start: number;
  source_end: number;
  target_chr: string;
  target_start: number;
  target_end: number;
  strand: string;
  color: string;
}

export interface GCProfileBin {
  sequence_id: string;
  start: number;
  end: number;
  gc_percent: number;
  ambiguous_percent: number;
  n_percent: number;
}

export interface GenomeCircosProps {
  totalLength: number;
  chromosomes: WheelChromosome[];
  gcBins?: GCProfileBin[];
  ribbons?: WheelRibbon[];
  selectedChromosome?: string | null;
  onSelectChromosome?: (chr: WheelChromosome | null) => void;
  onHoverInterval?: (
    info: { chr: string; start: number; end: number; gc?: number } | null,
  ) => void;
  width?: number;
  height?: number;
}

export const GenomeCircos: React.FC<GenomeCircosProps> = ({
  totalLength,
  chromosomes,
  gcBins = [],
  ribbons = [],
  selectedChromosome,
  onSelectChromosome,
  onHoverInterval,
  width = 640,
  height = 640,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartAngle, setDragStartAngle] = useState(0);

  const radius = Math.min(width, height) / 2 - 40;
  const outerRadius = radius;
  const chrRingWidth = 18;
  const chrInnerRadius = outerRadius - chrRingWidth;
  const gcTrackWidth = 35;
  const gcInnerRadius = chrInnerRadius - 8 - gcTrackWidth;
  const ribbonRadius = gcInnerRadius - 12;

  // Compute angles for each chromosome
  const chrAngleMap = new Map<
    string,
    { startAngle: number; endAngle: number; chr: WheelChromosome }
  >();
  let currentAngle = 0;
  const gapAngle = chromosomes.length > 1 ? 0.02 : 0; // radians gap between chromosomes
  const availableAngle = 2 * Math.PI - chromosomes.length * gapAngle;

  chromosomes.forEach((chr) => {
    const span = (chr.length / Math.max(1, totalLength)) * availableAngle;
    const start = currentAngle;
    const end = currentAngle + span;
    chrAngleMap.set(chr.id, { startAngle: start, endAngle: end, chr });
    currentAngle = end + gapAngle;
  });

  const getBpAngle = (chrId: string, bp: number) => {
    const entry = chrAngleMap.get(chrId);
    if (!entry) return null;
    const ratio = Math.max(0, Math.min(1, bp / entry.chr.length));
    return entry.startAngle + ratio * (entry.endAngle - entry.startAngle);
  };

  return (
    <div className="relative flex flex-col items-center select-none">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="cursor-crosshair overflow-visible"
        onMouseDown={(e) => {
          setIsDragging(true);
          const rect = e.currentTarget.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          setDragStartAngle(
            Math.atan2(e.clientY - cy, e.clientX - cx) -
              (rotation * Math.PI) / 180,
          );
        }}
        onMouseMove={(e) => {
          if (!isDragging) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
          setRotation(((angle - dragStartAngle) * 180) / Math.PI);
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        <g
          transform={`translate(${width / 2}, ${height / 2}) rotate(${rotation})`}
        >
          {/* Track 1: Outer Chromosome / Scaffold Ring */}
          {chromosomes.map((chr) => {
            const geom = chrAngleMap.get(chr.id);
            if (!geom) return null;
            const isSelected = selectedChromosome === chr.id;

            const arcGen = d3
              .arc<any>()
              .innerRadius(chrInnerRadius)
              .outerRadius(isSelected ? outerRadius + 4 : outerRadius)
              .startAngle(geom.startAngle)
              .endAngle(geom.endAngle)
              .cornerRadius(2);

            return (
              <g key={chr.id} className="transition-all duration-200">
                <path
                  d={arcGen(null) || ""}
                  fill={chr.color}
                  stroke={isSelected ? "#1E293B" : "#FFFFFF"}
                  strokeWidth={isSelected ? 2 : 1}
                  className="hover:brightness-110 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectChromosome?.(isSelected ? null : chr);
                  }}
                  onMouseEnter={() => {
                    onHoverInterval?.({
                      chr: chr.name,
                      start: 0,
                      end: chr.length,
                      gc: chr.gc_percent,
                    });
                  }}
                  onMouseLeave={() => onHoverInterval?.(null)}
                />

                {/* Chromosome Label if angle span is sufficiently large */}
                {geom.endAngle - geom.startAngle > 0.15 && (
                  <text
                    transform={`
                      rotate(${((geom.startAngle + geom.endAngle) / 2) * (180 / Math.PI) - 90})
                      translate(${outerRadius + 14}, 0)
                      ${(geom.startAngle + geom.endAngle) / 2 > Math.PI / 2 && (geom.startAngle + geom.endAngle) / 2 < (3 * Math.PI) / 2 ? "rotate(180)" : ""}
                    `}
                    textAnchor={
                      (geom.startAngle + geom.endAngle) / 2 > Math.PI / 2 &&
                      (geom.startAngle + geom.endAngle) / 2 < (3 * Math.PI) / 2
                        ? "end"
                        : "start"
                    }
                    alignmentBaseline="middle"
                    className="text-[10px] font-semibold font-mono fill-slate-700 dark:fill-slate-300 pointer-events-none"
                  >
                    {chr.name} ({Math.round(chr.length / 1000)}kb)
                  </text>
                )}
              </g>
            );
          })}

          {/* Track 2: GC Content Concentric Track */}
          {gcBins.map((bin, idx) => {
            const startA = getBpAngle(bin.sequence_id, bin.start);
            const endA = getBpAngle(bin.sequence_id, bin.end);
            if (startA === null || endA === null) return null;

            // Normalize GC% (typically 20% to 80%) into track radial span
            const gcRatio = Math.max(
              0,
              Math.min(1, (bin.gc_percent - 20) / 60),
            );
            const barOuter = gcInnerRadius + gcRatio * gcTrackWidth;

            const arcGen = d3
              .arc<any>()
              .innerRadius(gcInnerRadius)
              .outerRadius(barOuter)
              .startAngle(startA)
              .endAngle(endA);

            // Color gradient by GC deviation
            const fillColor =
              bin.gc_percent > 55
                ? "#0D9488"
                : bin.gc_percent < 45
                  ? "#F59E0B"
                  : "#3B82F6";

            return (
              <path
                key={`gc_${idx}`}
                d={arcGen(null) || ""}
                fill={fillColor}
                opacity={0.8}
                className="hover:opacity-100 cursor-pointer"
                onMouseEnter={() => {
                  onHoverInterval?.({
                    chr: bin.sequence_id,
                    start: bin.start,
                    end: bin.end,
                    gc: bin.gc_percent,
                  });
                }}
                onMouseLeave={() => onHoverInterval?.(null)}
              />
            );
          })}

          {/* Track 2 Baseline Circle */}
          <circle
            r={gcInnerRadius}
            fill="none"
            stroke="#CBD5E1"
            strokeDasharray="2,2"
            className="dark:stroke-slate-700"
          />

          {/* Inner Ribbons: Synteny / Alignments */}
          {ribbons.map((rib) => {
            const a1 = getBpAngle(rib.source_chr, rib.source_start);
            const a2 = getBpAngle(rib.source_chr, rib.source_end);
            const b1 = getBpAngle(rib.target_chr, rib.target_start);
            const b2 = getBpAngle(rib.target_chr, rib.target_end);
            if (a1 === null || a2 === null || b1 === null || b2 === null)
              return null;

            // Generate ribbon path using cubic bezier curves to center
            const pA1 = [
              ribbonRadius * Math.sin(a1),
              -ribbonRadius * Math.cos(a1),
            ];
            const pA2 = [
              ribbonRadius * Math.sin(a2),
              -ribbonRadius * Math.cos(a2),
            ];
            const pB1 = [
              ribbonRadius * Math.sin(b1),
              -ribbonRadius * Math.cos(b1),
            ];
            const pB2 = [
              ribbonRadius * Math.sin(b2),
              -ribbonRadius * Math.cos(b2),
            ];

            const d = `
              M ${pA1[0]} ${pA1[1]}
              A ${ribbonRadius} ${ribbonRadius} 0 0 1 ${pA2[0]} ${pA2[1]}
              Q 0 0 ${pB1[0]} ${pB1[1]}
              A ${ribbonRadius} ${ribbonRadius} 0 0 1 ${pB2[0]} ${pB2[1]}
              Q 0 0 ${pA1[0]} ${pA1[1]}
              Z
            `;

            return (
              <path
                key={rib.id}
                d={d}
                fill={rib.color}
                opacity={0.35}
                className="hover:opacity-85 transition-opacity cursor-pointer"
                stroke={rib.color}
                strokeWidth={0.5}
                onMouseEnter={() => {
                  onHoverInterval?.({
                    chr: `${rib.source_chr} ⇄ ${rib.target_chr}`,
                    start: rib.source_start,
                    end: rib.source_end,
                  });
                }}
                onMouseLeave={() => onHoverInterval?.(null)}
              />
            );
          })}

          {/* Center Hub Display */}
          <circle
            r={ribbonRadius * 0.35}
            className="fill-slate-50/90 dark:fill-slate-900/90 stroke-slate-200 dark:stroke-slate-800"
            strokeWidth={1.5}
          />
          <text
            textAnchor="middle"
            alignmentBaseline="middle"
            y={-10}
            className="text-xs font-bold uppercase tracking-wider fill-slate-800 dark:fill-slate-200 pointer-events-none"
          >
            {chromosomes.length} Sequences
          </text>
          <text
            textAnchor="middle"
            alignmentBaseline="middle"
            y={10}
            className="text-[11px] font-mono fill-slate-500 dark:fill-slate-400 pointer-events-none"
          >
            {(totalLength / 1000).toLocaleString()} kb
          </text>
        </g>
      </svg>

      {/* Interactive Controls Overlay */}
      <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs text-xs">
        <button
          onClick={() => setRotation((r) => r - 15)}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded font-mono text-slate-700 dark:text-slate-300"
          title="Rotate counter-clockwise"
        >
          ↺
        </button>
        <button
          onClick={() => setRotation(0)}
          className="px-2 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded font-mono text-[10px] text-slate-600 dark:text-slate-400"
          title="Reset rotation"
        >
          Reset
        </button>
        <button
          onClick={() => setRotation((r) => r + 15)}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded font-mono text-slate-700 dark:text-slate-300"
          title="Rotate clockwise"
        >
          ↻
        </button>
      </div>
    </div>
  );
};
