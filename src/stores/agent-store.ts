import { create } from 'zustand'
import {
  MANAGER_AGENT_ID,
  EVENT_AGENT_ID,
  MARKET_AGENT_ID,
  STRATEGY_AGENT_ID,
} from '@/lib/agents/constants'

interface AgentInfo {
  id: string
  name: string
  status: 'idle' | 'active' | 'error'
}

interface AgentStore {
  agents: AgentInfo[]
  activeAgentId: string | null
  setActiveAgent: (id: string | null) => void
  setAgentStatus: (id: string, status: AgentInfo['status']) => void
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: [
    { id: MANAGER_AGENT_ID, name: 'Manager', status: 'idle' },
    { id: EVENT_AGENT_ID, name: 'Event Intelligence', status: 'idle' },
    { id: MARKET_AGENT_ID, name: 'Market Scanner', status: 'idle' },
    { id: STRATEGY_AGENT_ID, name: 'Strategy Engine', status: 'idle' },
  ],
  activeAgentId: null,
  setActiveAgent: (id) => set({ activeAgentId: id }),
  setAgentStatus: (id, status) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === id ? { ...a, status } : a
      ),
    })),
}))
