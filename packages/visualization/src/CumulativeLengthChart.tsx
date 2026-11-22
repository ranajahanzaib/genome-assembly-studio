"use client";

import * as d3 from "d3";
import React from "react";

export interface CumulativeSeries {
  assemblyId: string;
  name: string;
  color: string;
  points: {
    contig_index: number;
    contig_length: number;
    cumulative_length: number;
  }[];
}

export interface CumulativeLengthChartProps {
  series: CumulativeSeries[];
  referenceLength?: number;
  width?: number;
  height?: number;
}

export const CumulativeLengthChart: React.FC<CumulativeLengthChartProps> = ({
  series,
  referenceLength,
  width = 600,
  height = 360,
}) => {
  const margin = { top: 25, right: 30, bottom: 45, left: 65 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const maxIndex = Math.max(
    1,
    ...series.flatMap((s) => s.points.map((p) => p.contig_index)),
  );
  const maxLength = Math.max(
    referenceLength || 0,
    ...series.flatMap((s) => s.points.map((p) => p.cumulative_length)),
  );

  const xScale = d3.scaleLinear().domain([1, maxIndex]).range([0, innerWidth]);
  const yScale = d3
    .scaleLinear()
    .domain([0, maxLength * 1.05])
    .range([innerHeight, 0]);

  const lineGen = d3
    .line<{ contig_index: number; cumulative_length: number }>()
    .x((d) => xScale(d.contig_index))
    .y((d) => yScale(d.cumulative_length))
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

          {/* Reference genome size guide */}
          {referenceLength && (
            <g>
              <line
                x1={0}
                x2={innerWidth}
                y1={yScale(referenceLength)}
                y2={yScale(referenceLength)}
                stroke="#64748B"
                strokeWidth={1.5}
                strokeDasharray="4,4"
              />
              <text
                x={innerWidth - 8}
                y={yScale(referenceLength) - 6}
                textAnchor="end"
                className="text-[10px] font-mono fill-slate-500 font-semibold"
              >
                Ref Size: {(referenceLength / 1000).toLocaleString()} kb
              </text>
            </g>
          )}

          {/* Series lines */}
          {series.map((s) => (
            <g key={s.assemblyId}>
              <path
                d={lineGen(s.points) || ""}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
              {s.points.map((p) => (
                <circle
                  key={`cpt_${p.contig_index}`}
                  cx={xScale(p.contig_index)}
                  cy={yScale(p.cumulative_length)}
                  r={3}
                  fill={s.color}
                  stroke="#FFFFFF"
                  strokeWidth={1}
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
          {xScale.ticks(Math.min(8, maxIndex)).map((t) => (
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
                {t}
              </text>
            </g>
          ))}
          <text
            x={innerWidth / 2}
            y={innerHeight + 34}
            textAnchor="middle"
            className="text-xs font-semibold fill-slate-700 dark:fill-slate-300"
          >
            Contig Rank (Sorted Descending)
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
            Cumulative Assembly Length (bp)
          </text>
        </g>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-2 text-xs">
        {series.map((s) => (
          <div key={s.assemblyId} className="flex items-center gap-2">
            <span
              className="w-3.5 h-1.5 rounded"
              style={{ backgroundColor: s.color }}
            ></span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {s.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
