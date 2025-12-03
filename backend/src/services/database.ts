import Database, { type Database as DatabaseType } from 'better-sqlite3';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Load .env from project root
// In Docker, variables are already set via docker-compose, dotenv won't override them
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../../.env') });

// Get database path from env or use default
const DB_PATH = process.env.DATABASE_PATH || resolve(__dirname, '../../../data/database.db');

// Ensure data directory exists
const dbDir = resolve(DB_PATH, '..');
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// Create database connection
const dbInstance: DatabaseType = new Database(DB_PATH);

// Enable foreign keys and WAL mode for better performance
dbInstance.pragma('foreign_keys = ON');
dbInstance.pragma('journal_mode = WAL');

console.log(`✅ SQLite database connected: ${DB_PATH}`);

// Export database instance
export const db: DatabaseType = dbInstance;

// Helper function to test connection
export async function testConnection(): Promise<boolean> {
  try {
    const result = db.prepare('SELECT 1 as test').get() as { test: number };
    return result.test === 1;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
}

// Helper function to get database instance (for transactions)
export function getDatabase(): DatabaseType {
  return db;
}

// Graceful shutdown
export async function closeDatabase(): Promise<void> {
  db.close();
  console.log('🔌 Database connection closed');
}
