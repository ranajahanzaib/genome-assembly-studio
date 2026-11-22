"use client";

import * as d3 from "d3";
import React, { useState } from "react";

export interface AlignmentBlock {
  query_name: string;
  query_length: number;
  query_start: number;
  query_end: number;
  strand: "Forward" | "Reverse" | "+" | "-";
  target_name: string;
  target_length: number;
  target_start: number;
  target_end: number;
  matches: number;
  alignment_length: number;
  mapping_quality: number;
}

export interface AssemblyDotPlotProps {
  alignments: AlignmentBlock[];
  referenceLength: number;
  assemblyLength: number;
  referenceName?: string;
  assemblyName?: string;
  onSelectAlignment?: (aln: AlignmentBlock) => void;
  width?: number;
  height?: number;
}

export const AssemblyDotPlot: React.FC<AssemblyDotPlotProps> = ({
  alignments,
  referenceLength,
  assemblyLength,
  referenceName = "Reference (bp)",
  assemblyName = "Query Assembly (bp)",
  onSelectAlignment,
  width = 650,
  height = 550,
}) => {
  const margin = { top: 30, right: 30, bottom: 55, left: 65 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const [hoveredAln, setHoveredAln] = useState<AlignmentBlock | null>(null);

  // Compute cumulative query offsets for multi-scaffold assemblies
  const queryOffsets = React.useMemo(() => {
    const offsets: Record<string, number> = {};
    let current = 0;
    const seen = new Set<string>();
    for (const aln of alignments) {
      if (!seen.has(aln.query_name)) {
        seen.add(aln.query_name);
        offsets[aln.query_name] = current;
        current += aln.query_length;
      }
    }
    return offsets;
  }, [alignments]);

  const effectiveAssemblyLength = React.useMemo(() => {
    const totalFromOffsets = Object.values(queryOffsets).reduce(
      (sum, off, idx, arr) => {
        // Find the last scaffold's length
        const keys = Object.keys(queryOffsets);
        const lastKey = keys[keys.length - 1];
        const lastAln = alignments.find((a) => a.query_name === lastKey);
        return (queryOffsets[lastKey] || 0) + (lastAln?.query_length || 0);
      },
      0,
    );
    return Math.max(assemblyLength || 50000, totalFromOffsets || 50000);
  }, [assemblyLength, queryOffsets, alignments]);

  const xScale = d3
    .scaleLinear()
    .domain([0, referenceLength || 50000])
    .range([0, innerWidth]);

  const yScale = d3
    .scaleLinear()
    .domain([0, effectiveAssemblyLength])
    .range([innerHeight, 0]);

  return (
    <div className="relative flex flex-col items-center">
      <svg width={width} height={height} className="select-none font-sans">
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Background grid */}
          <rect
            width={innerWidth}
            height={innerHeight}
            fill="#F8FAFC"
            stroke="#CBD5E1"
            className="dark:fill-slate-900/60 dark:stroke-slate-800"
          />

          {/* Grid lines */}
          {xScale.ticks(8).map((t) => (
            <line
              key={`x_${t}`}
              x1={xScale(t)}
              x2={xScale(t)}
              y1={0}
              y2={innerHeight}
              stroke="#E2E8F0"
              strokeDasharray="2,2"
              className="dark:stroke-slate-800"
            />
          ))}
          {yScale.ticks(8).map((t) => (
            <line
              key={`y_${t}`}
              x1={0}
              x2={innerWidth}
              y1={yScale(t)}
              y2={yScale(t)}
              stroke="#E2E8F0"
              strokeDasharray="2,2"
              className="dark:stroke-slate-800"
            />
          ))}

          {/* Diagonal 1:1 Identity reference guide line */}
          <line
            x1={0}
            y1={innerHeight}
            x2={innerWidth}
            y2={0}
            stroke="#94A3B8"
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.4}
          />

          {/* Scaffold boundaries */}
          {Object.entries(queryOffsets).map(([name, offset]) => {
            if (offset === 0) return null;
            const y = yScale(offset);
            return (
              <line
                key={`scaffold_sep_${name}`}
                x1={0}
                x2={innerWidth}
                y1={y}
                y2={y}
                stroke="#94A3B8"
                strokeDasharray="2,2"
                opacity={0.5}
                className="dark:stroke-slate-600"
              />
            );
          })}

          {/* Alignment segments */}
          {alignments.map((aln, idx) => {
            const isFwd = aln.strand === "Forward" || aln.strand === "+";
            const qOffset = queryOffsets[aln.query_name] ?? 0;
            const qStart = aln.query_start + qOffset;
            const qEnd = aln.query_end + qOffset;

            const x1 = xScale(aln.target_start);
            const x2 = xScale(aln.target_end);
            const y1 = isFwd ? yScale(qStart) : yScale(qEnd);
            const y2 = isFwd ? yScale(qEnd) : yScale(qStart);

            const isHovered = hoveredAln === aln;
            const strokeColor = isFwd ? "#2563EB" : "#E11D48";

            return (
              <g key={`aln_${idx}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={strokeColor}
                  strokeWidth={isHovered ? 4 : 2.5}
                  strokeLinecap="round"
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredAln(aln)}
                  onMouseLeave={() => setHoveredAln(null)}
                  onClick={() => onSelectAlignment?.(aln)}
                />
              </g>
            );
          })}

          {/* Axes */}
          {/* X-Axis */}
          <line
            x1={0}
            x2={innerWidth}
            y1={innerHeight}
            y2={innerHeight}
            stroke="#475569"
          />
          {xScale.ticks(6).map((t) => (
            <g
              key={`xtick_${t}`}
              transform={`translate(${xScale(t)}, ${innerHeight})`}
            >
              <line y2={5} stroke="#475569" />
              <text
                y={18}
                textAnchor="middle"
                className="text-[10px] font-mono fill-slate-600 dark:fill-slate-400"
              >
                {(t / 1000).toLocaleString()}k
              </text>
            </g>
          ))}
          <text
            x={innerWidth / 2}
            y={innerHeight + 40}
            textAnchor="middle"
            className="text-xs font-semibold fill-slate-700 dark:fill-slate-300"
          >
            {referenceName}
          </text>

          {/* Y-Axis */}
          <line x1={0} x2={0} y1={0} y2={innerHeight} stroke="#475569" />
          {yScale.ticks(6).map((t) => (
            <g key={`ytick_${t}`} transform={`translate(0, ${yScale(t)})`}>
              <line x2={-5} stroke="#475569" />
              <text
                x={-8}
                alignmentBaseline="middle"
                textAnchor="end"
                className="text-[10px] font-mono fill-slate-600 dark:fill-slate-400"
              >
                {(t / 1000).toLocaleString()}k
              </text>
            </g>
          ))}
          <text
            transform={`rotate(-90)`}
            x={-innerHeight / 2}
            y={-45}
            textAnchor="middle"
            className="text-xs font-semibold fill-slate-700 dark:fill-slate-300"
          >
            {assemblyName}
          </text>
        </g>
      </svg>

      {/* Legend & Hover Info */}
      <div className="w-full max-w-xl mt-2 flex items-center justify-between text-xs px-2 text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-blue-600 rounded"></span>
            <span>Forward (+)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-rose-600 rounded"></span>
            <span>Inverted (-)</span>
          </div>
        </div>

        {hoveredAln && (
          <div className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700">
            {hoveredAln.query_name} [{hoveredAln.query_start.toLocaleString()}..
            {hoveredAln.query_end.toLocaleString()}] ⇄ Ref [
            {hoveredAln.target_start.toLocaleString()}..
            {hoveredAln.target_end.toLocaleString()}] ({hoveredAln.matches}{" "}
            matches, MAPQ {hoveredAln.mapping_quality})
          </div>
        )}
      </div>
    </div>
  );
};
