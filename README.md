# GetOscar

AI chat application with team collaboration features.

## Database Setup

This project uses Supabase as the database with Drizzle ORM for type-safe database operations and migrations.

### Local Development

1. Create a `.env.local` file in the root directory with:
```env
# Supabase API
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database (for Drizzle)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

2. Install dependencies:
```bash
npm install
```

3. Generate migrations after schema changes:
```bash
npm run db:generate
```

4. Apply migrations to your database:
```bash
npm run db:migrate
```

### Available Database Commands

- `npm run db:generate` - Generate new migrations from schema changes
- `npm run db:push` - Push schema changes to the database
- `npm run db:studio` - Open Drizzle Studio to view and manage your database
- `npm run db:migrate` - Apply pending migrations to the database