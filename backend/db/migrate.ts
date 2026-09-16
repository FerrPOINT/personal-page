import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(currentDir, '../../.env') });

function migrationsDirectory(): string {
  const candidates = [join(currentDir, 'migrations'), join(currentDir, '../../db/migrations')];
  const found = candidates.find(existsSync);
  if (!found) throw new Error('Migration directory not found');
  return found;
}

export function runMigrations(databasePath = process.env.DATABASE_PATH || resolve(process.cwd(), 'data/database.db')): string[] {
  mkdirSync(dirname(databasePath), { recursive: true });
  const db = new Database(databasePath);
  try {
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
    db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )`);

    const applied: string[] = [];
    const files = readdirSync(migrationsDirectory()).filter((file) => file.endsWith('.sql')).sort();
    const apply = db.transaction((version: string, sql: string) => {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)')
        .run(version, new Date().toISOString());
    });

    for (const file of files) {
      const alreadyApplied = db.prepare('SELECT 1 FROM schema_migrations WHERE version = ?').get(file);
      if (alreadyApplied) continue;
      apply.immediate(file, readFileSync(join(migrationsDirectory(), file), 'utf8'));
      applied.push(file);
    }
    return applied;
  } finally {
    db.close();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const applied = runMigrations();
    console.log(applied.length ? `Applied migrations: ${applied.join(', ')}` : 'Database schema is up to date');
  } catch (error) {
    console.error('Migration failed:', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
