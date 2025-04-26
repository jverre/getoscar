import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { enableRLS, createPolicy, createPolicyWithCheck } from './rls';

export const teams = pgTable('teams', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const teamMembers = pgTable('team_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id').references(() => teams.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// RLS Policies
export const teamsRls = [
  enableRLS('teams'),
  createPolicy(
    'Users can view teams they belong to',
    'teams',
    'select',
    `exists (
      select 1 from team_members
      where team_members.team_id = teams.id
      and team_members.user_id = auth.uid()
    )`
  ),
  createPolicyWithCheck(
    'Users can create teams',
    'teams',
    'insert',
    'true'
  ),
];

export const teamMembersRls = [
  enableRLS('team_members'),
  createPolicy(
    'Users can view members of their teams',
    'team_members',
    'select',
    `exists (
      select 1 from team_members as tm
      where tm.team_id = team_members.team_id
      and tm.user_id = auth.uid()
    )`
  ),
  createPolicyWithCheck(
    'Users can join teams',
    'team_members',
    'insert',
    'auth.uid() = user_id'
  ),
];