import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { runMigrations } from '../db/migrate.js';

describe('database migrations', () => {
  it('applies each migration once and converts legacy failures to dead', () => {
    const directory = mkdtempSync(join(tmpdir(), 'personal-page-migration-'));
    const path = join(directory, 'legacy.db');
    const legacy = new Database(path);
    legacy.exec(readFileSync(resolve(process.cwd(), 'db/migrations/001_create_messages_table.sql'), 'utf8'));
    legacy.prepare(`INSERT INTO messages (id,name,email,message,status,created_at) VALUES (?,?,?,?,?,?)`)
      .run('legacy', 'Name', 'mail@example.com', 'Old failure', 'failed', new Date().toISOString());
    legacy.close();

    expect(runMigrations(path)).toEqual(['001_create_messages_table.sql', '002_durable_message_queue.sql']);
    expect(runMigrations(path)).toEqual([]);
    const migrated = new Database(path);
    expect(migrated.prepare('SELECT status,attempt_count FROM messages WHERE id=?').get('legacy'))
      .toEqual({ status: 'dead', attempt_count: 0 });
    expect((migrated.prepare('SELECT COUNT(*) AS count FROM schema_migrations').get() as { count: number }).count).toBe(2);
    migrated.close();
    rmSync(directory, { recursive: true, force: true });
  });
});
