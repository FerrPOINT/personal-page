import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runMigrations } from '../db/migrate.js';
import { startServer } from './index.js';

describe('server lifecycle', () => {
  const directories: string[] = [];
  afterEach(() => directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));

  it('stops HTTP, waits for runtime shutdown and closes SQLite', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'personal-page-server-'));
    directories.push(directory);
    const databasePath = join(directory, 'server.db');
    runMigrations(databasePath);
    const runtime = await startServer({
      nodeEnv: 'test', port: 0, databasePath, logDir: join(directory, 'logs'),
      allowedOrigins: ['http://localhost:8888'], telegram: null,
    });
    const address = runtime.server.address();
    if (!address || typeof address === 'string') throw new Error('Expected a TCP listener');
    expect((await fetch(`http://127.0.0.1:${address.port}/live`)).status).toBe(200);

    await runtime.shutdown('test');
    await runtime.shutdown('test-again');
    expect(() => runtime.database.prepare('SELECT 1')).toThrow();
    await expect(fetch(`http://127.0.0.1:${address.port}/live`)).rejects.toThrow();
  });
});
