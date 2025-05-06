import { internal } from "./_generated/api";
import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx): Promise<Doc<"messages">[]> => {
    // Grab the most recent messages.
    const messages = await ctx.db.query("messages").order("desc").take(100);
    // Reverse the list so that it's in chronological order.
    return messages.reverse();
  },
});

export const send = mutation({
  args: {
    content: v.string(),
    role: v.string(),
    conversationId: v.optional(v.id("conversations")),
    teamId: v.optional(v.id("teams"))
  },
  handler: async (ctx, { content, role, conversationId, teamId }) => {
    if (!conversationId) {
      if (!teamId) {
        throw new Error("Either conversationId or teamId must be provided");
      }
      conversationId = await ctx.db.insert("conversations", {
        title: "New Conversation",
        updated_at: Date.now(),
        team_id: teamId
      });
    }

    // Send our message.
    await ctx.db.insert("messages", {
        content,
        role,
        streaming: true,
        completed: false,
        conversation_id: conversationId
    });
    console.log('message sent', content, role, conversationId);

    // Fetch the latest n messages to send as context.
    // The default order is by creation time.
    const messages = await ctx.db.query("messages").order("desc").take(10);
    // Reverse the list so that it's in chronological order.
    messages.reverse();
    // Insert a message with a placeholder body.
    const messageId = await ctx.db.insert("messages", {
      role: "assistant",
      content: "...",
      streaming: true,
      completed: false,
      conversation_id: conversationId
    });
    // Schedule an action that calls ChatGPT and updates the message.
    return { messages, messageId };
  },
});

// Updates a message with a new body.
export const update = internalMutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
    completed: v.boolean(),
  },
  handler: async (ctx, { messageId, content, completed }) => {
    await ctx.db.patch(messageId, { content, completed, streaming: completed ? false : true });
  },
});