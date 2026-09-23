import Database, { type Database as DatabaseType } from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { dbLogger } from '../utils/logger.js';
import { toAppError } from '../utils/errors.js';

export type AppDatabase = DatabaseType;

export function createDatabase(databasePath: string): AppDatabase {
  mkdirSync(dirname(databasePath), { recursive: true });
  const database = new Database(databasePath);
  database.pragma('foreign_keys = ON');
  database.pragma('journal_mode = WAL');
  dbLogger.info('SQLite database connected', { path: databasePath });
  return database;
}

export function testConnection(database: AppDatabase): boolean {
  try {
    const result = database.prepare(`
      SELECT COUNT(*) AS count FROM sqlite_master
      WHERE type = 'table' AND name IN ('messages', 'schema_migrations')
    `).get() as { count: number };
    return result.count === 2;
  } catch (error: unknown) {
    dbLogger.error('Database connection test failed', { error: toAppError(error).message });
    return false;
  }
}

export function closeDatabase(database: AppDatabase): void {
  if (database.open) database.close();
  dbLogger.info('Database connection closed');
}
