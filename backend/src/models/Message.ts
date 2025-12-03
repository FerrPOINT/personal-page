import { db } from '../services/database.js';
import { randomUUID } from 'crypto';

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
 * Create a new message in the database
 */
export async function createMessage(input: CreateMessageInput): Promise<Message> {
  const id = randomUUID();
  const createdAt = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO messages (id, name, email, message, status, created_at)
    VALUES (?, ?, ?, ?, 'pending', ?)
  `);

  stmt.run(id, input.name, input.email, input.message, createdAt);

  const message = await getMessageById(id);
  if (!message) {
    throw new Error('Failed to create message');
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
  const values: any[] = [];

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
    throw new Error(`Message with id ${input.id} not found`);
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
