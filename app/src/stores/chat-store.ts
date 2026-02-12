import { create } from 'zustand'
import type { ChatMessage } from '@/types/chat'

interface ChatStore {
  isOpen: boolean
  messages: ChatMessage[]
  isLoading: boolean
  activityStep: number | null
  sessionId: string
  contextPrompt: string | null
  open: (contextPrompt?: string) => void
  close: () => void
  toggle: () => void
  addMessage: (message: ChatMessage) => void
  setMessages: (messages: ChatMessage[]) => void
  setLoading: (loading: boolean) => void
  setActivityStep: (step: number | null) => void
  resetSession: () => void
  clearMessages: () => void
}

function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  messages: [],
  isLoading: false,
  activityStep: null,
  sessionId: generateSessionId(),
  contextPrompt: null,
  open: (contextPrompt?: string) =>
    set({ isOpen: true, contextPrompt: contextPrompt ?? null }),
  close: () => set({ isOpen: false, contextPrompt: null }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set({ messages }),
  setLoading: (loading) => set({ isLoading: loading }),
  setActivityStep: (step) => set({ activityStep: step }),
  resetSession: () =>
    set({
      messages: [],
      sessionId: generateSessionId(),
      activityStep: null,
      isLoading: false,
      contextPrompt: null,
    }),
  clearMessages: () => set({ messages: [] }),
}))
