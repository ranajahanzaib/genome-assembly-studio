"use client";

import { fetchApi } from "@/lib/api";
import { Badge, Button, Card } from "@genome-studio/ui";
import { Activity, Play, Terminal } from "lucide-react";
import React, { useEffect, useState } from "react";

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [assemblies, setAssemblies] = useState<any[]>([]);

  // Launch job state
  const [selectedAssemblyId, setSelectedAssemblyId] = useState("");
  const [selectedTool, setSelectedTool] = useState("quast");
  const [launching, setLaunching] = useState(false);

  const loadJobs = () => {
    fetchApi<any[]>("/analyses/jobs").then((data) => {
      setJobs(data);
      if (data.length > 0 && !selectedJob) {
        setSelectedJob(data[0]);
      }
    });
  };

  useEffect(() => {
    fetchApi<any[]>("/assemblies").then((asms) => {
      setAssemblies(asms);
      if (asms.length > 0) setSelectedAssemblyId(asms[0].id);
    });
    loadJobs();
    const timer = setInterval(loadJobs, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleStartJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssemblyId) return;
    setLaunching(true);
    try {
      await fetchApi("/analyses/start", {
        method: "POST",
        body: JSON.stringify({
          assembly_id: selectedAssemblyId,
          tool_name: selectedTool,
        }),
      });
      loadJobs();
    } catch (err: any) {
      alert(`Failed to start job: ${err.message}`);
    } finally {
      setLaunching(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await fetchApi(`/analyses/jobs/${id}/cancel`, { method: "POST" });
      loadJobs();
    } catch (err: any) {
      alert(`Cancel error: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Analysis Job Pipeline
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor background scientific tool executions, stages, resource
            tracking, and raw terminal logs.
          </p>
        </div>
      </div>

      {/* Start New Analysis Form */}
      <Card className="p-5">
        <form
          onSubmit={handleStartJob}
          className="flex flex-wrap items-end gap-4 text-xs"
        >
          <div className="flex flex-col gap-1 min-w-[240px]">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Target Assembly
            </label>
            <select
              value={selectedAssemblyId}
              onChange={(e) => setSelectedAssemblyId(e.target.value)}
              className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-semibold text-slate-800 dark:text-slate-200"
            >
              {assemblies.map((a) => (
                <option key={a.id} value={a.id}>
                  {`${a.name} (${a.version})`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 min-w-[200px]">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Analysis Module
            </label>
            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-semibold text-slate-800 dark:text-slate-200"
            >
              <option value="quast">
                QUAST (Contiguity & Reference Fraction)
              </option>
              <option value="busco">BUSCO (Ortholog Completeness)</option>
              <option value="checkm2">
                CheckM2 (Microbial Quality & Contamination)
              </option>
              <option value="minimap2">
                minimap2 (Assembly-to-Reference Alignment)
              </option>
            </select>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={launching}
            className="gap-1.5 h-[38px]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Queue Analysis Job</span>
          </Button>
        </form>
      </Card>

      {/* Split View: Jobs List & Log Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Jobs List */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Execution History
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {jobs.length} jobs
            </span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
            {jobs.map((j) => {
              const isSelected = selectedJob?.id === j.id;
              const isCompleted = j.status === "completed";
              const isFailed = j.status === "failed";
              const isRunning = j.status === "running";

              return (
                <div
                  key={j.id}
                  onClick={() => setSelectedJob(j)}
                  className={`p-4 transition-colors cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? "bg-blue-50/60 dark:bg-blue-950/20"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        {j.tool_name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        Job #{j.id.slice(0, 8)}
                      </span>
                    </div>
                    <Badge
                      variant={
                        isCompleted
                          ? "emerald"
                          : isFailed
                            ? "rose"
                            : isRunning
                              ? "blue"
                              : "slate"
                      }
                    >
                      {j.status}
                    </Badge>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${j.progress}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted
                          ? "bg-emerald-500"
                          : isFailed
                            ? "bg-rose-500"
                            : "bg-blue-600 animate-pulse"
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Stage: {j.stage}</span>
                    <span className="font-mono">
                      {new Date(j.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Job Details & Raw Terminal Logs */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-500" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Execution Terminal Logs
              </span>
            </div>
            {selectedJob && selectedJob.status === "running" && (
              <button
                onClick={() => handleCancel(selectedJob.id)}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700"
              >
                Cancel Job
              </button>
            )}
          </div>

          <div className="p-4 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto min-h-[380px] max-h-[500px]">
            {selectedJob ? (
              <pre className="whitespace-pre-wrap leading-relaxed">
                {selectedJob.logs || "No log output recorded yet."}
              </pre>
            ) : (
              <div className="text-slate-500 italic">
                Select a job to view output.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
