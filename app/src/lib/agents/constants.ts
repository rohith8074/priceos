export const MANAGER_AGENT_ID = '698ac2131fde51ca18699f08'
export const EVENT_AGENT_ID = '698ac1d55e854d000a683dbc'
export const MARKET_AGENT_ID = '698ac1d5610bcf4836c95110'
export const STRATEGY_AGENT_ID = '698ac1d6b98dfbabdd568cae'

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
