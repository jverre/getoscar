'use client';

import { useParams } from 'next/navigation';
import { ChatMessages } from '@/components/chat/chatMessages'; // Assuming component exists
import { ChatInput } from '@/components/chat/chatInput'; // Assuming component exists
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Id } from '@/../convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { useApp } from '@/context/appContext';

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.conversationId as string; // Extract conversation ID from URL
  const { selectedTeamId } = useApp();

  const messages = useQuery(api.messages.listMesssages, {
    conversationId: conversationId as Id<"conversations">
  });

  const sendMessage = useMutation(api.messages.sendMessage);

  const submitData = async (messageText: string, selectedModel: string) => {
    if (!selectedTeamId) {
      return;
    }

    await sendMessage({
      conversationId: conversationId as Id<"conversations">,
      content: messageText,
      teamId: selectedTeamId as Id<"teams">
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto p-4">
          <div className="w-full max-w-3xl mx-auto space-y-4">
          <ChatMessages messages={messages?.map(message => ({
            id: message._id,
            content: message.content,
            role: message.role
          })) ?? []} />
          </div>
      </div>

      <div className="shrink-0 border-gray-200 p-4 bg-white">
        <div className="w-full max-w-3xl mx-auto">
          <ChatInput
            onSubmit={submitData}
            disabled={false}
          />
        </div>
      </div>
    </div>
  );
}