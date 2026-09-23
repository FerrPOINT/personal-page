import dotenv from 'dotenv';
import { resolve } from 'node:path';
import { loadAppConfig } from '../config.js';
import { closeDatabase, createDatabase } from '../services/database.js';

dotenv.config({ path: resolve(process.cwd(), '../.env') });
const config = loadAppConfig();
const database = createDatabase(config.databasePath);
try {
  const limit = Math.min(Math.max(Number(process.argv[2] || 20), 1), 100);
  console.table(database.prepare(`
    SELECT id, status, attempt_count, next_attempt_at, processing_started_at, created_at, sent_at
    FROM messages ORDER BY created_at DESC LIMIT ?
  `).all(limit));
} finally {
  closeDatabase(database);
}
