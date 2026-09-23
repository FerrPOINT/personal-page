import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { runMigrations } from '../db/migrate.js';

describe('database migrations', () => {
  it('creates an empty database through migration 003', () => {
    const directory = mkdtempSync(join(tmpdir(), 'personal-page-migration-'));
    const path = join(directory, 'empty.db');
    try {
      expect(runMigrations(path)).toEqual([
        '001_create_messages_table.sql',
        '002_durable_message_queue.sql',
        '003_optimize_message_queue.sql',
      ]);
      const migrated = new Database(path);
      const indexes = migrated.prepare("SELECT name FROM sqlite_master WHERE type='index'").all() as Array<{ name: string }>;
      expect(indexes.map(({ name }) => name)).toEqual(expect.arrayContaining([
        'idx_messages_due', 'idx_messages_stale_processing',
      ]));
      migrated.close();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('upgrades a database recorded at migrations 001 and 002', () => {
    const directory = mkdtempSync(join(tmpdir(), 'personal-page-migration-'));
    const path = join(directory, 'version-002.db');
    try {
      const legacy = new Database(path);
      legacy.exec(readFileSync(resolve(process.cwd(), 'db/migrations/001_create_messages_table.sql'), 'utf8'));
      legacy.exec(readFileSync(resolve(process.cwd(), 'db/migrations/002_durable_message_queue.sql'), 'utf8'));
      legacy.exec(`CREATE TABLE schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
        INSERT INTO schema_migrations VALUES ('001_create_messages_table.sql', '2026-09-23T00:00:00.000Z');
        INSERT INTO schema_migrations VALUES ('002_durable_message_queue.sql', '2026-09-23T00:00:00.000Z');`);
      legacy.prepare(`INSERT INTO messages (id,name,email,message,status,created_at,next_attempt_at)
        VALUES (?,?,?,?,?,?,NULL)`).run('pending', 'Name', 'mail@example.com', 'Waiting', 'pending', '2026-09-23T00:00:00.000Z');
      legacy.close();

      expect(runMigrations(path)).toEqual(['003_optimize_message_queue.sql']);
      const migrated = new Database(path);
      expect(migrated.prepare('SELECT next_attempt_at FROM messages WHERE id=?').get('pending'))
        .toEqual({ next_attempt_at: '2026-09-23T00:00:00.000Z' });
      expect(migrated.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_messages_queue'").get())
        .toBeUndefined();
      migrated.close();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('applies each migration once and converts legacy failures to dead', () => {
    const directory = mkdtempSync(join(tmpdir(), 'personal-page-migration-'));
    const path = join(directory, 'legacy.db');
    const legacy = new Database(path);
    legacy.exec(readFileSync(resolve(process.cwd(), 'db/migrations/001_create_messages_table.sql'), 'utf8'));
    legacy.prepare(`INSERT INTO messages (id,name,email,message,status,created_at) VALUES (?,?,?,?,?,?)`)
      .run('legacy', 'Name', 'mail@example.com', 'Old failure', 'failed', new Date().toISOString());
    legacy.close();

    expect(runMigrations(path)).toEqual([
      '001_create_messages_table.sql',
      '002_durable_message_queue.sql',
      '003_optimize_message_queue.sql',
    ]);
    expect(runMigrations(path)).toEqual([]);
    const migrated = new Database(path);
    expect(migrated.prepare('SELECT status,attempt_count FROM messages WHERE id=?').get('legacy'))
      .toEqual({ status: 'dead', attempt_count: 0 });
    expect((migrated.prepare('SELECT COUNT(*) AS count FROM schema_migrations').get() as { count: number }).count).toBe(3);
    const plan = migrated.prepare(`EXPLAIN QUERY PLAN
      SELECT id FROM messages INDEXED BY idx_messages_due
      WHERE status IN ('pending', 'failed') AND next_attempt_at <= ?
      ORDER BY next_attempt_at ASC, created_at ASC LIMIT 1
    `).all(new Date().toISOString()) as Array<{ detail: string }>;
    expect(plan.some(({ detail }) => detail.includes('idx_messages_due'))).toBe(true);
    expect(plan.some(({ detail }) => detail.includes('USE TEMP B-TREE'))).toBe(false);
    migrated.close();
    rmSync(directory, { recursive: true, force: true });
  });
});
