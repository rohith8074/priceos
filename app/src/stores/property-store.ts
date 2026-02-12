import { create } from 'zustand'
import type { Listing } from '@/types/hostaway'

interface PropertyStore {
  activeProperty: Listing | null
  properties: Listing[]
  setActiveProperty: (property: Listing | null) => void
  setProperties: (properties: Listing[]) => void
}

export const usePropertyStore = create<PropertyStore>((set) => ({
  activeProperty: null,
  properties: [],
  setActiveProperty: (property) => set({ activeProperty: property }),
  setProperties: (properties) => set({ properties }),
}))
