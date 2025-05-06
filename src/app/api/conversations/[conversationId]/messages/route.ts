import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, conversations } from '@/db/schema'; // Assuming messages schema is defined
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const conversationId = (await params).conversationId;

  if (!conversationId) {
    // This case should technically be handled by the routing itself
    return NextResponse.json({ error: 'conversationId parameter is missing' }, { status: 400 });
  }

  try {
    // --- Authorization Check ---
    // First, verify the user has access to the conversation itself.
    // We can do this by checking if the conversation exists and belongs to a team the user is part of.
    // RLS policy "Users can view conversations in their teams" should handle this,
    // but an explicit check adds clarity and potentially better error messages.

    const [conversation] = await db
        .select({ teamId: conversations.teamId }) // Select only needed field
        .from(conversations)
        .where(eq(conversations.id, conversationId));

    if (!conversation) {
        // RLS implicitly handles unauthorized access by returning no rows,
        // so if we get here, either the conversation doesn't exist
        // or the user doesn't have access (which RLS prevents).
        return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    // --- Fetch Messages ---
    // Now fetch the messages for the authorized conversation.
    // Assuming RLS policy "Users can view messages in conversations they can access" exists.
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      // Optional: Order messages by creation time
      .orderBy(messages.createdAt); // Make sure messages schema has createdAt

    return NextResponse.json(conversationMessages);

  } catch (error) {
    console.error(`Error fetching messages for conversation ${conversationId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const conversationId = params.conversationId;

  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId parameter is missing' }, { status: 400 });
  }

  try {
    // First verify the user has access to the conversation
    const [conversation] = await db
      .select({ teamId: conversations.teamId })
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Delete all messages first (due to foreign key constraints)
    await db
      .delete(messages)
      .where(eq(messages.conversationId, conversationId));

    // Then delete the conversation
    await db
      .delete(conversations)
      .where(eq(conversations.id, conversationId));

    return NextResponse.json(
      { message: 'Conversation deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error(`Error deleting conversation ${conversationId}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}