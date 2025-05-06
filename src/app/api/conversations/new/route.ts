import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { conversations } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {  
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Auth error:', authError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let teamId: string | null = null;
  try {
    const body = await request.json();
    teamId = body.teamId;
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
  }

  // Basic validation (can add more specific UUID check if needed)
  if (typeof teamId !== 'string' || teamId.length === 0) {
       return NextResponse.json({ error: 'Invalid teamId format' }, { status: 400 });
  }


  try {
    // --- Create Conversation ---
    const newConversationId = crypto.randomUUID(); // Generate ID on the server
    const [newConversation] = await db
      .insert(conversations)
      .values({
        id: newConversationId,
        teamId: teamId,
        userId: user.id, // Associate with the user who created it
        title: 'New Chat', // Default title
        // Add other default values as needed per your schema
      })
      .returning({ id: conversations.id }); // Return the inserted ID

    if (!newConversation || !newConversation.id) {
        throw new Error("Failed to insert conversation or retrieve ID.");
    }

    console.log(`Conversation ${newConversation.id} created for user ${user.id} in team ${teamId}`);

    // --- Return the new ID ---
    return NextResponse.json({ conversationId: newConversation.id });

  } catch (error) {
    console.error('Error creating new conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}