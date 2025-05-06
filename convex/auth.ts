import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import { MutationCtx } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
  callbacks: {
    
    async afterUserCreatedOrUpdated(ctx: MutationCtx, { userId }) {
      // Check if user already has any teams
      const existingTeamMember = await ctx.db
          .query("team_members")
          .filter(q => q.eq(q.field("user_id"), userId))
          .first();

      // Only create default team if user has no teams
      if (!existingTeamMember) {
          const team = await ctx.db.insert("teams", { name: "My Team" });
          await ctx.db.insert("team_members", { team_id: team, user_id: userId });
      }
    },
  },
});