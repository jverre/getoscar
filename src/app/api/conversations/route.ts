import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db'; // Assuming db instance is configured and exported from @/db
import { conversations } from '@/db/schema'; // Assuming schema objects are exported from @/db/schema
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server'; // Assuming Supabase server client helper

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const teamId = searchParams.get('teamId');

  if (!teamId) {
    return NextResponse.json(
      { error: 'teamId query parameter is required' },
      { status: 400 },
    );
  }

  // Validate if teamId is a valid UUID if necessary, though the DB query will likely handle malformed ones.

  try {
    // RLS policy "Users can view conversations in their teams" automatically
    // ensures that the user making the request is part of the specified teamId.
    const teamConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.teamId, teamId));

    return NextResponse.json(teamConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    // Consider more specific error handling based on potential DB errors
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 },
    );
  }
}
