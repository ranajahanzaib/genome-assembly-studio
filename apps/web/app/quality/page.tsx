"use client";

import { fetchApi } from "@/lib/api";
import { Badge, Card } from "@genome-studio/ui";
import {
  BuscoStackedChart,
  ContigHistogram,
  CumulativeLengthChart,
  QualityMatrix,
} from "@genome-studio/visualization";
import { FileCheck2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

export default function QualityPage() {
  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [detailedMetrics, setDetailedMetrics] = useState<Record<string, any>>(
    {},
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const asms = await fetchApi<any[]>("/assemblies");
        setAssemblies(asms);

        const details: Record<string, any> = {};
        for (const a of asms) {
          try {
            const m = await fetchApi<any>(`/assemblies/${a.id}/metrics`);
            details[a.id] = m;
          } catch {}
        }
        setDetailedMetrics(details);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Prepare Quality Matrix Rows
  const matrixRows = [
    {
      key: "total_length",
      label: "Total Assembly Length",
      unit: "bp",
      direction: "neutral" as const,
      description: "Total number of bases in all assembled sequences.",
      values: Object.fromEntries(
        assemblies.map((a) => [
          a.id,
          detailedMetrics[a.id]?.stats?.total_length ||
            a.metrics?.total_length ||
            "—",
        ]),
      ),
    },
    {
      key: "contig_count",
      label: "Contig Count",
      unit: "sequences",
      direction: "lower_better" as const,
      description:
        "Number of contigs; fewer pieces usually indicate higher assembly contiguity.",
      values: Object.fromEntries(
        assemblies.map((a) => [
          a.id,
          detailedMetrics[a.id]?.stats?.contig_count ||
            a.metrics?.contig_count ||
            "—",
        ]),
      ),
    },
    {
      key: "n50",
      label: "N50 Length",
      unit: "bp",
      direction: "higher_better" as const,
      description:
        "Length such that 50% of the entire genome is contained in contigs of this size or larger.",
      values: Object.fromEntries(
        assemblies.map((a) => [
          a.id,
          detailedMetrics[a.id]?.stats?.n50 || a.metrics?.n50 || "—",
        ]),
      ),
    },
    {
      key: "l50",
      label: "L50 Count",
      unit: "contigs",
      direction: "lower_better" as const,
      description:
        "Number of largest contigs needed to cover 50% of the assembly.",
      values: Object.fromEntries(
        assemblies.map((a) => [
          a.id,
          detailedMetrics[a.id]?.stats?.l50 || a.metrics?.l50 || "—",
        ]),
      ),
    },
    {
      key: "au_n",
      label: "auN (Area under Nx)",
      unit: "bp",
      direction: "higher_better" as const,
      description:
        "Continuity metric summarizing contig length distribution across all Nx percentiles.",
      values: Object.fromEntries(
        assemblies.map((a) => [
          a.id,
          detailedMetrics[a.id]?.stats?.au_n
            ? Math.round(detailedMetrics[a.id].stats.au_n)
            : "—",
        ]),
      ),
    },
    {
      key: "gc_percent",
      label: "GC Content",
      unit: "%",
      direction: "neutral" as const,
      description: "Percentage of canonical G and C bases.",
      values: Object.fromEntries(
        assemblies.map((a) => [
          a.id,
          detailedMetrics[a.id]?.stats?.gc_percent
            ? Number(detailedMetrics[a.id].stats.gc_percent.toFixed(2))
            : "—",
        ]),
      ),
    },
    {
      key: "gaps",
      label: "Scaffold N-Gaps",
      unit: "bp",
      direction: "lower_better" as const,
      description: "Total base pairs in runs of N-gap regions.",
      values: Object.fromEntries(
        assemblies.map((a) => [
          a.id,
          detailedMetrics[a.id]?.stats?.total_gap_length || 0,
        ]),
      ),
    },
  ];

  // Prepare BUSCO entries
  const buscoEntries = [
    {
      assemblyName: "E. coli Draft Assembly (v1)",
      completeSingleCopy: 412,
      completeDuplicated: 8,
      fragmented: 14,
      missing: 6,
      totalGenes: 440,
      completenessPercent: 95.5,
      lineage: "enterobacterales_odb10",
    },
    {
      assemblyName: "E. coli Polished Assembly (v2)",
      completeSingleCopy: 432,
      completeDuplicated: 3,
      fragmented: 4,
      missing: 1,
      totalGenes: 440,
      completenessPercent: 98.9,
      lineage: "enterobacterales_odb10",
    },
  ];

  // Cumulative curve data for first assembly
  const firstId = assemblies[0]?.id;
  const firstDetails = firstId ? detailedMetrics[firstId] : null;
  const cumulativePoints = firstDetails?.cumulative_curve || [];
  const histogramBins = firstDetails?.length_histogram || [];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Assembly Quality & Completeness Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Multi-tool quality assessments combining QUAST contiguity, BUSCO
            gene completeness, and CheckM2 contamination.
          </p>
        </div>
      </div>

      {/* 1. Metric Heatmap Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <QualityMatrix
          assemblies={assemblies.map((a) => ({
            id: a.id,
            name: a.name,
            version: a.version,
          }))}
          rows={matrixRows}
        />
      </div>

      {/* 2. BUSCO Ortholog Completeness */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              BUSCO Benchmark Gene Completeness
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Lineage: enterobacterales_odb10 (n=440)
          </span>
        </div>
        <BuscoStackedChart entries={buscoEntries} />
      </div>

      {/* 3. CheckM2 Prokaryotic Quality Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <Card className="p-5 flex flex-col justify-between gap-3 h-full">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
              CheckM2 • Draft v1
            </span>
            <Badge variant="amber">Medium Quality</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                Completeness
              </span>
              <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                94.2%
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                Contamination
              </span>
              <p className="text-xl font-bold font-mono text-amber-600">2.4%</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-mono mt-1 min-h-[32px] flex items-center">
            Model: GradientBoost_v1.0.2 • Note: Elevated duplication in inverted
            contig
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-3 h-full">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
              CheckM2 • Polished v2
            </span>
            <Badge variant="emerald">High Quality</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                Completeness
              </span>
              <p className="text-xl font-bold font-mono text-emerald-600">
                99.6%
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                Contamination
              </span>
              <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                0.3%
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-mono mt-1 min-h-[32px] flex items-center">
            Model: GradientBoost_v1.0.2 • Verified low contamination
          </p>
        </Card>
      </div>

      {/* 4. Contig Distributions & Cumulative Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col gap-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Contig Size Distribution Histogram
          </h3>
          <p className="text-xs text-slate-500">
            Frequency distribution of contig lengths across binned size ranges.
          </p>
          <div className="flex items-center justify-center mt-2">
            {histogramBins.length > 0 ? (
              <ContigHistogram bins={histogramBins} width={500} height={280} />
            ) : (
              <div className="py-20 text-slate-400 text-xs font-mono">
                Loading histogram...
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col gap-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Cumulative Contig Length Curve
          </h3>
          <p className="text-xs text-slate-500">
            Cumulative genome size reached as ranked contigs are successively
            added.
          </p>
          <div className="flex items-center justify-center mt-2">
            {cumulativePoints.length > 0 ? (
              <CumulativeLengthChart
                series={[
                  {
                    assemblyId: firstId || "1",
                    name: assemblies[0]?.name || "Assembly",
                    color: "#2563EB",
                    points: cumulativePoints,
                  },
                ]}
                referenceLength={50000}
                width={500}
                height={280}
              />
            ) : (
              <div className="py-20 text-slate-400 text-xs font-mono">
                Loading cumulative curve...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
