import { create } from "zustand";

export interface GlobalState {
  currentProjectId: string | null;
  currentAssemblyId: string | null;
  theme: "light" | "dark";
  selectedInspectorItem: any | null;
  setCurrentProject: (id: string | null) => void;
  setCurrentAssembly: (id: string | null) => void;
  toggleTheme: () => void;
  setInspectorItem: (item: any | null) => void;
}

export const useStore = create<GlobalState>((set) => ({
  currentProjectId: null,
  currentAssemblyId: null,
  theme: "light",
  selectedInspectorItem: null,
  setCurrentProject: (id) => set({ currentProjectId: id }),
  setCurrentAssembly: (id) => set({ currentAssemblyId: id }),
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "light" ? "dark" : "light";
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", next === "dark");
      }
      return { theme: next };
    }),
  setInspectorItem: (item) => set({ selectedInspectorItem: item }),
}));
