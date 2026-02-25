// PriceOS Lyzr Agents (Created: 2026-02-16)
export const MANAGER_AGENT_ID = '6992c6ade9c656b13d173dc2'  // CRO (Chief Revenue Officer)
export const EVENT_AGENT_ID = '6992c6ae63b7d55bbeb5ab2b'     // Event Intelligence
export const MARKET_AGENT_ID = '6992c6b0ac205f4ba27c69c3'    // Market Scanner
export const STRATEGY_AGENT_ID = '6992c6b11de6d4d0944ce3ac'  // Pricing Strategy

export const ACTIVITY_STEPS = [
  { id: 'events', label: 'Scanning events & demand signals', icon: 'Zap' },
  { id: 'market', label: 'Analyzing market & competitors', icon: 'BarChart3' },
  { id: 'strategy', label: 'Running pricing strategy', icon: 'ShieldCheck' },
  { id: 'review', label: 'Reviewing & finalizing', icon: 'Check' },
] as const

export const SUGGESTED_PROMPTS = [
  "What should I price Marina Heights for next weekend?",
  "How are competitors pricing in Downtown Dubai?",
  "What events are affecting prices this month?",
  "Should I adjust prices for Ramadan?",
  "Give me a pricing strategy for Palm Villa",
  "What's the optimal price for JBR Beach Studio tonight?",
] as const
