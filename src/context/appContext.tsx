"use client"

import { createContext, useContext, useState } from 'react'

type AppContextType = {
  // User state
  selectedTeamId: string | null
  setSelectedTeamId: (id: string | null) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
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