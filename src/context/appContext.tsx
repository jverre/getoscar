"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { type InferSelectModel } from 'drizzle-orm'
import { teams } from '@/db/schema'
import { User as SupabaseUser } from '@supabase/supabase-js'


export type Team = InferSelectModel<typeof teams>
export type User = SupabaseUser

type AppContextType = {
  // User state
  user: User | null
  isLoadingUser: boolean
  userError: Error | null
  refreshUser: () => Promise<void>

  // Teams state
  teams: Team[]
  selectedTeamId: string | null
  setSelectedTeamId: (id: string | null) => void
  createTeam: (name: string) => Promise<Team>
  isLoadingTeams: boolean
  teamsError: Error | null
  refreshTeams: () => Promise<void>
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  // User state
  const [user, setUser] = useState<User | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [userError, setUserError] = useState<Error | null>(null)

  // Teams state
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [isLoadingTeams, setIsLoadingTeams] = useState(true)
  const [teamsError, setTeamsError] = useState<Error | null>(null)

  // Initialize Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchUser = async () => {
    try {
      setIsLoadingUser(true)
      setUserError(null)
      
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      
      setUser(session?.user ?? null)
    } catch (err) {
      setUserError(err instanceof Error ? err : new Error('Failed to fetch user'))
      setUser(null)
    } finally {
      setIsLoadingUser(false)
    }
  }

  const fetchTeams = async () => {
    // Don't fetch teams if user is not authenticated
    if (!user) {
      setTeams([])
      setSelectedTeamId(null)
      setIsLoadingTeams(false)
      return
    }

    try {
      setIsLoadingTeams(true)
      setTeamsError(null)
      
      const response = await fetch('/api/teams')
      if (!response.ok) {
        throw new Error('Failed to fetch teams')
      }
      
      const data = await response.json()
      setTeams(data.teams)
      
      // Set first team as selected if none is selected
      if (!selectedTeamId && data.teams.length > 0) {
        setSelectedTeamId(data.teams[0].id)
      }
    } catch (err) {
      setTeamsError(err instanceof Error ? err : new Error('Failed to fetch teams'))
      setTeams([])
      setSelectedTeamId(null)
    } finally {
      setIsLoadingTeams(false)
    }
  }

  const createTeam = async (name: string): Promise<Team> => {
    if (!user) throw new Error('Must be authenticated to create a team')

    const response = await fetch('/api/teams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create team')
    }

    const { team } = await response.json()
    
    // Refresh teams list after creating new team
    await fetchTeams()
    
    // Set the newly created team as selected
    setSelectedTeamId(team.id)
    
    return team
  }

  // Set up auth state listener and initial fetch
  useEffect(() => {
    fetchUser() // Get initial session

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Fetch teams whenever user state changes
  useEffect(() => {
    fetchTeams()
  }, [user])

  // Set up real-time subscriptions for teams
  useEffect(() => {
    if (!user) return

    const teamsChannel = supabase
      .channel('app_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams'
        },
        () => {
          fetchTeams()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members'
        },
        () => {
          fetchTeams()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(teamsChannel)
    }
  }, [user])

  return (
    <AppContext.Provider
      value={{
        // User state
        user,
        isLoadingUser,
        userError,
        refreshUser: fetchUser,

        // Teams state
        teams,
        selectedTeamId,
        setSelectedTeamId,
        createTeam,
        isLoadingTeams,
        teamsError,
        refreshTeams: fetchTeams,
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