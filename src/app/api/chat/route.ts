import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  Message as VercelAIMessage,
  streamText,
  StreamData
} from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openRouterApiKey = process.env.OPENROUTER_API_KEY;

if (!openRouterApiKey) {
  console.error('Missing environment variable for OpenRouter');
}

// Initialize OpenRouter provider instance (ensure API key is valid)
const openrouter = createOpenRouter({
  apiKey: openRouterApiKey!,
});

// Define the expected request body structure for clarity
interface ChatRequestBody {
  messages: VercelAIMessage[];
  conversationId?: string;
  teamId?: string;
  model?: string;
}

interface SupabaseMessage {
  id?: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  created_at?: string;
}

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Authentication error:', userError);
      return new NextResponse(
        JSON.stringify({ error: userError?.message || 'Unauthorized' }),
        { status: userError ? 500 : 401 }
      );
    }
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const userId = user.id;

    const body: ChatRequestBody = await req.json();
    const messages = body.messages ?? [];
    const userMessage = messages[messages.length - 1];
    const requestConversationId = body.conversationId;
    const teamId = body.teamId;
    const requestedModel = body.model || 'openai/gpt-4o';

    if (!messages || messages.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'Messages are required' }), { status: 400 });
    }
    if (!userMessage || userMessage.role !== 'user') {
      return new NextResponse(JSON.stringify({ error: 'Last message must be from the user' }), { status: 400 });
    }

    let resolvedConversationId: string | null = null;
    let conversationError: string | null = null;
    let isNewConversation = false;

    if (requestConversationId) {
      const { data: existingConversation, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', requestConversationId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching conversation:', fetchError);
        conversationError = 'Failed to fetch conversation details.';
      } else if (existingConversation) {
        resolvedConversationId = existingConversation.id;
      } else {
        console.log(`Conversation ${requestConversationId} not found or access denied.`);
      }
    }

    if (!resolvedConversationId && !conversationError) {
      if (!teamId) {
        return new NextResponse(JSON.stringify({ error: 'teamId is required to start a new conversation' }), { status: 400 });
      }

      const title = userMessage.content.substring(0, 50) + (userMessage.content.length > 50 ? '...' : '');

      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          team_id: teamId,
          title: title,
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating conversation:', createError);
        if (createError.code === '42501') {
          conversationError = 'Permission denied to create conversation for this team.';
        } else {
          conversationError = 'Failed to create a new conversation.';
        }
      } else if (newConversation) {
        resolvedConversationId = newConversation.id;
        isNewConversation = true;
        console.log(`Created new conversation with ID: ${resolvedConversationId}`);
      } else {
        conversationError = 'Failed to create conversation and retrieve ID.';
      }
    }

    if (!resolvedConversationId) {
      return new NextResponse(JSON.stringify({ error: conversationError || 'Could not establish conversation ID.' }), { status: 500 });
    }

    // --- 4. Fetch History ---
    let historicalMessages: VercelAIMessage[] = [];
    const { data: dbMessages, error: historyError } = await supabase
      .from('messages')
      .select('id, role, content')
      .eq('conversation_id', resolvedConversationId)
      .order('created_at', { ascending: true });

    if (historyError) {
      console.error('Error fetching message history:', historyError);
      return new NextResponse(JSON.stringify({ error: 'Failed to fetch message history' }), { status: 500 });
    }

    if (dbMessages) {
      historicalMessages = dbMessages.map(msg => ({
        id: msg.id,
        role: msg.role as VercelAIMessage['role'],
        content: msg.content
      }));
    }

    const { error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: resolvedConversationId,
        role: userMessage.role,
        content: userMessage.content,
      } as SupabaseMessage);

    if (insertError) {
      console.error('Error saving user message:', insertError);
      return new NextResponse(JSON.stringify({ error: 'Failed to save user message' }), { status: 500 });
    }

    const messagesForAI: VercelAIMessage[] = [...historicalMessages, userMessage];

    const data = new StreamData();

    const streamResult = await streamText({
      model: openrouter(requestedModel),
      messages: messagesForAI,
      onFinish: async ({ text }) => {
        if (resolvedConversationId) {
          const { error: insertAssistantError } = await supabase
            .from('messages')
            .insert({
              conversation_id: resolvedConversationId,
              role: 'assistant',
              content: text,
            } as SupabaseMessage);

          if (insertAssistantError) {
            console.error('Error saving assistant message:', insertAssistantError);
          } else {
            console.log(`Assistant message saved for conversation: ${resolvedConversationId}`);
          }
          data.close();
        }
      },
    });

    let responseOptions: ResponseInit = {};
    responseOptions.headers = {
      'X-Conversation-Id': resolvedConversationId,
    };
    return streamResult.toTextStreamResponse(responseOptions);

  } catch (error) {
    // --- Error Handling ---
    console.error('[Chat API Error]', error);
    if (error instanceof SyntaxError) {
      return new NextResponse(JSON.stringify({ error: 'Invalid JSON in request body' }), { status: 400 });
    }
    // Add more specific error handling if needed
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new NextResponse(JSON.stringify({ error: message }), { status: 500 });
  }
}
