import { randomUUID } from 'node:crypto';
import { db } from '../services/database.js';
import { DatabaseError, DuplicateError, NotFoundError } from '../utils/errors.js';

export type MessageStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'dead';

export interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  status: MessageStatus;
  attempt_count: number;
  next_attempt_at: string | null;
  processing_started_at: string | null;
  created_at: string;
  sent_at: string | null;
  error_message: string | null;
}

export interface CreateMessageInput {
  name: string;
  email: string;
  message: string;
}

const selectColumns = `
  id, name, email, message, status, attempt_count, next_attempt_at,
  processing_started_at, created_at, sent_at, error_message
`;

function getMessageByIdSync(id: string): Message | null {
  return (db.prepare(`SELECT ${selectColumns} FROM messages WHERE id = ?`).get(id) as Message | undefined) ?? null;
}

export async function getMessageById(id: string): Promise<Message | null> {
  return getMessageByIdSync(id);
}

/** Creates a message and checks duplicates under the same immediate lock. */
export async function createMessage(input: CreateMessageInput): Promise<Message> {
  const insert = db.transaction((data: CreateMessageInput) => {
    const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const duplicate = db.prepare(`
      SELECT 1 FROM messages
      WHERE email = ? AND message = ? AND created_at > ?
      LIMIT 1
    `).get(data.email, data.message, cutoff);
    if (duplicate) {
      throw new DuplicateError('Такое сообщение уже принято. Повторите попытку через пять минут.');
    }

    const id = randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO messages (
        id, name, email, message, status, attempt_count, next_attempt_at,
        processing_started_at, created_at, sent_at, error_message
      ) VALUES (?, ?, ?, ?, 'pending', 0, ?, NULL, ?, NULL, NULL)
    `).run(id, data.name, data.email, data.message, createdAt, createdAt);

    const created = getMessageByIdSync(id);
    if (!created) throw new DatabaseError('Не удалось сохранить сообщение');
    return created;
  });

  try {
    return insert.immediate(input);
  } catch (error) {
    if (error instanceof DuplicateError || error instanceof DatabaseError) throw error;
    throw new DatabaseError('Не удалось сохранить сообщение', error instanceof Error ? error : undefined);
  }
}

/** Claims one due message and recovers stale leases atomically. */
export async function claimNextMessage(now = new Date()): Promise<Message | null> {
  const claim = db.transaction((claimTime: Date) => {
    const nowIso = claimTime.toISOString();
    const staleBefore = new Date(claimTime.getTime() - 10 * 60 * 1000).toISOString();
    db.prepare(`
      UPDATE messages
      SET status = 'failed', processing_started_at = NULL, next_attempt_at = ?
      WHERE status = 'processing' AND processing_started_at <= ?
    `).run(nowIso, staleBefore);

    const candidate = db.prepare(`
      SELECT id FROM messages
      WHERE status IN ('pending', 'failed')
        AND (next_attempt_at IS NULL OR next_attempt_at <= ?)
      ORDER BY created_at ASC
      LIMIT 1
    `).get(nowIso) as { id: string } | undefined;
    if (!candidate) return null;

    const result = db.prepare(`
      UPDATE messages
      SET status = 'processing', attempt_count = attempt_count + 1,
          processing_started_at = ?, next_attempt_at = NULL
      WHERE id = ? AND status IN ('pending', 'failed')
    `).run(nowIso, candidate.id);
    return result.changes === 1 ? getMessageByIdSync(candidate.id) : null;
  });
  return claim.immediate(now);
}

export async function markMessageSent(id: string, sentAt = new Date()): Promise<Message> {
  const result = db.prepare(`
    UPDATE messages
    SET status = 'sent', sent_at = ?, processing_started_at = NULL,
        next_attempt_at = NULL, error_message = NULL
    WHERE id = ? AND status = 'processing'
  `).run(sentAt.toISOString(), id);
  if (result.changes !== 1) throw new NotFoundError(`Processing message ${id} not found`);
  return getMessageByIdSync(id)!;
}

export async function markMessageFailed(id: string, errorMessage: string, nextAttemptAt: Date | null): Promise<Message> {
  const status: MessageStatus = nextAttemptAt ? 'failed' : 'dead';
  const result = db.prepare(`
    UPDATE messages
    SET status = ?, next_attempt_at = ?, processing_started_at = NULL,
        error_message = ?
    WHERE id = ? AND status = 'processing'
  `).run(status, nextAttemptAt?.toISOString() ?? null, errorMessage.slice(0, 500), id);
  if (result.changes !== 1) throw new NotFoundError(`Processing message ${id} not found`);
  return getMessageByIdSync(id)!;
}

export async function replayDeadMessage(id: string): Promise<Message> {
  const result = db.prepare(`
    UPDATE messages
    SET status = 'pending', attempt_count = 0, next_attempt_at = ?,
        processing_started_at = NULL, sent_at = NULL, error_message = NULL
    WHERE id = ? AND status = 'dead'
  `).run(new Date().toISOString(), id);
  if (result.changes !== 1) throw new NotFoundError(`Dead message ${id} not found`);
  return getMessageByIdSync(id)!;
}
