import { db, closeDatabase } from '../services/database.js';

const limit = Math.min(Math.max(Number(process.argv[2] || 20), 1), 100);
const rows = db.prepare(`
  SELECT id, status, attempt_count, next_attempt_at, processing_started_at, created_at, sent_at
  FROM messages ORDER BY created_at DESC LIMIT ?
`).all(limit);
console.table(rows);
await closeDatabase();
