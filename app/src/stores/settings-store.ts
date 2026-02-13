import { create } from "zustand";

interface SettingsStore {
  autoApproveLowRisk: boolean;
  setAutoApproveLowRisk: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  autoApproveLowRisk: false,
  setAutoApproveLowRisk: (value) => set({ autoApproveLowRisk: value }),
}));
