import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const teams = defineTable({
  name: v.string()
});

const team_members = defineTable({
  team_id: v.id("teams"),
  user_id: v.id("users")
});

const conversations = defineTable({
  team_id: v.id("teams"),
  title: v.string(),
  title_loading: v.boolean(),
  updated_at: v.number()
});

const messages = defineTable({
  conversation_id: v.id("conversations"),
  role: v.string(),
  content: v.string(),
  streaming: v.boolean(),
  completed: v.boolean(),
});

const schema = defineSchema({
  ...authTables,
  teams,
  team_members,
  conversations,
  messages
});
 
export default schema;