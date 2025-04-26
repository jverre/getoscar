import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { teams } from './teams';
import { enableRLS, createPolicy, createPolicyWithCheck } from './rls';

export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id').references(() => teams.id).notNull(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// RLS Policies
export const conversationsRls = [
  enableRLS('conversations'),
  createPolicy(
    'Users can view conversations in their teams',
    'conversations',
    'select',
    `exists (
      select 1 from team_members
      where team_members.team_id = conversations.team_id
      and team_members.user_id = auth.uid()
    )`
  ),
  createPolicyWithCheck(
    'Users can create conversations in their teams',
    'conversations',
    'insert',
    `exists (
      select 1 from team_members
      where team_members.team_id = conversations.team_id
      and team_members.user_id = auth.uid()
    )`
  ),
];