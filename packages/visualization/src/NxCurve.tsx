"use client";

import * as d3 from "d3";
import React, { useState } from "react";

export interface NxSeries {
  assemblyId: string;
  name: string;
  color: string;
  values: { x: number; nx: number; lx?: number }[];
}

export interface NxCurveProps {
  series: NxSeries[];
  width?: number;
  height?: number;
}

export const NxCurve: React.FC<NxCurveProps> = ({
  series,
  width = 600,
  height = 360,
}) => {
  const margin = { top: 25, right: 30, bottom: 45, left: 65 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const [hoveredX, setHoveredX] = useState<number | null>(50);

  const maxNx = Math.max(
    1000,
    ...series.flatMap((s) => s.values.map((v) => v.nx)),
  );

  const xScale = d3.scaleLinear().domain([10, 90]).range([0, innerWidth]);
  const yScale = d3
    .scaleLinear()
    .domain([0, maxNx * 1.05])
    .range([innerHeight, 0]);

  const lineGen = d3
    .line<{ x: number; nx: number }>()
    .x((d) => xScale(d.x))
    .y((d) => yScale(d.nx))
    .curve(d3.curveMonotoneX);

  return (
    <div className="flex flex-col items-center select-none font-sans">
      <svg width={width} height={height}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Grid lines */}
          {yScale.ticks(6).map((t) => (
            <line
              key={`ygrid_${t}`}
              x1={0}
              x2={innerWidth}
              y1={yScale(t)}
              y2={yScale(t)}
              stroke="#E2E8F0"
              strokeDasharray="2,2"
              className="dark:stroke-slate-800"
            />
          ))}

          {/* X ticks */}
          {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((t) => (
            <line
              key={`xgrid_${t}`}
              x1={xScale(t)}
              x2={xScale(t)}
              y1={0}
              y2={innerHeight}
              stroke="#E2E8F0"
              strokeDasharray="2,2"
              className="dark:stroke-slate-800"
            />
          ))}

          {/* N50 Highlight guide line */}
          <line
            x1={xScale(50)}
            x2={xScale(50)}
            y1={0}
            y2={innerHeight}
            stroke="#94A3B8"
            strokeWidth={1.5}
            strokeDasharray="4,4"
          />

          {/* Series lines */}
          {series.map((s) => (
            <g key={s.assemblyId}>
              <path
                d={lineGen(s.values) || ""}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
              {/* Points */}
              {s.values.map((v) => (
                <circle
                  key={`pt_${v.x}`}
                  cx={xScale(v.x)}
                  cy={yScale(v.nx)}
                  r={v.x === 50 ? 5 : 3.5}
                  fill={s.color}
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredX(v.x)}
                />
              ))}
            </g>
          ))}

          {/* Axes */}
          <line
            x1={0}
            x2={innerWidth}
            y1={innerHeight}
            y2={innerHeight}
            stroke="#475569"
          />
          {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((t) => (
            <g
              key={`xt_${t}`}
              transform={`translate(${xScale(t)}, ${innerHeight})`}
            >
              <line y2={5} stroke="#475569" />
              <text
                y={16}
                textAnchor="middle"
                className="text-[10px] font-mono fill-slate-600 dark:fill-slate-400"
              >
                N{t}
              </text>
            </g>
          ))}
          <text
            x={innerWidth / 2}
            y={innerHeight + 34}
            textAnchor="middle"
            className="text-xs font-semibold fill-slate-700 dark:fill-slate-300"
          >
            Nx Threshold (%)
          </text>

          <line x1={0} x2={0} y1={0} y2={innerHeight} stroke="#475569" />
          {yScale.ticks(5).map((t) => (
            <g key={`yt_${t}`} transform={`translate(0, ${yScale(t)})`}>
              <line x2={-5} stroke="#475569" />
              <text
                x={-8}
                alignmentBaseline="middle"
                textAnchor="end"
                className="text-[10px] font-mono fill-slate-600 dark:fill-slate-400"
              >
                {(t / 1000).toLocaleString()} kb
              </text>
            </g>
          ))}
          <text
            transform="rotate(-90)"
            x={-innerHeight / 2}
            y={-48}
            textAnchor="middle"
            className="text-xs font-semibold fill-slate-700 dark:fill-slate-300"
          >
            Contig Length (bp)
          </text>
        </g>
      </svg>

      {/* Series Legend & Details */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-2 text-xs">
        {series.map((s) => {
          const valAtHover = s.values.find((v) => v.x === hoveredX)?.nx || 0;
          return (
            <div key={s.assemblyId} className="flex items-center gap-2">
              <span
                className="w-3.5 h-1.5 rounded"
                style={{ backgroundColor: s.color }}
              ></span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {s.name}
              </span>
              {hoveredX && (
                <span className="font-mono text-slate-500 dark:text-slate-400">
                  (N{hoveredX}: {valAtHover.toLocaleString()} bp)
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
