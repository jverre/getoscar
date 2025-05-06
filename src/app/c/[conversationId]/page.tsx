'use client';

import { useEffect } from 'react'; // Import useEffect
import { useParams, useRouter } from 'next/navigation';
import { ChatConversation } from '@/components/chat/chatMessages'; // Assuming component exists
import { ChatInput } from '@/components/chat/chatInput'; // Assuming component exists
import { useChatStream, Message } from '@/context/chatStreamContext'; // Import context hook and Message type

export default function ChatPage() {
  const params = useParams();
  const router = useRouter(); // Get router instance if needed for navigation/checks
  const conversationId = params.conversationId as string; // Extract conversation ID from URL

  // Connect to the chat stream context
  const {
    getMessages,
    getStreamStatus,
    loadConversationMessages,
    // clearChatState, // Optionally use for cleanup
    // sendMessage // Placeholder for sending subsequent messages
  } = useChatStream();

  // Get the current messages and stream status for this conversation ID
  const messages = getMessages(conversationId);
  const status = getStreamStatus(conversationId);

  // Effect for logging or potentially handling redirects/cleanup
  useEffect(() => {
    // Log status when component mounts or status changes
    console.log(`ChatPage mounted/updated for ${conversationId}. Status: ${status}`);

    // Optional: Check if the conversation exists in context.
    // If not, it might mean the user navigated directly here without starting
    // a chat or the context state was lost. Decide how to handle this.
    if (!conversationId || (status === 'idle' && messages.length === 0)) {
       console.warn(`No active stream or messages found in context for ${conversationId}. Possible direct navigation or state loss.`);
       // Example: Redirect back home if no chat found for this ID
       // alert('Chat session not found. Redirecting home.');
       // router.push('/');
    }

    // Optional: Cleanup when the component unmounts
    // return () => {
    //   console.log(`ChatPage unmounting for ${conversationId}.`);
    //   // Decide if you want to clear the state for this chat when navigating away.
    //   // clearChatState(conversationId);
    // };

    // Dependencies ensure the effect runs if the ID or status changes.
  }, [conversationId, status, messages.length, router]); // Added messages.length to re-check existence

  useEffect(() => {
    loadConversationMessages(conversationId);
  }, [conversationId, loadConversationMessages]);

  // --- TODO: Implement sending SUBSEQUENT messages ---
  // This function needs to be implemented based on how your API
  // handles messages sent *after* the initial one that started the stream.
  const submitData = async (messageText: string) => {
    if (!conversationId || !messageText.trim()) {
      console.warn("Cannot send message: Missing conversation ID or empty text.");
      return;
    }

    console.log(`Attempting to send message for ${conversationId}: ${messageText}`);

    // Placeholder - Replace with actual logic
    alert(`Sending subsequent messages is not implemented yet.
Needs API endpoint and context integration for conversation: ${conversationId}`);
  };

  if (status === 'reading') {
    return <div>Loading messages...</div>;
  }

  if (status === 'error') {
    return <div>Error loading messages</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto p-4">
          <div className="w-full max-w-3xl mx-auto space-y-4">
              <ChatConversation conversationId={conversationId} />
          </div>
      </div>

      <div className="shrink-0 border-t border-gray-200 p-4 bg-white">
        <div className="w-full max-w-3xl mx-auto">
          <ChatInput
            onSubmit={submitData}
            disabled={status === 'done' || status === 'error' /*|| status === 'reading'*/}
          />
        </div>
      </div>
    </div>
  );
}