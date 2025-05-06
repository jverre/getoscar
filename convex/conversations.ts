import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

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
