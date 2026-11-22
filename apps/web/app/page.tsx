"use client";

import { fetchApi } from "@/lib/api";
import { useStore } from "@/lib/store";
import { MetricCard } from "@genome-studio/ui";
import { GenomeCircos } from "@genome-studio/visualization";
import {
  Activity,
  ArrowUpRight,
  Compass,
  Database,
  Dna,
  FolderGit2,
  GitCompare,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function OverviewPage() {
  const { setInspectorItem } = useStore();
  const [projects, setProjects] = useState<any[]>([]);
  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [activeAssembly, setActiveAssembly] = useState<any | null>(null);
  const [wheelData, setWheelData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [projs, asms] = await Promise.all([
          fetchApi<any[]>("/projects"),
          fetchApi<any[]>("/assemblies"),
        ]);
        setProjects(projs);
        setAssemblies(asms);

        if (asms.length > 0) {
          const selected = asms.find((a) => a.metrics !== null) || asms[0];
          setActiveAssembly(selected);
          const wheel = await fetchApi<any>(
            `/assemblies/${selected.id}/genome-wheel`,
          );
          setWheelData(wheel);
        }
      } catch (e) {
        console.error("Failed to load dashboard data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalBases = assemblies.reduce(
    (sum, a) => sum + (a.metrics?.total_length || 0),
    0,
  );
  const totalSequences = assemblies.reduce(
    (sum, a) => sum + (a.metrics?.sequence_count || 0),
    0,
  );
  const bestN50 = Math.max(0, ...assemblies.map((a) => a.metrics?.n50 || 0));

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B1329] via-[#111C3D] to-[#1E293B] border border-slate-800 p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold w-fit">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Research-Grade Genome Analytics Platform</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Genome Assembly Studio
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            High-performance visual workspace for exploring genome assemblies,
            assessing their analytical depth, investigating structural
            misassemblies, and comparing assembly iterations.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <Link
              href="/compare"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
            >
              <GitCompare className="w-4 h-4" />
              <span>Open Comparison Studio</span>
            </Link>
            <Link
              href="/explorer"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Genome Wheel</span>
            </Link>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-15 pointer-events-none">
          <Dna className="w-96 h-96 text-blue-400" />
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Projects"
          value={projects.length}
          subtext="Active genomic workspaces"
          icon={<FolderGit2 className="w-5 h-5" />}
        />
        <MetricCard
          label="Assemblies Evaluated"
          value={assemblies.length}
          subtext={`${totalSequences} sequences processed`}
          icon={<Dna className="w-5 h-5" />}
        />
        <MetricCard
          label="Total Genomic Bases"
          value={`${(totalBases / 1000).toLocaleString()}`}
          unit="kbp"
          subtext="Processed by Rust streaming engine"
          icon={<Database className="w-5 h-5" />}
        />
        <MetricCard
          label="Peak N50 Contiguity"
          value={bestN50 > 0 ? `${(bestN50 / 1000).toLocaleString()}` : "—"}
          unit="kbp"
          subtext="Reference benchmark (50 kb)"
          trend={{ value: "+300% (v1 → v2)", isPositive: true }}
          icon={<Activity className="w-5 h-5" />}
        />
      </div>

      {/* Featured Visual: Interactive Circular Genome Wheel Preview & Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Genome Wheel */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Featured Assembly Visualization
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {activeAssembly
                  ? `${activeAssembly.name} (${activeAssembly.version})`
                  : "Genome Wheel"}
              </h2>
            </div>
            <Link
              href="/explorer"
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              <span>Full Explorer</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex items-center justify-center p-2">
            {wheelData && wheelData.chromosomes ? (
              <GenomeCircos
                totalLength={wheelData.total_length}
                chromosomes={wheelData.chromosomes}
                gcBins={wheelData.gc_bins}
                ribbons={wheelData.ribbons}
                onSelectChromosome={(chr: any) => setInspectorItem(chr)}
                width={520}
                height={520}
              />
            ) : (
              <div className="py-24 text-slate-400 text-xs font-mono">
                {loading
                  ? "Calculating genome wheel..."
                  : "No assembly data available"}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Projects & Quick Findings */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Projects Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Recent Projects
              </h3>
              <Link
                href="/projects"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
            </div>
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
              {projects.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  href={`/assemblies?project_id=${p.id}`}
                  className="py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg px-2 -mx-2 transition-colors flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                      {p.name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono italic">
                      {p.organism}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {p.assembly_count} assemblies
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Comparison Highlights */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Demonstration Highlights
              </h3>
              <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded font-semibold">
                Verified Fixtures
              </span>
            </div>
            <div className="flex flex-col gap-2.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  N50 Contiguity Quadrupled (+300%)
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Polished v2 achieved an N50 of 16,000 bp compared to 4,000 bp
                  in draft v1.
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Gaps Closed & Reference Fraction 99.6%
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Scaffold N-gaps were closed and uncovered reference intervals
                  were reduced to 200 bp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
