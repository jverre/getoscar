'use client';

import { useApp } from '@/context/appContext';
import { ChatInput } from '@/components/chat/chatInput';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { ChatMessages } from '@/components/chat/chatMessages';
import { Id } from '@/../convex/_generated/dataModel';
import { useAuthToken } from '@convex-dev/auth/react';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function HomePage() {
  const { selectedTeamId } = useApp();
  const [messages, setMessages] = useState<any[]>([]);

  const sendMessage = useMutation(api.messages.sendMessage);

  const submitData = async (messageText: string, selectedModel: string) => {
    if (!selectedTeamId) {
      return;
    }

    setMessages([...messages, {
      id: uuidv4(),
      role: 'user',
      content: messageText
    }]);

    const result = await sendMessage({
      conversationId: undefined,
      content: messageText,
      teamId: selectedTeamId as Id<"teams">
    });

    redirect(`/c/${result.conversationId}`);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto p-4">
        <div className="w-full max-w-3xl mx-auto space-y-4">
          <ChatMessages messages={messages ?? []} />
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
