import { NextResponse } from "next/server"
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = await createClient();

    try {
        // Get the current user's session
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        
        // Get all teams the user is a member of, including team details
        const { data: teams, error: teamsError } = await supabase
            .from('team_members')
            .select(`
        teams (
          id,
          name,
          created_at
        )
      `)
            .eq('user_id', user.id)

        if (teamsError) throw teamsError

        // Transform the response to flatten the structure
        const flattenedTeams = teams.map(team => team.teams)

        return NextResponse.json({ teams: flattenedTeams })
    } catch (error) {
        console.error('Error fetching teams:', error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();

    try {
        // Get the current user's session
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get the team name from the request body
        const { name } = await request.json()

        if (!name || typeof name !== 'string') {
            return NextResponse.json(
                { error: "Team name is required" },
                { status: 400 }
            )
        }

        // Start a transaction to create team and add member
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .insert([
                {
                    name,
                    created_at: new Date().toISOString()
                }
            ])
            .select()
            .single()

        if (teamError) throw teamError

        // Add the current user as a team member
        const { error: memberError } = await supabase
            .from('team_members')
            .insert([
                {
                    team_id: team.id,
                    user_id: user.id,
                    created_at: new Date().toISOString()
                }
            ])

        if (memberError) {
            // If adding member fails, we should try to delete the team
            await supabase
                .from('teams')
                .delete()
                .eq('id', team.id)

            throw memberError
        }

        return NextResponse.json({
            team: {
                id: team.id,
                name: team.name,
                created_at: team.created_at
            }
        })

    } catch (error) {
        console.error('Error creating team:', error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}