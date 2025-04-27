'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { profiles, teams, teamMembers, users } from '@/db/schema'
import { createClient } from '@/lib/supabase/server'

// Helper function to create initial user data
async function createUserData(userId: string) {
    try {
        console.log("Creating user data for", userId)
        await db.transaction(async (tx) => {
            // Create user profile
            await tx.insert(users).values({
                id: userId,
                createdAt: new Date(),
            });

            await tx.insert(profiles).values({
                id: userId,
                createdAt: new Date(),
            });

            // Create default team
            const [team] = await tx.insert(teams).values({
                name: 'My Team',
                createdAt: new Date(),
            }).returning();

            // Add user to team
            await tx.insert(teamMembers).values({
                userId: userId,
                teamId: team.id,
                createdAt: new Date(),
            });
        });
        return { success: true };
    } catch (error) {
        console.error('Error creating user data:', error);
        return { success: false, error };
    }
}

// Password-based signup
export async function signupWithPassword(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: 'Email and password are required' }
    }

    try {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
            },
        })

        if (signUpError) throw signUpError
        if (!authData.user) throw new Error('No user returned from signup')

        // Create user data
        const { success, error: dataError } = await createUserData(authData.user.id)
        if (!success) throw dataError

        revalidatePath('/', 'layout')
        return { success: true }
    } catch (error) {
        console.error('Signup error:', error)
        return { error: 'Signup failed. Please try again.' }
    }
}

// OAuth signup with Google
export async function signupWithGoogle(redirectUrl: string) {
    const supabase = await createClient()
    console.log("redirectUrl", redirectUrl)

    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl
            },
        })

        if (error) throw error

        // The OAuth flow will redirect to the callback URL
        // where handleGoogleCallback should be called
        return { data }
    } catch (error) {
        console.error('Google signup error:', error)
        return { error: 'Google signup failed. Please try again.' }
    }
}

// OAuth signup with GitHub
export async function signupWithGithub(redirectUrl: string) {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: redirectUrl,
            },
        })

        if (error) throw error

        return { data }
    } catch (error) {
        console.error('GitHub signup error:', error)
        return { error: 'GitHub signup failed. Please try again.' }
    }
}

// Handle OAuth callback and data creation
export async function handleAuthCallback(userId: string) {
    if (!userId) {
        console.error('No user ID provided to handleAuthCallback')
        return { error: 'No user ID provided' }
    }

    try {
        // Check if profile already exists
        const existingProfile = await db.query.profiles.findFirst({
            where: (profiles, { eq }) => eq(profiles.id, userId)
        })

        // Only create data if profile doesn't exist
        if (!existingProfile) {
            const { success, error } = await createUserData(userId)
            if (!success) throw error
        }

        return { success: true }
    } catch (error) {
        console.error('Error in auth callback:', error)
        return { error: 'Failed to setup user data' }
    }
}

export async function handleGoogleCallback() {
    const supabase = await createClient()

    // Get session to verify authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) {
        return { error: 'No authenticated user found' }
    }

    // Create user data using existing handleAuthCallback
    return handleAuthCallback(session.user.id)
}