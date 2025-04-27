import { drizzle } from 'drizzle-orm/postgres-js';
import { type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getDatabaseUrl } from '@/lib/env';
import * as schema from './schema';

const DATABASE_URL = getDatabaseUrl();

// For migrations
export const migrationClient = postgres(DATABASE_URL, { max: 1 });

// For query purposes
const queryClient = postgres(DATABASE_URL);
export const db: PostgresJsDatabase<typeof schema> = drizzle(queryClient, { schema });