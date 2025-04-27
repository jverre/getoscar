"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { type InferSelectModel } from 'drizzle-orm'
import { teams, conversations } from '@/db/schema'
import { useUser } from '@/context/user-context'

export type Team = InferSelectModel<typeof teams>
export type Conversation = InferSelectModel<typeof conversations>

type SidebarContextType = {
  // Teams state
  teams: Team[]
  selectedTeamId: string | null
  setSelectedTeamId: (id: string | null) => void
  createTeam: (name: string) => Promise<Team>
  
  // Conversations state
  conversations: Conversation[]
  
  // Loading states
  isLoadingTeams: boolean
  isLoadingConversations: boolean
  
  // Error states
  teamsError: Error | null
  conversationsError: Error | null
  
  // Refresh functions
  refreshTeams: () => Promise<void>
  refreshConversations: () => Promise<void>
}

const SidebarContext = createContext<SidebarContextType | null>(null)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Teams state
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [isLoadingTeams, setIsLoadingTeams] = useState(true)
  const [teamsError, setTeamsError] = useState<Error | null>(null)

  // Conversations state
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [conversationsError, setConversationsError] = useState<Error | null>(null)

  // Initialize Supabase client for real-time subscriptions
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { user } = useUser()

  const fetchTeams = async () => {
    try {
      setIsLoadingTeams(true)
      setTeamsError(null)
      const response = await fetch('/api/teams')
      
      if (response.status === 401) {
        // User is not authenticated, clear teams
        setTeams([])
        setSelectedTeamId(null)
        return
      }
      
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
      setTeamsError(err instanceof Error ? err : new Error('Unknown error'))
      // Clear teams on error
      setTeams([])
      setSelectedTeamId(null)
    } finally {
      setIsLoadingTeams(false)
    }
  }

  const fetchConversations = async () => {
    if (!selectedTeamId) {
      setConversations([])
      return
    }

    try {
      setIsLoadingConversations(true)
      setConversationsError(null)
      const response = await fetch('/api/conversations')
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }
      
      const data = await response.json()
      setConversations(data.conversations)
    } catch (err) {
      setConversationsError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoadingConversations(false)
    }
  }

  const createTeam = async (name: string): Promise<Team> => {
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

  // Fetch conversations when selected team changes
  useEffect(() => {
    fetchConversations()
  }, [selectedTeamId])

  // Initial teams fetch and real-time subscriptions
  useEffect(() => {
    if (user) {
      fetchTeams()
    } else {
      // Clear teams when user logs out
      setTeams([])
      setSelectedTeamId(null)
      setIsLoadingTeams(false)
      setTeamsError(null)
    }

    // Subscribe to changes in teams and team_members tables
    const teamsChannel = supabase
      .channel('sidebar_changes')
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(teamsChannel)
    }
  }, [user])

  return (
    <SidebarContext.Provider
      value={{
        teams,
        selectedTeamId,
        setSelectedTeamId,
        createTeam,
        conversations,
        isLoadingTeams,
        isLoadingConversations,
        teamsError,
        conversationsError,
        refreshTeams: fetchTeams,
        refreshConversations: fetchConversations,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}