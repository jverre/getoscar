import React from 'react';
import { ChatInput } from '@/components/chat/chatInput';
import { useRouter } from 'next/navigation';
import { Message, useChatStream } from '@/context/chatStreamContext';

// Interface for component props
interface ChatMessagesProps {
  messages: Message[];
}

// Simple Markdown-like rendering for code blocks (can be enhanced)
const renderMessageContent = (text: string) => {
    // Basic check for triple backticks for code blocks
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts = text.split(codeBlockRegex);

    return parts.map((part, index) => {
        if (index % 2 === 1) { // This part is inside ```
            return (
                <pre key={index} className="bg-gray-800 text-white p-3 rounded-md my-2 overflow-x-auto text-sm font-mono">
                    <code>{part.trim()}</code>
                </pre>
            );
        } else { // This part is regular text
            // Render newline characters as <br> tags
            // Split by newline, wrap each line in a span/div or join with <br>
            // Using dangerouslySetInnerHTML is an option but less safe if content isn't trusted
             return part.split('\n').map((line, lineIndex) => (
                 <React.Fragment key={`${index}-${lineIndex}`}>
                     {line}
                     {lineIndex < part.split('\n').length - 1 && <br />}
                 </React.Fragment>
             ));
        }
    });
};

export function ChatMessages({ messages }: ChatMessagesProps) {
  if (!messages || messages.length === 0) {
    // Render nothing or a placeholder if there are no messages
    return null; // Or return a placeholder like <p>Start the conversation!</p>
  }

  return (
    // No need for flex container here anymore as layout is handled by parent
    // The parent now provides space-y-4 for vertical spacing
    <>
      {messages.map((message) => {
        const isUser = message.sender === 'user'; // Check if the message is from the user

        return (
          // Each message container allows alignment using flex justify-*
          <div
            key={message.id}
            className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`} // Align right for user, left for others
          >
            {/* The message bubble itself */}
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 shadow-sm ${ // Limit bubble width
                isUser
                  ? 'bg-blue-600 text-white' // User message style
                  : 'bg-white text-gray-800 border border-gray-200' // AI/Other message style
              }`}
            >
               {/* Render message content with basic code block handling */}
               <div className="prose prose-sm max-w-none break-words"> {/* prose class for potential markdown styling later */}
                   {renderMessageContent(message.text)}
               </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

export function ChatConversation({ conversationId }: { conversationId: string }) {
  const { getMessages, getStreamStatus } = useChatStream();
  const messages = getMessages(conversationId);
  const status = getStreamStatus(conversationId);

  console.log(`ChatConversation status: ${status}`);
  console.log(`ChatConversation messages: ${JSON.stringify(messages)}`);
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <ChatMessages messages={messages} />
      </div>
    </div>
  );
}
