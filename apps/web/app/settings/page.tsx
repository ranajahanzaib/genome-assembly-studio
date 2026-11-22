"use client";

import { fetchApi } from "@/lib/api";
import { Badge, Card } from "@genome-studio/ui";
import { Cpu, Settings } from "lucide-react";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<any[]>("/tools")
      .then((data) => setTools(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Tool Management & Integration Status
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verify installed bioinformatics binaries, database releases, and
            execution environments.
          </p>
        </div>
      </div>

      {/* Tool Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((t) => (
          <Card
            key={t.tool}
            className="p-6 flex flex-col justify-between gap-4 shadow-xs"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      t.available
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {t.name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {t.tool}
                    </span>
                  </div>
                </div>

                <Badge variant={t.available ? "emerald" : "slate"}>
                  {t.available ? "Available" : "Not Installed"}
                </Badge>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t.description}
              </p>

              {/* Status details */}
              <div className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Version:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {t.version || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Binary Path:</span>
                  <span
                    className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]"
                    title={t.path || "None"}
                  >
                    {t.path || "Not found"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Database:</span>
                  <span className="text-slate-700 dark:text-slate-300 text-right">
                    {t.database_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Installation Instructions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-400 uppercase text-[10px] block mb-1">
                Setup Command / Guide:
              </span>
              <div className="font-mono text-[11px] bg-slate-900 text-slate-200 p-2 rounded">
                {t.instructions}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
