"use client"

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { type InferSelectModel } from 'drizzle-orm'
import { teams, conversations as conversationsSchema } from '@/db/schema'
import { User as SupabaseUser } from '@supabase/supabase-js'

type AppContextType = {
  // User state
  selectedTeamId: string | null
  setSelectedTeamId: (id: string | null) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  // User state
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  return (
    <AppContext.Provider
      value={{
        // User state
        selectedTeamId,
        setSelectedTeamId,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

// Custom hook to use the app context
export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}