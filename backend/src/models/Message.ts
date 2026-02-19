import { db } from '../services/database.js';
import { randomUUID } from 'crypto';
import { DatabaseError, NotFoundError, DuplicateError } from '../utils/errors.js';

export interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
  sent_at: string | null;
  error_message: string | null;
}

export interface CreateMessageInput {
  name: string;
  email: string;
  message: string;
}

export interface UpdateMessageStatusInput {
  id: string;
  status: 'sent' | 'failed';
  sent_at?: Date;
  error_message?: string;
}

/**
 * Check if a duplicate message exists within the time window
 * Prevents spam by detecting identical messages from same email within short time
 * 
 * @param email - Email address
 * @param message - Message content
 * @param timeWindowMinutes - Time window in minutes (default: 5)
 * @returns true if duplicate found, false otherwise
 */
export async function checkDuplicateMessage(
  email: string,
  message: string,
  timeWindowMinutes: number = 5
): Promise<boolean> {
  const cutoffTime = new Date();
  cutoffTime.setMinutes(cutoffTime.getMinutes() - timeWindowMinutes);
  const cutoffTimeISO = cutoffTime.toISOString();

  const stmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM messages
    WHERE email = ?
      AND message = ?
      AND created_at > ?
  `);

  const result = stmt.get(email, message, cutoffTimeISO) as { count: number } | undefined;
  return (result?.count || 0) > 0;
}

/**
 * Create a new message in the database
 * Checks for duplicates before creating
 */
export async function createMessage(input: CreateMessageInput): Promise<Message> {
  // Check for duplicate message (same email + message within 5 minutes)
  const isDuplicate = await checkDuplicateMessage(input.email, input.message, 5);
  if (isDuplicate) {
    throw new DuplicateError('Duplicate message detected. Please wait before sending the same message again.');
  }

  const id = randomUUID();
  const createdAt = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO messages (id, name, email, message, status, created_at)
    VALUES (?, ?, ?, ?, 'pending', ?)
  `);

  stmt.run(id, input.name, input.email, input.message, createdAt);

  const message = await getMessageById(id);
  if (!message) {
    throw new DatabaseError('Failed to create message');
  }
  return message;
}

/**
 * Find messages with status 'pending' or 'failed' (for worker processing)
 * Returns messages ordered by created_at (oldest first)
 */
export async function findPendingOrFailed(limit: number = 10): Promise<Message[]> {
  const stmt = db.prepare(`
    SELECT id, name, email, message, status, created_at, sent_at, error_message
    FROM messages
    WHERE status IN ('pending', 'failed')
    ORDER BY created_at ASC
    LIMIT ?
  `);

  return stmt.all(limit) as Message[];
}

/**
 * Update message status
 */
export async function updateMessageStatus(input: UpdateMessageStatusInput): Promise<Message> {
  const updates: string[] = [];
  const values: (string | Date)[] = [];

  updates.push('status = ?');
  values.push(input.status);

  if (input.sent_at !== undefined) {
    updates.push('sent_at = ?');
    values.push(input.sent_at.toISOString());
  }

  if (input.error_message !== undefined) {
    updates.push('error_message = ?');
    values.push(input.error_message);
  }

  values.push(input.id);

  const stmt = db.prepare(`
    UPDATE messages
    SET ${updates.join(', ')}
    WHERE id = ?
  `);

  stmt.run(...values);

  const message = await getMessageById(input.id);
  if (!message) {
    throw new NotFoundError(`Message with id ${input.id} not found`);
  }

  return message;
}

/**
 * Get message by ID
 */
export async function getMessageById(id: string): Promise<Message | null> {
  const stmt = db.prepare(`
    SELECT id, name, email, message, status, created_at, sent_at, error_message
    FROM messages
    WHERE id = ?
  `);

  return (stmt.get(id) as Message) || null;
}

/**
 * Delete old messages from the database
 * Deletes messages older than specified number of days
 * Only deletes messages with status 'sent' (keeps pending and failed for retry)
 * 
 * @param daysOld - Number of days old messages should be (default: 90)
 * @returns Number of deleted messages
 */
export async function deleteOldMessages(daysOld: number = 90): Promise<number> {
  // Calculate cutoff date
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  const cutoffDateISO = cutoffDate.toISOString();

  // Delete only sent messages older than cutoff date
  // Keep pending and failed messages for retry/processing
  const stmt = db.prepare(`
    DELETE FROM messages
    WHERE status = 'sent' 
      AND created_at < ?
  `);

  const result = stmt.run(cutoffDateISO);
  return result.changes || 0;
}

/**
 * Get count of old messages that would be deleted
 * Useful for monitoring and logging before actual deletion
 * 
 * @param daysOld - Number of days old messages should be (default: 90)
 * @returns Count of messages that would be deleted
 */
export async function countOldMessages(daysOld: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  const cutoffDateISO = cutoffDate.toISOString();

  const stmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM messages
    WHERE status = 'sent' 
      AND created_at < ?
  `);

  const result = stmt.get(cutoffDateISO) as { count: number } | undefined;
  return result?.count || 0;
}