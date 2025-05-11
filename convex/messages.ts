import { api, internal } from "./_generated/api";
import { internalAction, internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { streamText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { Id } from "./_generated/dataModel";

// Initialize OpenRouter
const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!
});

export const listMesssages = query({
    args: {
        conversationId: v.id("conversations")
    },
    handler: async (ctx, { conversationId }) => {
        return await ctx.db.query("messages").filter(q => q.eq(q.field("conversation_id"), conversationId)).order("asc").collect();
    }
});

export const createMessage = internalMutation({
    args: {
        conversationId: v.id("conversations"),
        content: v.string(),
        role: v.string()
    },
    handler: async (ctx, { content, role, conversationId }) => {
        return await ctx.db.insert("messages", {
            content,
            role,
            conversation_id: conversationId,
            streaming: true,
            completed: false
        });
    }
});

export const sendMessage = mutation({
    args: {
        conversationId: v.optional(v.id("conversations")),
        content: v.string(),
        teamId: v.id("teams")
    },
    handler: async (ctx, { conversationId, content, teamId }) => {
        if (!conversationId) {
            conversationId = await ctx.db.insert("conversations", {
                title: "New Conversation",
                title_loading: false,
                updated_at: Date.now(),
                team_id: teamId
            });

            await ctx.scheduler.runAfter(0, internal.conversations.createConversationTitle, {
                conversationId: conversationId as Id<"conversations">,
                first_user_message: content
            });
        }

        const messageId = await ctx.db.insert("messages", {
            content,
            role: "user",
            conversation_id: conversationId,
            streaming: true,
            completed: false
        });

        await ctx.scheduler.runAfter(0, internal.messages.generateResponse, {
            conversationId,
            lastMessageId: messageId,
        });


        return { messageId, conversationId };
    }
});

function hasDelimiter(response: string) {
    return (
        response.includes("\n") ||
        response.includes(".") ||
        response.includes("?") ||
        response.includes("!") ||
        response.includes(",") ||
        response.length > 100
    );
}


export const generateResponse = internalAction({
    args: {
        conversationId: v.id("conversations"),
        lastMessageId: v.id("messages"),
    },
    handler: async (ctx, { conversationId, lastMessageId }) => {
        const messages = await ctx.runQuery(api.messages.listMesssages, {
            conversationId: conversationId
        });

        const lastMessageIndex = messages.findIndex(m => m._id === lastMessageId);
        if (lastMessageIndex === -1) {
            throw new Error("Last message not found");
        }

        const filteredMessages = messages.slice(0, lastMessageIndex + 1);

        const messageId = await ctx.runMutation(internal.messages.createMessage, {
            content: "",
            role: "assistant",
            conversationId: conversationId
        });

        let content = "";
        const { textStream } = streamText({
            model: openrouter('openai/gpt-4-turbo'),
            messages: filteredMessages.map(m => ({
                role: m.role as "user" | "assistant",
                content: m.content
            })),
            onChunk: async (chunk) => {
                if (chunk.chunk.type === 'text-delta') {
                    content += chunk.chunk.textDelta;
                    if (hasDelimiter(chunk.chunk.textDelta)) {
                        await ctx.runMutation(internal.messages.updateMessage, {
                            content: content,
                            completed: false,
                            streaming: true,
                            messageId: messageId as Id<"messages">,
                        });
                    }
                }
            },
            onFinish: async (event) => {
                await ctx.runMutation(internal.messages.updateMessage, {
                    content: event.text,
                    completed: true,
                    streaming: false,
                    messageId: messageId as Id<"messages">,
                });
            }
        });

        for await (const _ of textStream) {}

        return content;
    }
});

export const updateMessage = internalMutation({
    args: {
        messageId: v.id("messages"),
        content: v.string(),
        streaming: v.boolean(),
        completed: v.boolean(),
    },
    handler: async (ctx, { messageId, content, streaming, completed }) => {
        await ctx.db.patch(messageId, {
            content,
            streaming,
            completed
        });
    }
});