"use client";

import React from "react";

export interface MatrixRow {
  key: string;
  label: string;
  unit?: string;
  direction: "higher_better" | "lower_better" | "neutral";
  description: string;
  values: Record<string, number | string>; // assemblyId -> value
}

export interface QualityMatrixProps {
  assemblies: { id: string; name: string; version: string }[];
  rows: MatrixRow[];
}

export const QualityMatrix: React.FC<QualityMatrixProps> = ({
  assemblies,
  rows,
}) => {
  const exportCsv = () => {
    const headers = [
      "Metric",
      "Unit",
      "Direction",
      ...assemblies.map((a) => `${a.name} (${a.version})`),
    ];
    const csvRows = [headers.join(",")];
    rows.forEach((r) => {
      const vals = assemblies.map((a) => r.values[a.id] ?? "");
      csvRows.push(
        [`"${r.label}"`, `"${r.unit || ""}"`, r.direction, ...vals].join(","),
      );
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "assembly_quality_matrix.csv";
    link.click();
  };

  return (
    <div className="flex flex-col gap-3 font-sans w-full">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Comparative Assessment Matrix
        </span>
        <button
          onClick={exportCsv}
          className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-medium transition-colors"
        >
          Export CSV
        </button>
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <th className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10">
                Metric
              </th>
              {assemblies.map((a) => (
                <th
                  key={a.id}
                  className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap"
                >
                  {a.name}{" "}
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({a.version})
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row) => {
              // Determine best value among numeric values
              const numVals = assemblies
                .map((a) =>
                  typeof row.values[a.id] === "number"
                    ? (row.values[a.id] as number)
                    : null,
                )
                .filter((v): v is number => v !== null);

              let bestVal: number | null = null;
              if (numVals.length > 1 && row.direction !== "neutral") {
                bestVal =
                  row.direction === "higher_better"
                    ? Math.max(...numVals)
                    : Math.min(...numVals);
              }

              return (
                <tr
                  key={row.key}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-2 px-4 font-medium text-slate-800 dark:text-slate-200 sticky left-0 bg-white dark:bg-slate-900 z-10">
                    <span
                      title={row.description}
                      className="cursor-help border-b border-dashed border-slate-400"
                    >
                      {row.label}
                    </span>
                    {row.unit && (
                      <span className="text-[10px] text-slate-400 ml-1">
                        ({row.unit})
                      </span>
                    )}
                  </td>
                  {assemblies.map((a) => {
                    const rawVal = row.values[a.id];
                    const isBest =
                      bestVal !== null &&
                      typeof rawVal === "number" &&
                      rawVal === bestVal;

                    return (
                      <td
                        key={a.id}
                        className={`py-2 px-4 font-mono font-medium ${
                          isBest
                            ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 font-bold"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {typeof rawVal === "number"
                          ? rawVal.toLocaleString()
                          : (rawVal ?? "—")}
                        {isBest && (
                          <span className="ml-1 text-[10px] text-emerald-600">
                            ★
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
