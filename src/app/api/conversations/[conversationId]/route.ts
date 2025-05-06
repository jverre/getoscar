import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, conversations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

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