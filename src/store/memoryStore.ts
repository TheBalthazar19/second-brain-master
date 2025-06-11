import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Memory } from '@/types'

interface MemoryStore {
  memories: Memory[]
  totalMemories: number
  currentPage: number
  searchQuery: string
  selectedTags: string[]
  isLoading: boolean
  error: string | null

  // Actions
  setMemories: (memories: Memory[]) => void
  addMemory: (memory: Memory) => void
  updateMemory: (id: string, updates: Partial<Memory>) => void
  removeMemory: (id: string) => void
  setSearchQuery: (query: string) => void
  setSelectedTags: (tags: string[]) => void
  setCurrentPage: (page: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  memories: [],
  totalMemories: 0,
  currentPage: 1,
  searchQuery: '',
  selectedTags: [],
  isLoading: false,
  error: null,
}

export const useMemoryStore = create<MemoryStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setMemories: (memories) =>
        set({ memories }, false, 'setMemories'),

      addMemory: (memory) =>
        set(
          (state) => ({
            memories: [memory, ...state.memories],
            totalMemories: state.totalMemories + 1,
          }),
          false,
          'addMemory'
        ),

      updateMemory: (id, updates) =>
        set(
          (state) => ({
            memories: state.memories.map((memory) =>
              memory.id === id ? { ...memory, ...updates } : memory
            ),
          }),
          false,
          'updateMemory'
        ),

      removeMemory: (id) =>
        set(
          (state) => ({
            memories: state.memories.filter((memory) => memory.id !== id),
            totalMemories: state.totalMemories - 1,
          }),
          false,
          'removeMemory'
        ),

      setSearchQuery: (searchQuery) =>
        set({ searchQuery, currentPage: 1 }, false, 'setSearchQuery'),

      setSelectedTags: (selectedTags) =>
        set({ selectedTags, currentPage: 1 }, false, 'setSelectedTags'),

      setCurrentPage: (currentPage) =>
        set({ currentPage }, false, 'setCurrentPage'),

      setLoading: (isLoading) =>
        set({ isLoading }, false, 'setLoading'),

      setError: (error) =>
        set({ error }, false, 'setError'),

      reset: () =>
        set(initialState, false, 'reset'),
    }),
    { name: 'memory-store' }
  )
)