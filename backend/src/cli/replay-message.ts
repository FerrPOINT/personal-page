import dotenv from 'dotenv';
import { resolve } from 'node:path';
import { loadAppConfig } from '../config.js';
import { MessageRepository } from '../models/Message.js';
import { closeDatabase, createDatabase } from '../services/database.js';

dotenv.config({ path: resolve(process.cwd(), '../.env') });
const messageId = process.argv[2];
if (!messageId) {
  console.error('Usage: npm run message:replay -- <message-id>');
  process.exitCode = 2;
} else {
  const database = createDatabase(loadAppConfig().databasePath);
  try {
    const message = new MessageRepository(database).replayDead(messageId);
    console.log(`Message ${message.id} queued for retry`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    closeDatabase(database);
  }
}
