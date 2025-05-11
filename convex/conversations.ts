import { query, mutation, internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { internal } from "./_generated/api";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!
});

export const getTeamConversations = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    // Get the authenticated user's ID
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return []; // Or throw new Error("Unauthorized")
    }

    // Check if user is a member of the team
    const teamMembership = await ctx.db
      .query("team_members")
      .filter((q) => 
        q.and(
          q.eq(q.field("team_id"), args.teamId),
          q.eq(q.field("user_id"), userId)
        )
      )
      .first();

    if (!teamMembership) {
      return []; // Or throw new Error("Not a team member")
    }

    // If authorized, get the conversations
    const conversations = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("team_id"), args.teamId))
      .collect();
    
    return conversations;
  },
});

export const deleteConversation = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the conversation to check its team_id
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Check if user is a member of the team
    const teamMembership = await ctx.db
      .query("team_members")
      .filter((q) => 
        q.and(
          q.eq(q.field("team_id"), conversation.team_id),
          q.eq(q.field("user_id"), userId)
        )
      )
      .first();

    if (!teamMembership) {
      throw new Error("Not authorized to delete this conversation");
    }

    // If authorized, delete the conversation
    await ctx.db.delete(args.conversationId);
  },
});

export const updateConversationTitle = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.optional(v.string()),
    title_loading: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const arg_to_update: any = {};
    if (args.title) {
      arg_to_update.title = args.title;
    }
    if (args.title_loading) {
      arg_to_update.title_loading = args.title_loading;
    }
    await ctx.db.patch(args.conversationId, arg_to_update);
  }
});

export const createConversationTitle = internalAction({
  args: {
    conversationId: v.id("conversations"),
    first_user_message: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.conversations.updateConversationTitle, {
      conversationId: args.conversationId,
      title_loading: true,
    });

    const { text } = await generateText({
      model: openrouter('openai/gpt-4-turbo'),
      system: 'You are a helpful assistant that generates short title for conversations based on the first user message. The title should be no more than 20 characters.',
      prompt: args.first_user_message,
    });

    await ctx.runMutation(internal.conversations.updateConversationTitle, {
      conversationId: args.conversationId,
      title: text,
      title_loading: false,
    });
  }
});
