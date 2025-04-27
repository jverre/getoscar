import { createBrowserClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { handleAuthCallback } from '@/app/signup/actions'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  console.log("code", code)

  if (code) {
    const supabase = await createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Exchange the code for a session
    const { data: { session }, error: authError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=Authentication failed`)
    }

    if (!session?.user?.id) {
      return NextResponse.redirect(`${requestUrl.origin}/login?error=No user found`)
    }

    // Create user data using the existing handleAuthCallback function
    const { error } = await handleAuthCallback(session.user.id)
    
    if (error) {
      console.error('Data creation error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=Failed to setup account`)
    }

    // Successful auth and data creation
    return NextResponse.redirect(requestUrl.origin)
  }

  // No code present in URL
  return NextResponse.redirect(`${requestUrl.origin}/login?error=No code provided`)
}