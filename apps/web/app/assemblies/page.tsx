"use client";

import { fetchApi, uploadFileApi } from "@/lib/api";
import { useStore } from "@/lib/store";
import { Badge, Button } from "@genome-studio/ui";
import { Compass, Dna, Download, FileText, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";

function AssembliesContent() {
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get("project_id");
  const { setInspectorItem } = useStore();

  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projectIdParam || "",
  );
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Upload Form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [assemblyName, setAssemblyName] = useState("");
  const [version, setVersion] = useState("v1");
  const [assemblyType, setAssemblyType] = useState("draft");
  const [targetProjectId, setTargetProjectId] = useState(projectIdParam || "");

  const loadData = () => {
    fetchApi<any[]>("/projects").then((p) => {
      setProjects(p);
      if (!targetProjectId && p.length > 0) {
        setTargetProjectId(p[0].id);
      }
    });

    const endpoint = selectedProjectId
      ? `/assemblies?project_id=${selectedProjectId}`
      : "/assemblies";
    fetchApi<any[]>(endpoint).then((a) => setAssemblies(a));
  };

  useEffect(() => {
    loadData();
  }, [selectedProjectId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !assemblyName || !targetProjectId) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("name", assemblyName);
    formData.append("version", version);
    formData.append("assembly_type", assemblyType);
    formData.append("project_id", targetProjectId);

    try {
      await uploadFileApi("/assemblies/upload", formData);
      setShowUploadModal(false);
      setUploadFile(null);
      setAssemblyName("");
      setVersion("v1");
      loadData();
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete assembly "${name}"?`)) return;
    try {
      await fetchApi(`/assemblies/${id}`, { method: "DELETE" });
      loadData();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Assembly Catalog
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Explore indexed genome assemblies, inspect metrics, and launch
            comparisons.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Project Filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 font-medium outline-none"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <Button
            onClick={() => setShowUploadModal(true)}
            className="gap-1.5 text-xs"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Assembly</span>
          </Button>
        </div>
      </div>

      {/* Assemblies Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              <th className="py-3 px-4">Assembly Name</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Total Length</th>
              <th className="py-3 px-4">Contigs</th>
              <th className="py-3 px-4">N50</th>
              <th className="py-3 px-4">L50</th>
              <th className="py-3 px-4">GC Content</th>
              <th className="py-3 px-4">Gaps</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {assemblies.map((a) => {
              const m = a.metrics;
              return (
                <tr
                  key={a.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  onClick={() => setInspectorItem({ ...a, ...m })}
                >
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                        <Dna className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        {a.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {a.filename} ({a.version})
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        a.assembly_type === "reference"
                          ? "purple"
                          : a.assembly_type === "polished"
                            ? "emerald"
                            : "blue"
                      }
                    >
                      {a.assembly_type}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                    {m ? `${(m.total_length / 1000).toLocaleString()} kb` : "—"}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                    {m ? m.contig_count : "—"}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {m ? `${(m.n50 / 1000).toLocaleString()} kb` : "—"}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                    {m ? m.l50 : "—"}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                    {m ? `${m.gc_percent.toFixed(2)}%` : "—"}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                    {m
                      ? m.gap_count > 0
                        ? `${m.gap_count} (${m.total_gap_length} bp)`
                        : "0"
                      : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {a.status}
                    </span>
                  </td>
                  <td
                    className="py-3 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <a
                        href={`http://localhost:8000/api/v1/assemblies/${a.id}/report?format=markdown`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-500 hover:text-emerald-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Download Assembly Assessment Report (.md)"
                      >
                        <FileText className="w-4 h-4" />
                      </a>
                      <a
                        href={`http://localhost:8000/api/v1/assemblies/${a.id}/export/gaps.bed`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-500 hover:text-amber-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Export Scaffold Gaps (.bed)"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <Link
                        href={`/explorer?assembly_id=${a.id}`}
                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="View in Genome Explorer"
                      >
                        <Compass className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(a.id, a.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Delete assembly"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Upload Genomic Assembly
            </h2>
            <form
              onSubmit={handleUpload}
              className="flex flex-col gap-3 text-xs"
            >
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Target Project *
                </label>
                <select
                  required
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Assembly Name *
                </label>
                <input
                  type="text"
                  required
                  value={assemblyName}
                  onChange={(e) => setAssemblyName(e.target.value)}
                  placeholder="e.g. PacBio HiFi Polished v2"
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Version Label
                  </label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="v1, v2, final"
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Type
                  </label>
                  <select
                    value={assemblyType}
                    onChange={(e) => setAssemblyType(e.target.value)}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  >
                    <option value="draft">Draft Contigs</option>
                    <option value="polished">Polished Scaffolds</option>
                    <option value="chromosome">Chromosome Level</option>
                    <option value="reference">Reference Genome</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Select File (FASTA, FNA, FA, GFA, .gz) *
                </label>
                <input
                  type="file"
                  required
                  accept=".fasta,.fna,.fa,.gfa,.gz"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={uploading}>
                  {uploading ? "Analyzing with Rust..." : "Upload & Analyze"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AssembliesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500">
          Loading assemblies workspace...
        </div>
      }
    >
      <AssembliesContent />
    </Suspense>
  );
}
