import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../services/database.js';
import {
  claimNextMessage, createMessage, getMessageById, markMessageFailed,
  replayDeadMessage,
} from './Message.js';

describe('durable message queue', () => {
  beforeEach(() => db.prepare('DELETE FROM messages').run());

  it('stores a pending message and rejects a five-minute duplicate', async () => {
    const input = { name: 'Алексей', email: 'alex@example.com', message: 'Привет' };
    const saved = await createMessage(input);
    expect(saved).toMatchObject({ ...input, status: 'pending', attempt_count: 0 });
    await expect(Promise.all([createMessage(input), createMessage(input)]))
      .rejects.toMatchObject({ code: 'DUPLICATE_MESSAGE', statusCode: 409 });
    const count = db.prepare('SELECT COUNT(*) AS count FROM messages').get() as { count: number };
    expect(count.count).toBe(1);
  });

  it('claims one message, increments attempts and does not double-claim it', async () => {
    await createMessage({ name: 'A', email: 'a@example.com', message: 'One' });
    const now = new Date(Date.now() + 1_000);
    const claimed = await claimNextMessage(now);
    expect(claimed).toMatchObject({ status: 'processing', attempt_count: 1 });
    await expect(claimNextMessage(new Date(now.getTime() + 1_000))).resolves.toBeNull();
  });

  it('recovers a processing lease after ten minutes', async () => {
    const saved = await createMessage({ name: 'A', email: 'a@example.com', message: 'Lease' });
    db.prepare(`UPDATE messages SET status='processing', attempt_count=1, processing_started_at=? WHERE id=?`)
      .run('2026-09-16T09:49:59.000Z', saved.id);
    const claimed = await claimNextMessage(new Date('2026-09-16T10:00:00.000Z'));
    expect(claimed).toMatchObject({ id: saved.id, status: 'processing', attempt_count: 2 });
  });

  it('moves the eighth failed attempt to dead and replays it explicitly', async () => {
    const saved = await createMessage({ name: 'A', email: 'a@example.com', message: 'Retry' });
    db.prepare(`UPDATE messages SET status='processing', attempt_count=8, processing_started_at=? WHERE id=?`)
      .run(new Date().toISOString(), saved.id);
    const dead = await markMessageFailed(saved.id, 'provider unavailable', null);
    expect(dead).toMatchObject({ status: 'dead', attempt_count: 8, next_attempt_at: null });
    const replayed = await replayDeadMessage(saved.id);
    expect(replayed).toMatchObject({ status: 'pending', attempt_count: 0, error_message: null });
    expect((await getMessageById(saved.id))?.status).toBe('pending');
  });
});
