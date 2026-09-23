import { afterAll } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runMigrations } from '../../db/migrate.js';
import { createDatabase, closeDatabase, type AppDatabase } from '../services/database.js';
import { MessageRepository } from '../models/Message.js';

const testDirectory = mkdtempSync(join(tmpdir(), 'personal-page-'));
process.env.DATABASE_PATH = join(testDirectory, 'test.db');
process.env.NODE_ENV = 'test';
process.env.TELEGRAM_BOT_TOKEN = '123456:test-token';
process.env.TELEGRAM_CHAT_ID = '123456';
runMigrations(process.env.DATABASE_PATH);
export const testDatabase: AppDatabase = createDatabase(process.env.DATABASE_PATH);
export const testMessages = new MessageRepository(testDatabase);

afterAll(async () => {
  closeDatabase(testDatabase);
  rmSync(testDirectory, { recursive: true, force: true });
});
