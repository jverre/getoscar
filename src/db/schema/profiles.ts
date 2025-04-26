import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { enableRLS, createPolicy } from './rls';

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// RLS Policies
export const profilesRls = [
  enableRLS('profiles'),
  createPolicy(
    'Profiles are viewable by all authenticated users',
    'profiles',
    'select',
    'true'
  ),
  createPolicy(
    'Users can update their own profile',
    'profiles',
    'update',
    'auth.uid() = id'
  ),
];