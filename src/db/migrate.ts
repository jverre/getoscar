import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { DATABASE_URL } from '@/lib/env';

// This will run migrations on the database, updating it to the latest version
async function runMigrations() {
  const connection = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(connection);

  console.log('Running migrations...');
  
  await migrate(db, { migrationsFolder: 'src/db/migrations' });
  
  console.log('Migrations completed!');
  
  await connection.end();
}

runMigrations()
  .then(() => {
    console.log('Migrations complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migrations failed!', err);
    process.exit(1);
  });