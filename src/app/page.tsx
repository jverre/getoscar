'use client';

import { ChatInput } from '@/components/chat/chat-home';

export default function HomePage() {
  const handleChatSubmit = (message: string, model: string) => {
    // Handle the chat submission here
    console.log('Message:', message);
    console.log('Selected model:', model);
  };

  return (
    <div className="container mx-auto p-4">
      <ChatInput onSubmit={handleChatSubmit} />
    </div>
  );
}
