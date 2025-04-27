import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

// This is a representation of Supabase's auth.users table
// We don't manage this table, but we need it for references
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email'),
  createdAt: timestamp('created_at'),
}, () => {
  return {
    // Specify the actual table name in Supabase
    schema: 'auth',
  }
});