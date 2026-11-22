"use client";

import React from "react";

export interface BuscoEntry {
  assemblyName: string;
  completeSingleCopy: number;
  completeDuplicated: number;
  fragmented: number;
  missing: number;
  totalGenes: number;
  completenessPercent: number;
  lineage: string;
}

export interface BuscoStackedChartProps {
  entries: BuscoEntry[];
}

export const BuscoStackedChart: React.FC<BuscoStackedChartProps> = ({
  entries,
}) => {
  return (
    <div className="w-full flex flex-col gap-4 font-sans select-none">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-emerald-600"></span>
          <span>Complete Single-Copy (S)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-teal-500"></span>
          <span>Complete Duplicated (D)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-amber-500"></span>
          <span>Fragmented (F)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-rose-500"></span>
          <span>Missing (M)</span>
        </div>
      </div>

      {/* Bars */}
      <div className="flex flex-col gap-3">
        {entries.map((item, idx) => {
          const total = item.totalGenes || 1;
          const sPct = (item.completeSingleCopy / total) * 100;
          const dPct = (item.completeDuplicated / total) * 100;
          const fPct = (item.fragmented / total) * 100;
          const mPct = (item.missing / total) * 100;

          return (
            <div key={`busco_${idx}`} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {item.assemblyName}
                </span>
                <span className="font-mono text-slate-500 dark:text-slate-400">
                  C: {item.completenessPercent.toFixed(1)}% [S:{" "}
                  {sPct.toFixed(1)}%, D: {dPct.toFixed(1)}%, F:{" "}
                  {fPct.toFixed(1)}%, M: {mPct.toFixed(1)}%] (n={total})
                </span>
              </div>
              <div className="w-full h-6 rounded-md overflow-hidden flex bg-slate-100 dark:bg-slate-800 shadow-inner">
                {sPct > 0 && (
                  <div
                    style={{ width: `${sPct}%` }}
                    className="bg-emerald-600 flex items-center justify-center text-[10px] text-white font-mono font-bold"
                    title={`Complete Single: ${item.completeSingleCopy} (${sPct.toFixed(1)}%)`}
                  >
                    {sPct > 8 ? `${sPct.toFixed(0)}%` : ""}
                  </div>
                )}
                {dPct > 0 && (
                  <div
                    style={{ width: `${dPct}%` }}
                    className="bg-teal-500 flex items-center justify-center text-[10px] text-white font-mono font-bold"
                    title={`Complete Duplicated: ${item.completeDuplicated} (${dPct.toFixed(1)}%)`}
                  >
                    {dPct > 5 ? `${dPct.toFixed(0)}%` : ""}
                  </div>
                )}
                {fPct > 0 && (
                  <div
                    style={{ width: `${fPct}%` }}
                    className="bg-amber-500 flex items-center justify-center text-[10px] text-white font-mono font-bold"
                    title={`Fragmented: ${item.fragmented} (${fPct.toFixed(1)}%)`}
                  >
                    {fPct > 5 ? `${fPct.toFixed(0)}%` : ""}
                  </div>
                )}
                {mPct > 0 && (
                  <div
                    style={{ width: `${mPct}%` }}
                    className="bg-rose-500 flex items-center justify-center text-[10px] text-white font-mono font-bold"
                    title={`Missing: ${item.missing} (${mPct.toFixed(1)}%)`}
                  >
                    {mPct > 5 ? `${mPct.toFixed(0)}%` : ""}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Lineage: {item.lineage}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
