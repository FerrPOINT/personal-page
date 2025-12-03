import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { existsSync, mkdirSync } from 'fs';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
// In Docker, variables are already set via docker-compose, dotenv won't override them
dotenv.config({ path: resolve(__dirname, '../.env') });

// Get database path from env or use default
const DB_PATH = process.env.DATABASE_PATH || resolve(__dirname, '../data/database.db');

// Ensure data directory exists
const dbDir = resolve(DB_PATH, '..');
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

async function runMigration() {
  const db = new Database(DB_PATH);

  try {
    console.log('🔌 Connecting to database...');
    console.log(`📁 Database path: ${DB_PATH}`);

    // Enable foreign keys and WAL mode
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');

    // Read migration file
    // In production: __dirname is /app/dist/db, migrations are in /app/db/migrations
    // In development: __dirname is dist/db, migrations are in db/migrations
    const migrationPath = join(__dirname, '..', '..', 'db', 'migrations', '001_create_messages_table.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📝 Running migration: 001_create_messages_table.sql');

    // Execute migration (SQLite can execute multiple statements)
    db.exec(migrationSQL);

    console.log('✅ Migration completed successfully');

    // Verify tables exist
    const tables = ['messages', 'bot_settings'];
    for (const tableName of tables) {
      const result = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
        .get(tableName) as { name: string } | undefined;

      if (result) {
        console.log(`✅ Table "${tableName}" exists`);
      } else {
        console.error(`❌ Table "${tableName}" was not created`);
        process.exit(1);
      }
    }

    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    db.close();
    console.log('🔌 Database connection closed');
  }
}

runMigration();
