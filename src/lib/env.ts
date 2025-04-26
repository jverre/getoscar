// For Supabase API
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// For Drizzle direct database access
// This needs to be set in your .env file
export const DATABASE_URL = process.env.DATABASE_URL!;

if (!SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
if (!SUPABASE_ANON_KEY) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');