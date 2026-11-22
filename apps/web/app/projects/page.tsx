"use client";

import { fetchApi } from "@/lib/api";
import { Badge, Button, Card } from "@genome-studio/ui";
import { ArrowRight, Dna, FolderGit2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [organism, setOrganism] = useState("");
  const [taxonomyId, setTaxonomyId] = useState("");
  const [tagInput, setTagInput] = useState("");

  const loadProjects = () => {
    fetchApi<any[]>("/projects")
      .then((data) => setProjects(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !organism) return;
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      await fetchApi("/projects", {
        method: "POST",
        body: JSON.stringify({
          name,
          description,
          organism,
          taxonomy_id: taxonomyId,
          tags,
        }),
      });
      setShowModal(false);
      setName("");
      setDescription("");
      setOrganism("");
      setTaxonomyId("");
      setTagInput("");
      loadProjects();
    } catch (err: any) {
      alert(`Error creating project: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await fetchApi(`/projects/${id}`, { method: "DELETE" });
      loadProjects();
    } catch (err: any) {
      alert(`Error deleting project: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Genomic Projects
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage projects, group assembly iterations, and configure reference
            genomes.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-1.5 text-xs">
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => (
          <Card
            key={p.id}
            className="p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <button
                  onClick={() => handleDelete(p.id, p.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {p.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono italic mt-0.5">
                  {p.organism} {p.taxonomy_id && `(TaxID: ${p.taxonomy_id})`}
                </p>
                {p.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                    {p.description}
                  </p>
                )}
              </div>

              {/* Tags */}
              {p.tags && p.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {p.tags.map((t: string) => (
                    <Badge key={t} variant="slate">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 font-mono">
                <Dna className="w-4 h-4 text-blue-500" />
                <span>{p.assembly_count} Assemblies</span>
              </div>
              <Link
                href={`/assemblies?project_id=${p.id}`}
                className="font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>Open Project</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal Dialog for Project Creation */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Create New Project
            </h2>
            <form
              onSubmit={handleCreate}
              className="flex flex-col gap-3 text-xs"
            >
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Pseudomonas aeruginosa Analysis"
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Organism Name *
                </label>
                <input
                  type="text"
                  required
                  value={organism}
                  onChange={(e) => setOrganism(e.target.value)}
                  placeholder="e.g. Pseudomonas aeruginosa PAO1"
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  NCBI Taxonomy ID (Optional)
                </label>
                <input
                  type="text"
                  value={taxonomyId}
                  onChange={(e) => setTaxonomyId(e.target.value)}
                  placeholder="e.g. 208964"
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="bacterial, clinical, long-read"
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Objectives, sequencing platforms, or experimental context..."
                  rows={3}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Create Project
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
