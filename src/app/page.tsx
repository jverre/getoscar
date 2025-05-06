'use client';

import { useApp } from '@/context/appContext';
import { ChatInput } from '@/components/chat/chatInput';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { useChatStream } from '@/context/chatStreamContext';
import { ChatMessages } from '@/components/chat/chatMessages';
import { Id } from '@/../convex/_generated/dataModel';
import { useAuthToken } from '@convex-dev/auth/react';

export default function HomePage() {
  console.log('HomePage');
  const { selectedTeamId } = useApp();
  const { startChatStream, getMessages } = useChatStream();
  
  const messages = getMessages('home') ?? [];
  const sendMessage = useMutation(api.messages.send);

  const token = useAuthToken();
  console.log('token', token);
  const submitData = async (messageText: string, selectedModel: string) => {
    if (!messageText.trim() || !selectedTeamId) return;

    // Create initial message
    const userMessage = {
      id: `user-${Date.now()}`,
      text: messageText,
      sender: 'user',
      timestamp: Date.now()
    };

    try {
      // Send message to Convex
      const result = await sendMessage({
        content: messageText,
        role: 'user',
        teamId: selectedTeamId as Id<"teams">
      });

      if (result?.messageId) {
        // Start streaming the response
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: messageText }],
            model: selectedModel,
            teamId: selectedTeamId
          })
        });

        if (!response.ok || !response.body) {
          throw new Error('Failed to get streaming response');
        }

        // Start the chat stream with the response body
        await startChatStream('home', response.body, userMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="container mx-auto p-4 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto mb-4">
        <ChatMessages messages={messages} />
      </div>
      <div className="flex-shrink-0">
        <ChatInput onSubmit={submitData} />
      </div>
    </div>
  );
}
