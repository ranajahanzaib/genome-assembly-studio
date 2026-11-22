"use client";

import { fetchApi } from "@/lib/api";
import { useStore } from "@/lib/store";
import {
  Activity,
  Compass,
  Database,
  Dna,
  FileCheck2,
  FolderGit2,
  GitCompare,
  Layers,
  LayoutDashboard,
  Menu,
  Moon,
  Settings,
  Sun,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderGit2 },
  { href: "/assemblies", label: "Assemblies", icon: Dna },
  { href: "/compare", label: "Compare", icon: GitCompare },
  { href: "/explorer", label: "Genome Explorer", icon: Compass },
  { href: "/quality", label: "Quality Reports", icon: FileCheck2 },
  { href: "/jobs", label: "Analysis Jobs", icon: Activity },
  { href: "/datasets", label: "Data Sources", icon: Database },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    theme,
    toggleTheme,
    currentProjectId,
    setCurrentProject,
    currentAssemblyId,
    setCurrentAssembly,
    selectedInspectorItem,
    setInspectorItem,
  } = useStore();

  const [projects, setProjects] = useState<any[]>([]);
  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [engineReady, setEngineReady] = useState(true);

  useEffect(() => {
    fetchApi<any[]>("/projects")
      .then((data) => {
        setProjects(data);
        if (data.length > 0 && !currentProjectId) {
          setCurrentProject(data[0].id);
        }
      })
      .catch(() => {});

    fetchApi<any[]>("/assemblies")
      .then((data) => {
        setAssemblies(data);
        if (data.length > 0 && !currentAssemblyId) {
          setCurrentAssembly(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs animate-in fade-in"
        />
      )}

      {/* 1. Left Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen
            ? "fixed inset-y-0 left-0 z-50 flex w-64 shadow-2xl"
            : "hidden md:flex"
        } flex-col border-r border-slate-200/80 dark:border-slate-800 bg-[#0B1329] text-slate-300 transition-all duration-200 z-30 ${
          sidebarCollapsed ? "md:w-16" : "md:w-64"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 overflow-hidden"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-500 to-teal-400 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 shrink-0">
              <Dna className="w-5 h-5 text-white" />
            </div>
            {(!sidebarCollapsed || mobileMenuOpen) && (
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-white leading-tight">
                  Genome Studio
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Assembly Workspace
                </span>
              </div>
            )}
          </Link>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:inline-flex p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                }`}
                title={
                  sidebarCollapsed && !mobileMenuOpen ? item.label : undefined
                }
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`}
                />
                {(!sidebarCollapsed || mobileMenuOpen) && (
                  <span>{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Engine Status Footer */}
        <div className="p-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            {(!sidebarCollapsed || mobileMenuOpen) && (
              <div className="flex flex-col overflow-hidden">
                <span className="font-medium text-slate-200 text-[11px] leading-tight">
                  Rust Engine
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  v0.1.0 • Streaming
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 md:px-6 flex items-center justify-between shrink-0 z-20">
          {/* Left Context: Mobile hamburger & Breadcrumbs / Active Context */}
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 -ml-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Project Selector */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                Project:
              </span>
              <select
                value={currentProjectId || ""}
                onChange={(e) => setCurrentProject(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500 max-w-[240px] lg:max-w-[340px] truncate"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assembly Selector */}
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                Assembly:
              </span>
              <select
                value={currentAssemblyId || ""}
                onChange={(e) => setCurrentAssembly(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500 max-w-[220px] lg:max-w-[280px] truncate"
              >
                {assemblies.map((a) => (
                  <option key={a.id} value={a.id}>
                    {`${a.name} (${a.version})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/assemblies"
              className="inline-flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
              title="Import Assembly"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import Assembly</span>
            </Link>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
              title="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>

        {/* Page Content & Contextual Inspector Split View */}
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">{children}</main>

          {/* Contextual Inspector Sidebar */}
          {selectedInspectorItem && (
            <aside className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 overflow-y-auto flex flex-col gap-4 animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Context Inspector</span>
                </div>
                <button
                  onClick={() => setInspectorItem(null)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Inspector Content */}
              <div className="flex flex-col gap-3 text-xs">
                {Object.entries(selectedInspectorItem).map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-1">
                    <span className="font-semibold text-slate-400 uppercase text-[10px]">
                      {k}
                    </span>
                    <span className="font-mono bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200/60 dark:border-slate-700 text-slate-800 dark:text-slate-200 break-words">
                      {typeof v === "object"
                        ? JSON.stringify(v, null, 2)
                        : String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
