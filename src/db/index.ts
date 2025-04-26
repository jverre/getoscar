import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DATABASE_URL } from '@/lib/env';

// For migrations
export const migrationClient = postgres(DATABASE_URL, { max: 1 });

// For query purposes
const queryClient = postgres(DATABASE_URL);
export const db = drizzle(queryClient);