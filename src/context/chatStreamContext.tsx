'use client';

import React, { createContext, useState, useContext, useCallback, ReactNode, useRef, useEffect } from 'react';

// --- Types ---

// Define message structure - adjust fields based on your actual API response
export interface Message {
  id: string; // Unique identifier for each message
  content: string;
  role: 'user' | 'assistant' | string; // Or other relevant types
  _creationTime?: number; // Optional: timestamp
  // Add any other relevant fields from your stream
}

// Possible statuses for a conversation's stream
export type StreamStatus = 'idle' | 'reading' | 'done' | 'error';

// State stored for each individual conversation
export interface ConversationState {
  messages: Message[];
  status: StreamStatus;
  error?: string; // Store error message if status is 'error'
}

// The overall state shape: mapping conversation IDs to their state
export interface ChatStreamState {
  [conversationId: string]: ConversationState | undefined; // Use undefined to indicate absence
}

// --- Context Props Interface ---
interface ChatStreamContextProps {
  streams: ChatStreamState; // The current state of all tracked conversations
  startChatStream: (
    conversationId: string,
    streamBody: ReadableStream<Uint8Array>,
    initialUserMessage?: Message // Optional: User's first message for immediate display
  ) => Promise<void>; // Function to initiate stream reading for a conversation
  getMessages: (conversationId: string) => Message[]; // Get messages for a specific convo
  getStreamStatus: (conversationId: string) => StreamStatus; // Get status for a specific convo
  clearChatState: (conversationId: string) => void; // Remove a conversation's state and stop its stream
  loadConversationMessages: (conversationId: string) => Promise<void>;
}

// --- Context Definition ---
const ChatStreamContext = createContext<ChatStreamContextProps | undefined>(undefined);

