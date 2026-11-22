"use client";

import * as d3 from "d3";
import React, { useState } from "react";

export interface GenomeTrackBrowserProps {
  sequenceId: string;
  sequenceLength: number;
  sequenceString?: string;
  gcBins?: { start: number; end: number; gc_percent: number }[];
  gaps?: { start: number; end: number; length: number }[];
  alignments?: {
    query_name: string;
    target_start: number;
    target_end: number;
    strand: string;
  }[];
  width?: number;
}

const BASE_COLORS: Record<string, string> = {
  A: "#10B981", // emerald
  C: "#3B82F6", // blue
  G: "#F59E0B", // amber
  T: "#EF4444", // red
  N: "#64748B", // slate
};

export const GenomeTrackBrowser: React.FC<GenomeTrackBrowserProps> = ({
  sequenceId,
  sequenceLength,
  sequenceString = "",
  gcBins = [],
  gaps = [],
  alignments = [],
  width = 800,
}) => {
  const [viewportStart, setViewportStart] = useState<number>(0);
  const [viewportEnd, setViewportEnd] = useState<number>(
    Math.min(10000, sequenceLength),
  );
  const [copied, setCopied] = useState(false);

  const viewSpan = Math.max(10, viewportEnd - viewportStart);
  const xScale = d3
    .scaleLinear()
    .domain([viewportStart, viewportEnd])
    .range([0, width]);

  const zoomIn = () => {
    const center = (viewportStart + viewportEnd) / 2;
    const newHalf = viewSpan / 4;
    setViewportStart(Math.max(0, Math.round(center - newHalf)));
    setViewportEnd(Math.min(sequenceLength, Math.round(center + newHalf)));
  };

  const zoomOut = () => {
    const center = (viewportStart + viewportEnd) / 2;
    const newHalf = viewSpan;
    setViewportStart(Math.max(0, Math.round(center - newHalf)));
    setViewportEnd(Math.min(sequenceLength, Math.round(center + newHalf)));
  };

  const panLeft = () => {
    const shift = Math.round(viewSpan * 0.25);
    const newStart = Math.max(0, viewportStart - shift);
    setViewportStart(newStart);
    setViewportEnd(newStart + viewSpan);
  };

  const panRight = () => {
    const shift = Math.round(viewSpan * 0.25);
    const newEnd = Math.min(sequenceLength, viewportEnd + shift);
    setViewportEnd(newEnd);
    setViewportStart(Math.max(0, newEnd - viewSpan));
  };

  const visibleSeq = sequenceString.slice(
    Math.max(0, viewportStart),
    Math.min(sequenceString.length, viewportEnd),
  );

  const showNucleotides = viewSpan <= 120 && visibleSeq.length > 0;

  const handleCopySequence = () => {
    if (visibleSeq) {
      navigator.clipboard.writeText(visibleSeq);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-3 font-sans w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Chromosome:
          </span>
          <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-blue-600 dark:text-blue-400 font-semibold">
            {sequenceId}
          </span>
          <span className="font-mono text-slate-500">
            [{viewportStart.toLocaleString()} .. {viewportEnd.toLocaleString()}{" "}
            bp]
          </span>
          <span className="text-[11px] text-slate-400">
            ({viewSpan.toLocaleString()} bp window)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={panLeft}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded font-bold"
            title="Pan left"
          >
            ←
          </button>
          <button
            onClick={zoomIn}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded font-bold"
            title="Zoom in"
          >
            +
          </button>
          <button
            onClick={zoomOut}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded font-bold"
            title="Zoom out"
          >
            -
          </button>
          <button
            onClick={panRight}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded font-bold"
            title="Pan right"
          >
            →
          </button>
          {visibleSeq && (
            <button
              onClick={handleCopySequence}
              className="ml-2 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 rounded font-medium transition-colors"
            >
              {copied ? "Copied!" : "Copy FASTA"}
            </button>
          )}
        </div>
      </div>

      {/* SVG Canvas for Linear Tracks */}
      <div className="overflow-x-auto">
        <svg
          width={width}
          height={showNucleotides ? 220 : 180}
          className="select-none"
        >
          {/* 1. Genomic Ruler */}
          <g transform="translate(0, 25)">
            <line
              x1={0}
              x2={width}
              y1={0}
              y2={0}
              stroke="#475569"
              strokeWidth={1.5}
            />
            {xScale.ticks(8).map((t) => {
              const xPos = xScale(t);
              const anchor =
                xPos < 35 ? "start" : xPos > width - 45 ? "end" : "middle";
              const dx = xPos < 35 ? 4 : xPos > width - 45 ? -4 : 0;
              return (
                <g key={`tick_${t}`} transform={`translate(${xPos}, 0)`}>
                  <line y2={6} stroke="#475569" />
                  <text
                    y={18}
                    dx={dx}
                    textAnchor={anchor}
                    className="text-[10px] font-mono fill-slate-500"
                  >
                    {t.toLocaleString()} bp
                  </text>
                </g>
              );
            })}
          </g>

          {/* 2. Nucleotide Sequence Track (Visible when zoomed in <= 120 bp) */}
          {showNucleotides && (
            <g transform="translate(0, 65)">
              <text
                x={4}
                y={-8}
                className="text-[10px] font-bold fill-slate-400 uppercase"
              >
                Nucleotide Sequence
              </text>
              {visibleSeq.split("").map((char, i) => {
                const bp = viewportStart + i;
                const x = xScale(bp);
                const nextX = xScale(bp + 1);
                const charWidth = Math.max(1, nextX - x);
                const color = BASE_COLORS[char.toUpperCase()] || "#64748B";

                return (
                  <g key={`base_${bp}`}>
                    <rect
                      x={x}
                      y={0}
                      width={charWidth - 0.5}
                      height={20}
                      fill={color}
                      opacity={0.85}
                      rx={1}
                    />
                    {charWidth > 10 && (
                      <text
                        x={x + charWidth / 2}
                        y={14}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        className="text-[10px] font-bold font-mono pointer-events-none"
                      >
                        {char}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* 3. GC Content Track */}
          <g transform={`translate(0, ${showNucleotides ? 115 : 70})`}>
            <text
              x={4}
              y={-6}
              className="text-[10px] font-bold fill-slate-400 uppercase"
            >
              GC Profile Track (50% Baseline)
            </text>
            <rect
              width={width}
              height={35}
              fill="#F8FAFC"
              className="dark:fill-slate-800/40"
            />
            <line
              x1={0}
              x2={width}
              y1={17.5}
              y2={17.5}
              stroke="#CBD5E1"
              strokeDasharray="2,2"
            />

            {gcBins
              .filter((b) => b.end >= viewportStart && b.start <= viewportEnd)
              .map((b, idx) => {
                const x1 = Math.max(0, xScale(b.start));
                const x2 = Math.min(width, xScale(b.end));
                const barWidth = Math.max(1, x2 - x1);
                const h = (b.gc_percent / 100) * 35;
                const y = 35 - h;
                const fill =
                  b.gc_percent > 55
                    ? "#0D9488"
                    : b.gc_percent < 45
                      ? "#F59E0B"
                      : "#3B82F6";

                return (
                  <rect
                    key={`gcbin_${idx}`}
                    x={x1}
                    y={y}
                    width={barWidth}
                    height={h}
                    fill={fill}
                    opacity={0.8}
                  />
                );
              })}
          </g>

          {/* 4. Gaps / N-Rich Regions */}
          <g transform={`translate(0, ${showNucleotides ? 170 : 125})`}>
            <text
              x={4}
              y={-6}
              className="text-[10px] font-bold fill-slate-400 uppercase"
            >
              Scaffold Gaps & Alignments
            </text>
            <rect
              width={width}
              height={22}
              fill="#F1F5F9"
              className="dark:fill-slate-800"
              rx={2}
            />

            {/* Gaps */}
            {gaps
              .filter((g) => g.end >= viewportStart && g.start <= viewportEnd)
              .map((g, idx) => {
                const x1 = Math.max(0, xScale(g.start));
                const x2 = Math.min(width, xScale(g.end));
                return (
                  <rect
                    key={`gap_${idx}`}
                    x={x1}
                    y={2}
                    width={Math.max(2, x2 - x1)}
                    height={18}
                    fill="#EF4444"
                    rx={2}
                  >
                    <title>{`Gap: ${g.start}..${g.end} (${g.length} bp)`}</title>
                  </rect>
                );
              })}

            {/* Alignments */}
            {alignments
              .filter(
                (a) =>
                  a.target_end >= viewportStart &&
                  a.target_start <= viewportEnd,
              )
              .map((a, idx) => {
                const x1 = Math.max(0, xScale(a.target_start));
                const x2 = Math.min(width, xScale(a.target_end));
                const color =
                  a.strand === "+" || a.strand === "Forward"
                    ? "#2563EB"
                    : "#EC4899";
                return (
                  <rect
                    key={`aln_${idx}`}
                    x={x1}
                    y={5}
                    width={Math.max(2, x2 - x1)}
                    height={12}
                    fill={color}
                    opacity={0.9}
                    rx={2}
                  >
                    <title>{`Aligned: ${a.query_name} (${a.strand})`}</title>
                  </rect>
                );
              })}
          </g>
        </svg>
      </div>
    </div>
  );
};
