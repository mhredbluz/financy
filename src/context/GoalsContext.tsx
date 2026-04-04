import { createContext, useContext } from 'react'
import type { Goal } from '../types'

interface GoalsContextValue {
  goals: Goal[]
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>
}

const GoalsContext = createContext<GoalsContextValue | null>(null)

export function GoalsProvider({ value, children }: { value: GoalsContextValue; children: React.ReactNode }) {
  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>
}

export function useGoalsContext(): GoalsContextValue {
  const ctx = useContext(GoalsContext)
  if (!ctx) {
    throw new Error('useGoalsContext must be used within GoalsProvider')
  }
  return ctx
}