// --- Provider Component ---
export const ChatStreamProvider = ({ children }: { children: ReactNode }) => {
  // State holding all conversation data (messages, status)
  const [streams, setStreams] = useState<ChatStreamState>({});

  // Ref to keep track of active AbortControllers, keyed by conversationId
  // This allows us to cancel specific streams without affecting others
  const activeControllers = useRef<Map<string, AbortController>>(new Map());

  // --- Accessor Functions ---

  const getMessages = useCallback((conversationId: string): Message[] => {
    return streams[conversationId]?.messages || [];
  }, [streams]);

  const getStreamStatus = useCallback((conversationId: string): StreamStatus => {
    // Return 'idle' if the conversation ID is not even in the state yet
    return streams[conversationId]?.status || 'idle';
  }, [streams]);

  // --- Core Logic Functions ---

  /**
   * Removes a conversation's state and aborts its active stream reader, if any.
   */
  const clearChatState = useCallback((conversationId: string) => {
    // Check if there's an active controller for this stream and abort it
    if (activeControllers.current.has(conversationId)) {
      console.log(`Aborting stream for ${conversationId} due to clearChatState call.`);
      activeControllers.current.get(conversationId)?.abort();
      activeControllers.current.delete(conversationId); // Remove from tracking map
    }

    // Remove the conversation's data from the main state object
    setStreams(prev => {
      // Create a new object excluding the specified conversationId
      const newState = { ...prev };
      delete newState[conversationId];
      return newState;
    });
    console.log(`Cleared chat state and aborted any active stream for ${conversationId}`);
  }, []); // No dependencies needed as it uses refs and setStreams updater form

  /**
   * Initiates reading from a *plain text* stream for a given conversation ID.
   * Manages the stream lifecycle and updates the shared state by appending text chunks.
   */
  const startChatStream = useCallback(async (
    conversationId: string,
    streamBody: ReadableStream<Uint8Array>,
    initialUserMessage?: Message
  ) => {
    console.log(`Attempting to start PLAIN TEXT stream for conversation: ${conversationId}`);

    if (activeControllers.current.has(conversationId)) {
      console.warn(`Stream reading was already in progress for ${conversationId}. Aborting previous controller.`);
      activeControllers.current.get(conversationId)?.abort();
    }

    const controller = new AbortController();
    activeControllers.current.set(conversationId, controller);
    const signal = controller.signal;

    // Prepare a unique ID for the incoming assistant message
    const assistantMessageId = `ai-${conversationId}-${Date.now()}`;

    // Initialize state: Add user message (if provided) AND a placeholder for the AI response
    setStreams(prev => {
        const initialMessages = initialUserMessage ? [initialUserMessage] : [];
        // Add the initial, empty AI message placeholder
        const aiPlaceholder: Message = {
             id: assistantMessageId,
             text: '', // Start with empty text
             sender: 'ai',
             timestamp: Date.now()
        };
        return {
          ...prev,
          [conversationId]: {
            messages: [...(prev[conversationId]?.messages || []), ...initialMessages, aiPlaceholder], // Add placeholder
            status: 'reading',
            error: undefined,
          },
        };
    });

    const reader = streamBody.getReader();
    const decoder = new TextDecoder();

    try {
      console.log(`Stream reader loop started for ${conversationId}`);
      while (true) {
        if (signal.aborted) {
          console.log(`Stream reading loop detected abort signal for ${conversationId}. Exiting loop.`);
          setStreams(prev => (prev[conversationId]?.status === 'reading' ? { ...prev, [conversationId]: { ...prev[conversationId]!, status: 'idle' }} : prev));
          break;
        }
        console.log('reader', reader);
        const { done, value } = await reader.read();
        console.log('done', done);
        console.log('value', value);
        if (done) {
          console.log(`Stream finished for ${conversationId}.`);
          setStreams(prev => ({ ...prev, [conversationId]: { ...prev[conversationId]!, status: 'done' }}));
          break;
        }

        // Decode the chunk and handle it
        const textChunk = decoder.decode(value, { stream: true });
        
        // Add error handling for empty chunks
        if (!textChunk) {
          console.warn('Received empty chunk from stream');
          continue;
        }

        if (textChunk) {
           // console.log(`[${conversationId}] Received chunk:`, textChunk); // Optional: Log chunks for debugging
           // Append the chunk to the existing assistant message text
           setStreams(prev => {
               const currentConv = prev[conversationId];
               if (!currentConv || currentConv.messages.length === 0) return prev; // Should not happen

               // Find the last message (which should be our AI message)
               const lastMessage = currentConv.messages[currentConv.messages.length - 1];

               // Make sure the last message is the one we intend to update
               if (lastMessage && lastMessage.id === assistantMessageId && lastMessage.sender === 'ai') {
                    // Create an updated message object immutably
                    const updatedMessage: Message = {
                        ...lastMessage,
                        text: lastMessage.text + textChunk, // Append the new text chunk
                    };

                    // Create a new messages array replacing the last one
                    const updatedMessages = [
                         ...currentConv.messages.slice(0, -1), // All messages except the last one
                         updatedMessage // The updated last message
                    ];

                    return {
                        ...prev,
                        [conversationId]: {
                            ...currentConv,
                            messages: updatedMessages, // Use the new messages array
                        },
                    };
               } else {
                    // Log a warning if the last message isn't the expected AI placeholder
                    console.warn(`[${conversationId}] Last message mismatch. Expected AI message with ID ${assistantMessageId}.`);
                    return prev; // Don't update if something is wrong
               }
           });
        }

      } // End while loop
    } catch (error: any) {
      // Handle errors that occur during the reader.read() or processing
      if (error.name !== 'AbortError') { // Ignore errors caused by intentional aborts
        console.error(`Stream reading error for ${conversationId}:`, error);
        setStreams(prev => ({
            ...prev,
            // Ensure conversation exists before updating
            [conversationId]: prev[conversationId] ? {
                ...prev[conversationId]!,
                status: 'error',
                error: error.message || 'Unknown stream error'
            } : undefined // Or handle appropriately if conv was removed
        }));
      } else {
          console.log(`Stream reading intentionally aborted via signal for ${conversationId}.`);
          // Status likely handled by abort signal check or initiator
      }
    } finally {
      // This block executes whether the loop finished normally, broke, or threw an error.
      console.log(`Cleaning up stream reader resources for ${conversationId}.`);
      // Remove the controller from the tracking map as this reader is now finished.
      activeControllers.current.delete(conversationId);
      // Release the lock on the stream reader.
      try {
          if (reader) {
              reader.releaseLock();
          }
      } catch (e) {
          console.warn(`Error releasing stream lock for ${conversationId}:`, e)
      }
    }
  }, []); // Dependencies: None, relies on refs and setState updater pattern

  const loadConversationMessages = useCallback(async (conversationId: string) => {
    let shouldFetch = false;
    setStreams(prev => {
      if (!prev[conversationId]?.messages?.length) {
        shouldFetch = true;
        return {
          ...prev,
          [conversationId]: {
            messages: [],
            status: 'reading',
          }
        };
      }
      return prev;
    });

    if (!shouldFetch) {
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.statusText}`);
      }
      
      const messagesData = await response.json();
    console.log(messagesData)
      setStreams(prev => ({
        ...prev,
        [conversationId]: {
          messages: messagesData.map((msg: any) => ({
            id: msg.id || `msg-${Date.now()}-${Math.random()}`,
            text: msg.content || '', // Ensure text is never undefined
            role: msg.role || 'unknown',
            timestamp: msg.createdAt ? new Date(msg.createdAt).getTime() : Date.now()
          })),
          status: 'done'
        }
      }));
    } catch (error) {
      console.error('Error loading conversation messages:', error);
      setStreams(prev => ({
        ...prev,
        [conversationId]: {
          messages: [],
          status: 'error',
          error: 'Failed to load conversation messages'
        }
      }));
    }
  }, []);

  // --- Cleanup on Provider Unmount ---
  // Ensure any active streams are aborted if the provider itself unmounts
  useEffect(() => {
    return () => {
      console.log("ChatStreamProvider unmounting. Aborting all active streams.");
      activeControllers.current.forEach((controller, id) => {
        console.log(`Aborting stream for ${id} during provider unmount.`);
        controller.abort();
      });
      activeControllers.current.clear(); // Clear the tracking map
    };
  }, []); // Empty dependency array ensures this runs only once on unmount

  // --- Provide Context Value ---
  const contextValue: ChatStreamContextProps = {
    streams,
    startChatStream,
    getMessages,
    getStreamStatus,
    clearChatState,
    loadConversationMessages,
  };

  return (
    <ChatStreamContext.Provider value={contextValue}>
      {children}
    </ChatStreamContext.Provider>
  );
};

// --- Hook for Consuming Context ---
export const useChatStream = (): ChatStreamContextProps => {
  const context = useContext(ChatStreamContext);
  if (context === undefined) {
    // This error is helpful during development if provider is forgotten
    throw new Error('useChatStream must be used within a ChatStreamProvider');
  }
  return context;
};