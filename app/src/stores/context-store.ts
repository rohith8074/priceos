import { create } from "zustand";

interface ContextStore {
  // Current context
  contextType: "portfolio" | "property";
  propertyId: number | null;
  propertyName: string | null;

  // Actions
  setPortfolioContext: () => void;
  setPropertyContext: (id: number, name: string) => void;

  // UI State
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useContextStore = create<ContextStore>((set) => ({
  // Initial state: portfolio view
  contextType: "portfolio",
  propertyId: null,
  propertyName: null,
  isSidebarOpen: true,

  // UI Actions
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  // Switch to portfolio view
  setPortfolioContext: () =>
    set({
      contextType: "portfolio",
      propertyId: null,
      propertyName: null,
    }),

  // Switch to specific property
  setPropertyContext: (id: number, name: string) =>
    set({
      contextType: "property",
      propertyId: id,
      propertyName: name,
    }),
}));
