import { randomUUID } from 'node:crypto';
import type { AppDatabase } from '../services/database.js';
import { DatabaseError, DuplicateError, NotFoundError } from '../utils/errors.js';

export type MessageStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'dead';

export interface Message {
  id: string; name: string; email: string; message: string; status: MessageStatus;
  attempt_count: number; next_attempt_at: string | null; processing_started_at: string | null;
  created_at: string; sent_at: string | null; error_message: string | null;
}

export interface CreateMessageInput { name: string; email: string; message: string }

const selectColumns = `id, name, email, message, status, attempt_count, next_attempt_at,
  processing_started_at, created_at, sent_at, error_message`;

export class MessageRepository {
  constructor(private readonly database: AppDatabase) {}

  getById(id: string): Message | null {
    return (this.database.prepare(`SELECT ${selectColumns} FROM messages WHERE id = ?`).get(id) as Message | undefined) ?? null;
  }

  create(input: CreateMessageInput): Message {
    const insert = this.database.transaction((data: CreateMessageInput) => {
      const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const duplicate = this.database.prepare(`
        SELECT 1 FROM messages WHERE email = ? AND message = ? AND created_at > ? LIMIT 1
      `).get(data.email, data.message, cutoff);
      if (duplicate) throw new DuplicateError('Такое сообщение уже принято. Повторите попытку через пять минут.');

      const id = randomUUID();
      const createdAt = new Date().toISOString();
      this.database.prepare(`
        INSERT INTO messages (id, name, email, message, status, attempt_count, next_attempt_at,
          processing_started_at, created_at, sent_at, error_message)
        VALUES (?, ?, ?, ?, 'pending', 0, ?, NULL, ?, NULL, NULL)
      `).run(id, data.name, data.email, data.message, createdAt, createdAt);
      const created = this.getById(id);
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

  claimNext(now = new Date()): Message | null {
    const claim = this.database.transaction((claimTime: Date) => {
      const nowIso = claimTime.toISOString();
      const staleBefore = new Date(claimTime.getTime() - 10 * 60 * 1000).toISOString();
      this.database.prepare(`
        UPDATE messages SET status = 'failed', processing_started_at = NULL, next_attempt_at = ?
        WHERE status = 'processing' AND processing_started_at <= ?
      `).run(nowIso, staleBefore);
      const candidate = this.database.prepare(`
        SELECT id FROM messages INDEXED BY idx_messages_due
        WHERE status IN ('pending', 'failed') AND next_attempt_at <= ?
        ORDER BY next_attempt_at ASC, created_at ASC LIMIT 1
      `).get(nowIso) as { id: string } | undefined;
      if (!candidate) return null;
      const result = this.database.prepare(`
        UPDATE messages SET status = 'processing', attempt_count = attempt_count + 1,
          processing_started_at = ?, next_attempt_at = NULL
        WHERE id = ? AND status IN ('pending', 'failed')
      `).run(nowIso, candidate.id);
      return result.changes === 1 ? this.getById(candidate.id) : null;
    });
    return claim.immediate(now);
  }

  markSent(id: string, sentAt = new Date()): Message {
    const result = this.database.prepare(`UPDATE messages SET status = 'sent', sent_at = ?,
      processing_started_at = NULL, next_attempt_at = NULL, error_message = NULL
      WHERE id = ? AND status = 'processing'`).run(sentAt.toISOString(), id);
    if (result.changes !== 1) throw new NotFoundError(`Processing message ${id} not found`);
    return this.getById(id)!;
  }

  markFailed(id: string, errorMessage: string, nextAttemptAt: Date | null): Message {
    const status: MessageStatus = nextAttemptAt ? 'failed' : 'dead';
    const result = this.database.prepare(`UPDATE messages SET status = ?, next_attempt_at = ?,
      processing_started_at = NULL, error_message = ? WHERE id = ? AND status = 'processing'`)
      .run(status, nextAttemptAt?.toISOString() ?? null, errorMessage.slice(0, 500), id);
    if (result.changes !== 1) throw new NotFoundError(`Processing message ${id} not found`);
    return this.getById(id)!;
  }

  replayDead(id: string): Message {
    const result = this.database.prepare(`UPDATE messages SET status = 'pending', attempt_count = 0,
      next_attempt_at = ?, processing_started_at = NULL, sent_at = NULL, error_message = NULL
      WHERE id = ? AND status = 'dead'`).run(new Date().toISOString(), id);
    if (result.changes !== 1) throw new NotFoundError(`Dead message ${id} not found`);
    return this.getById(id)!;
  }
}
