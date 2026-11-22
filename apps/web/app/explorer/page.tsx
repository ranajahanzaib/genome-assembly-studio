"use client";

import { fetchApi } from "@/lib/api";
import { useStore } from "@/lib/store";
import {
  AssemblyDotPlot,
  AssemblyGraphViewer,
  GenomeCircos,
  GenomeTrackBrowser,
} from "@genome-studio/visualization";
import { AlignLeft, CircleDot, Compass, Network } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function ExplorerContent() {
  const searchParams = useSearchParams();
  const assemblyIdParam = searchParams.get("assembly_id");
  const { setInspectorItem, currentAssemblyId, setCurrentAssembly } =
    useStore();

  const [activeTab, setActiveTab] = useState<
    "wheel" | "dotplot" | "graph" | "linear"
  >("wheel");
  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<string>(
    assemblyIdParam || currentAssemblyId || "",
  );

  // Visualization Data
  const [wheelData, setWheelData] = useState<any | null>(null);
  const [alignments, setAlignments] = useState<any[]>([]);
  const [graphData, setGraphData] = useState<any | null>(null);
  const [sequences, setSequences] = useState<any[]>([]);
  const [selectedSeqId, setSelectedSeqId] = useState<string>("");
  const [sequenceSlice, setSequenceSlice] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchApi<any[]>("/assemblies").then((asms) => {
      setAssemblies(asms);
      if (!selectedAssemblyId && asms.length > 0) {
        setSelectedAssemblyId(asms[0].id);
        setCurrentAssembly(asms[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedAssemblyId) return;
    setLoading(true);

    Promise.all([
      fetchApi<any>(`/assemblies/${selectedAssemblyId}/genome-wheel`),
      fetchApi<any>(`/assemblies/${selectedAssemblyId}/alignments`),
      fetchApi<any>(`/assemblies/${selectedAssemblyId}/graph`).catch(
        () => null,
      ),
      fetchApi<any[]>(`/assemblies/${selectedAssemblyId}/sequences`).catch(
        () => [],
      ),
    ])
      .then(([wheel, alns, graph, seqs]) => {
        setWheelData(wheel);
        setAlignments(alns?.alignments || []);
        setGraphData(graph);
        setSequences(seqs);
        if (seqs.length > 0) {
          setSelectedSeqId(seqs[0].id);
        }
      })
      .catch((err) => console.error("Error loading explorer data:", err))
      .finally(() => setLoading(false));
  }, [selectedAssemblyId]);

  useEffect(() => {
    if (!selectedAssemblyId || !selectedSeqId) return;
    fetchApi<any>(
      `/assemblies/${selectedAssemblyId}/sequence-slice?sequence=${selectedSeqId}&start=0&end=1000`,
    )
      .then((data) => setSequenceSlice(data.sequence || ""))
      .catch(() => setSequenceSlice(""));
  }, [selectedAssemblyId, selectedSeqId]);

  const activeAsm = assemblies.find((a) => a.id === selectedAssemblyId);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Interactive Genome Explorer
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Multiscale visual exploration across circular chromosomes, syntenic
            dot plots, assembly graphs, and sequence tracks.
          </p>
        </div>

        {/* Assembly Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">
            Assembly:
          </span>
          <select
            value={selectedAssemblyId}
            onChange={(e) => {
              setSelectedAssemblyId(e.target.value);
              setCurrentAssembly(e.target.value);
            }}
            className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 font-semibold text-slate-800 dark:text-slate-200 outline-none"
          >
            {assemblies.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.version})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("wheel")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === "wheel"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <CircleDot className="w-4 h-4" />
          <span>Circular Genome Wheel</span>
        </button>
        <button
          onClick={() => setActiveTab("dotplot")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === "dotplot"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Whole-Genome Dot Plot</span>
        </button>
        <button
          onClick={() => setActiveTab("graph")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === "graph"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Assembly Graph (GFA)</span>
        </button>
        <button
          onClick={() => setActiveTab("linear")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === "linear"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <AlignLeft className="w-4 h-4" />
          <span>Linear Track Browser</span>
        </button>
      </div>

      {/* Tab 1: Circular Genome Wheel */}
      {activeTab === "wheel" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col items-center gap-4">
          <div className="w-full flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Multi-Track Circos View: Chromosomes • Sliding GC% • Syntenic
              Ribbons
            </span>
            <span>Click any chromosome to open inspector</span>
          </div>

          <div className="py-4">
            {wheelData && wheelData.chromosomes ? (
              <GenomeCircos
                totalLength={wheelData.total_length}
                chromosomes={wheelData.chromosomes}
                gcBins={wheelData.gc_bins}
                ribbons={wheelData.ribbons}
                onSelectChromosome={(chr: any) => setInspectorItem(chr)}
                width={660}
                height={660}
              />
            ) : (
              <div className="py-32 text-slate-400 text-xs font-mono">
                {loading
                  ? "Generating genome wheel geometry..."
                  : "No chromosome data"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Whole-Genome Dot Plot */}
      {activeTab === "dotplot" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col items-center gap-4">
          <div className="w-full flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Pairwise Synteny Dot Plot (Reference vs Query Assembly)
            </span>
            <span>{alignments.length} alignment blocks</span>
          </div>

          <div className="py-4">
            <AssemblyDotPlot
              alignments={alignments}
              referenceLength={50000}
              assemblyLength={activeAsm?.metrics?.total_length || 50000}
              referenceName="Reference Chromosome (chr1)"
              assemblyName={
                activeAsm ? `${activeAsm.name} (${activeAsm.version})` : "Query"
              }
              onSelectAlignment={(aln: any) => setInspectorItem(aln)}
              width={700}
              height={560}
            />
          </div>
        </div>
      )}

      {/* Tab 3: Assembly Graph Explorer */}
      {activeTab === "graph" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Bandage-Style GFA Assembly Graph Navigator
            </span>
            <span>
              Drag nodes, zoom/pan to inspect repeated bubbles and dead-ends
            </span>
          </div>

          {graphData && graphData.nodes ? (
            <AssemblyGraphViewer
              nodes={graphData.nodes}
              edges={graphData.edges}
              onSelectNode={(node: any) => setInspectorItem(node)}
              width={800}
              height={500}
            />
          ) : (
            <div className="py-32 text-center text-slate-400 text-xs font-mono">
              No GFA assembly graph available for this assembly. Please upload a
              GFA file.
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Linear Track Browser */}
      {activeTab === "linear" && (
        <div className="flex flex-col gap-4">
          {/* Sequence Picker */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-400">
              Select Contig/Chromosome:
            </span>
            <select
              value={selectedSeqId}
              onChange={(e) => setSelectedSeqId(e.target.value)}
              className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-slate-800 dark:text-slate-200 font-bold"
            >
              {sequences.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.length.toLocaleString()} bp)
                </option>
              ))}
            </select>
          </div>

          <GenomeTrackBrowser
            sequenceId={selectedSeqId || "chr1"}
            sequenceLength={
              sequences.find((s) => s.id === selectedSeqId)?.length || 50000
            }
            sequenceString={sequenceSlice}
            gcBins={wheelData?.gc_bins || []}
            alignments={alignments}
            width={850}
          />
        </div>
      )}
    </div>
  );
}

export default function ExplorerPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500">
          Loading genome explorer...
        </div>
      }
    >
      <ExplorerContent />
    </Suspense>
  );
}
