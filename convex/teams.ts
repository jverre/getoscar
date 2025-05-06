import { query } from "./_generated/server";
import { v } from "convex/values";

export const getUserTeams = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    if (!args.userId) {
      return [];
    }

    // Get all team memberships for this user
    const memberships = await ctx.db
      .query("team_members")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .collect();
    
    // Fetch the team details for each membership
    const teams = await Promise.all(
      memberships.map(async (membership) => {
        const team = await ctx.db.get(membership.team_id);
        return team;
      })
    );
    
    // Filter out any null values (in case a team was deleted)
    return teams.filter(Boolean);
  },
});