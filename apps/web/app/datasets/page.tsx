"use client";

import { fetchApi } from "@/lib/api";
import { Badge, Button, Card } from "@genome-studio/ui";
import { CheckCircle2, Database, ExternalLink, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export default function DatasetsPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [seededStatus, setSeededStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchApi<any[]>("/datasets").then((data) => setSources(data));
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetchApi<any>("/datasets/seed-demo", {
        method: "POST",
      });
      setSeededStatus("Demonstration project loaded successfully!");
      setTimeout(() => setSeededStatus(null), 4000);
    } catch (err: any) {
      alert(`Seeding error: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Genomic Data Sources & Benchmarks
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Connect external repositories (NCBI, GTDB, OpenGenome2) or load
            pre-analyzed demonstration benchmarks.
          </p>
        </div>

        <Button
          onClick={handleSeed}
          disabled={seeding}
          className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
        >
          <Sparkles className="w-4 h-4" />
          <span>
            {seeding ? "Analyzing Fixtures..." : "Re-Seed Demo Dataset"}
          </span>
        </Button>
      </div>

      {seededStatus && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{seededStatus}</span>
        </div>
      )}

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sources.map((src) => (
          <Card
            key={src.id}
            className="p-6 flex flex-col justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {src.name}
                </span>
                <Badge variant="blue">Supported Source</Badge>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {src.description}
              </p>
              <div className="mt-2 text-xs font-mono text-slate-500 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-400 block text-[10px] uppercase">
                  Supported Identifier Format:
                </span>
                {src.supported_accessions}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Official Repository</span>
              <a
                href={src.documentation}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>Documentation</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
