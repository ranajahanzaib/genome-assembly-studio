"use client";

import { fetchApi } from "@/lib/api";
import { Badge, Button } from "@genome-studio/ui";
import { NxCurve } from "@genome-studio/visualization";
import { CheckCircle2, FileDown, ShieldCheck, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function ComparePage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [baselineId, setBaselineId] = useState<string>("");
  const [comparedId, setComparedId] = useState<string>("");

  const [comparison, setComparison] = useState<any | null>(null);
  const [baselineData, setBaselineData] = useState<any | null>(null);
  const [comparedData, setComparedData] = useState<any | null>(null);
  const [missingRegions, setMissingRegions] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchApi<any[]>("/projects").then((p) => {
      setProjects(p);
      if (p.length > 0) {
        setSelectedProjectId(p[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    fetchApi<any[]>(`/assemblies?project_id=${selectedProjectId}`).then(
      (asms) => {
        setAssemblies(asms);
        if (asms.length >= 2) {
          const v1 =
            asms.find((a) => a.version === "v1" || a.name.includes("Draft")) ||
            asms[0];
          const v2 =
            asms.find(
              (a) => a.version === "v2" || a.name.includes("Polished"),
            ) || asms[1];
          setBaselineId(v1.id);
          setComparedId(v2.id);
        }
      },
    );
  }, [selectedProjectId]);

  useEffect(() => {
    if (!baselineId || !comparedId || baselineId === comparedId) return;

    setLoading(true);
    fetchApi<any>("/comparisons", {
      method: "POST",
      body: JSON.stringify({
        project_id: selectedProjectId,
        baseline_id: baselineId,
        compared_id: comparedId,
      }),
    })
      .then((comp) => {
        setComparison(comp);
        return Promise.all([
          fetchApi<any>(`/assemblies/${baselineId}/metrics`),
          fetchApi<any>(`/assemblies/${comparedId}/metrics`),
          fetchApi<any>(`/assemblies/${comparedId}/missing-regions`),
        ]);
      })
      .then(([bMetrics, cMetrics, missing]) => {
        setBaselineData(bMetrics);
        setComparedData(cMetrics);
        setMissingRegions(missing);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [baselineId, comparedId]);

  // Prepare Nx Curve Series
  const nxSeries = [];
  if (baselineData?.stats?.nx_values) {
    nxSeries.push({
      assemblyId: baselineId,
      name: comparison?.baseline_name || "Baseline",
      color: "#F59E0B",
      values: baselineData.stats.nx_values,
    });
  }
  if (comparedData?.stats?.nx_values) {
    nxSeries.push({
      assemblyId: comparedId,
      name: comparison?.compared_name || "Compared",
      color: "#2563EB",
      values: comparedData.stats.nx_values,
    });
  }

  const exportReport = (format: "json" | "markdown" | "tsv" = "json") => {
    if (!comparison) return;
    if (format === "markdown" || format === "tsv") {
      window.open(
        `http://localhost:8000/api/v1/comparisons/report/export?baseline_id=${baselineId}&compared_id=${comparedId}&format=${format}`,
        "_blank",
      );
      return;
    }
    const jsonStr = JSON.stringify(comparison, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `assembly_comparison_${comparison.baseline_name}_vs_${comparison.compared_name}.json`;
    link.click();
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header and Assembly Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Multi-Assembly Comparison Studio
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Evaluate metric deltas, detect structural improvements, and review
            automated scientific findings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportReport("markdown")}
            className="text-xs gap-1.5"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export Report (Markdown)</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => exportReport("tsv")}
            className="text-xs gap-1.5"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export TSV</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => exportReport("json")}
            className="text-xs gap-1.5"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>JSON</span>
          </Button>
        </div>
      </div>

      {/* Assembly Selection Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Baseline Assembly (v1)
          </label>
          <select
            value={baselineId}
            onChange={(e) => setBaselineId(e.target.value)}
            className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none text-slate-800 dark:text-slate-200"
          >
            {assemblies.map((a) => (
              <option key={a.id} value={a.id}>
                {`${a.name} (${a.version})`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Compared Assembly (v2)
          </label>
          <select
            value={comparedId}
            onChange={(e) => setComparedId(e.target.value)}
            className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none text-slate-800 dark:text-slate-200"
          >
            {assemblies.map((a) => (
              <option key={a.id} value={a.id}>
                {`${a.name} (${a.version})`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Automated Findings Panel */}
      {comparison && comparison.findings && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Automated Scientific Findings
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {comparison.findings.length} findings derived
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {comparison.findings.map((f: any) => {
              const isImp = f.category === "improvement";
              const isTradeoff = f.category === "tradeoff";
              const isReg = f.category === "regression";

              return (
                <div
                  key={f.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-2 ${
                    isImp
                      ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                      : isTradeoff
                        ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60"
                        : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60"
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {f.title}
                      </span>
                      <Badge
                        variant={
                          isImp ? "emerald" : isTradeoff ? "amber" : "rose"
                        }
                      >
                        {f.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                    Evidence: {f.evidence}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Side-by-Side Metric Deltas Table */}
      {comparison && comparison.deltas && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Metric Delta Analysis
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                  <th className="py-2.5 px-4">Metric</th>
                  <th className="py-2.5 px-4">{comparison.baseline_name}</th>
                  <th className="py-2.5 px-4">{comparison.compared_name}</th>
                  <th className="py-2.5 px-4">Absolute Delta</th>
                  <th className="py-2.5 px-4">Percent Delta</th>
                  <th className="py-2.5 px-4">Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {comparison.deltas.map((d: any, idx: number) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  >
                    <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {d.metric}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {d.baseline_value.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {d.compared_value.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-medium">
                      {d.absolute_delta > 0
                        ? `+${d.absolute_delta.toLocaleString()}`
                        : d.absolute_delta.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-medium">
                      {d.percent_delta > 0
                        ? `+${d.percent_delta}%`
                        : `${d.percent_delta}%`}
                    </td>
                    <td className="py-2.5 px-4">
                      {d.is_improvement ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Improvement</span>
                        </span>
                      ) : d.is_regression ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Regression</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">Neutral</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Comparative Visualizations: Nx Curve & Missing Regions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nx Curve */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col gap-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Comparative Nx Contiguity Curves
          </h3>
          <p className="text-xs text-slate-500">
            Nx thresholds (N10..N90). Higher curves indicate greater contiguity
            across percentiles.
          </p>
          <div className="mt-2 flex items-center justify-center">
            {nxSeries.length > 0 ? (
              <NxCurve series={nxSeries} width={520} height={320} />
            ) : (
              <div className="py-20 text-slate-400 text-xs font-mono">
                Loading Nx data...
              </div>
            )}
          </div>
        </div>

        {/* Missing Region Analysis */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col gap-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Reference Coverage & Missing Regions
          </h3>
          <p className="text-xs text-slate-500">
            Reference chromosome regions lacking alignment coverage.
          </p>
          {missingRegions && (
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Total Reference Coverage:
                </span>
                <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {missingRegions.reference_coverage_percent}%
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Detected Unaligned / Missing Intervals:
                </span>
                {missingRegions.missing_regions.map((reg: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl flex flex-col gap-1 text-xs"
                  >
                    <div className="flex items-center justify-between font-mono font-bold text-amber-900 dark:text-amber-200">
                      <span>
                        {missingRegions.reference_chromosome}:{" "}
                        {reg.start.toLocaleString()} -{" "}
                        {reg.end.toLocaleString()} bp
                      </span>
                      <span>{reg.length.toLocaleString()} bp</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      {reg.notes}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
