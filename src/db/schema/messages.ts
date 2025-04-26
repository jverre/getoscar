import { pgTable, uuid, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { conversations } from './conversations';
import { enableRLS, createPolicy, createPolicyWithCheck } from './rls';

export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant']);

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  streaming: boolean('streaming').default(false).notNull(),
  complete: boolean('complete').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// RLS Policies
export const messagesRls = [
  enableRLS('messages'),
  createPolicy(
    'Users can view messages in their team conversations',
    'messages',
    'select',
    `exists (
      select 1 from conversations
      join team_members on team_members.team_id = conversations.team_id
      where conversations.id = messages.conversation_id
      and team_members.user_id = auth.uid()
    )`
  ),
  createPolicyWithCheck(
    'Users can create messages in their team conversations',
    'messages',
    'insert',
    `exists (
      select 1 from conversations
      join team_members on team_members.team_id = conversations.team_id
      where conversations.id = messages.conversation_id
      and team_members.user_id = auth.uid()
    )`
  ),
];