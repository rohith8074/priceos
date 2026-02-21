import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";

interface ContextStore {
  // Current context
  contextType: "portfolio" | "property";
  propertyId: number | null;
  propertyName: string | null;

  // Date Range
  dateRange: DateRange | undefined;

  // Actions
  setPortfolioContext: () => void;
  setPropertyContext: (id: number, name: string) => void;
  setDateRange: (range: DateRange | undefined) => void;

  // UI State
  isSidebarOpen: boolean;
  toggleSidebar: () => void;

  // Sync Trigger
  marketRefreshTrigger: number;
  triggerMarketRefresh: () => void;
}

// Helper to convert JSON strings back to dates
const dateReviver = (key: string, value: any) => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    return new Date(value);
  }
  return value;
};

export const useContextStore = create<ContextStore>()(
  persist(
    (set) => ({
      // Initial state: portfolio view
      contextType: "portfolio",
      propertyId: null,
      propertyName: null,
      isSidebarOpen: true,

      // Initial Date Range (Next 30 days)
      dateRange: {
        from: new Date(),
        to: addDays(new Date(), 30),
      },

      marketRefreshTrigger: 0,

      // UI Actions
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      triggerMarketRefresh: () => set((state) => ({ marketRefreshTrigger: state.marketRefreshTrigger + 1 })),

      setDateRange: (range: DateRange | undefined) =>
        set({
          dateRange: range,
        }),

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
    }),
    {
      name: "priceos-context-storage",
      skipHydration: true, // Let component hydrate properly
      storage: createJSONStorage(() => localStorage, { reviver: dateReviver }),
    }
  )
);
