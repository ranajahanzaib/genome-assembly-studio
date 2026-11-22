"use client";

import * as d3 from "d3";
import React from "react";

export interface HistogramBin {
  min_length: number;
  max_length: number;
  count: number;
  total_bp: number;
}

export interface ContigHistogramProps {
  bins: HistogramBin[];
  width?: number;
  height?: number;
}

export const ContigHistogram: React.FC<ContigHistogramProps> = ({
  bins,
  width = 600,
  height = 320,
}) => {
  const margin = { top: 20, right: 25, bottom: 45, left: 55 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const maxCount = Math.max(1, ...bins.map((b) => b.count));
  const xScale = d3
    .scaleBand()
    .domain(bins.map((_, i) => i.toString()))
    .range([0, innerWidth])
    .padding(0.15);

  const yScale = d3
    .scaleLinear()
    .domain([0, maxCount * 1.1])
    .range([innerHeight, 0]);

  return (
    <div className="flex flex-col items-center select-none font-sans">
      <svg width={width} height={height}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Grid lines */}
          {yScale
            .ticks(5)
            .filter(Number.isInteger)
            .map((t) => (
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

          {/* Bars */}
          {bins.map((bin, i) => {
            const x = xScale(i.toString()) || 0;
            const barW = xScale.bandwidth();
            const y = yScale(bin.count);
            const barH = innerHeight - y;

            return (
              <g key={`bar_${i}`} className="group">
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  fill="#2563EB"
                  rx={2}
                  className="hover:fill-blue-500 transition-colors cursor-pointer"
                />
                <title>{`${bin.min_length.toLocaleString()} - ${bin.max_length.toLocaleString()} bp: ${bin.count} sequences (${(bin.total_bp / 1000).toFixed(1)} kb)`}</title>
              </g>
            );
          })}

          {/* Axes */}
          <line
            x1={0}
            x2={innerWidth}
            y1={innerHeight}
            y2={innerHeight}
            stroke="#475569"
          />
          {bins
            .filter(
              (_, i) =>
                i % Math.ceil(bins.length / 6 || 1) === 0 ||
                i === bins.length - 1,
            )
            .map((bin, i) => {
              const originalIndex = bins.indexOf(bin);
              const x =
                (xScale(originalIndex.toString()) || 0) +
                xScale.bandwidth() / 2;
              return (
                <g
                  key={`xt_${i}`}
                  transform={`translate(${x}, ${innerHeight})`}
                >
                  <line y2={5} stroke="#475569" />
                  <text
                    y={16}
                    textAnchor="middle"
                    className="text-[10px] font-mono fill-slate-600 dark:fill-slate-400"
                  >
                    {(bin.min_length / 1000).toFixed(0)}k
                  </text>
                </g>
              );
            })}
          <text
            x={innerWidth / 2}
            y={innerHeight + 34}
            textAnchor="middle"
            className="text-xs font-semibold fill-slate-700 dark:fill-slate-300"
          >
            Sequence Length Range (bp)
          </text>

          <line x1={0} x2={0} y1={0} y2={innerHeight} stroke="#475569" />
          {yScale
            .ticks(4)
            .filter(Number.isInteger)
            .map((t) => (
              <g key={`yt_${t}`} transform={`translate(0, ${yScale(t)})`}>
                <line x2={-5} stroke="#475569" />
                <text
                  x={-8}
                  alignmentBaseline="middle"
                  textAnchor="end"
                  className="text-[10px] font-mono fill-slate-600 dark:fill-slate-400"
                >
                  {t}
                </text>
              </g>
            ))}
          <text
            transform="rotate(-90)"
            x={-innerHeight / 2}
            y={-38}
            textAnchor="middle"
            className="text-xs font-semibold fill-slate-700 dark:fill-slate-300"
          >
            Sequence Count
          </text>
        </g>
      </svg>
    </div>
  );
};
