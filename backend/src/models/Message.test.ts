import { beforeEach, describe, expect, it } from 'vitest';
import { testDatabase, testMessages } from '../test/setup.js';

describe('durable message queue', () => {
  beforeEach(() => testDatabase.prepare('DELETE FROM messages').run());

  it('stores a pending message and rejects a five-minute duplicate', async () => {
    const input = { name: 'Алексей', email: 'alex@example.com', message: 'Привет' };
    const saved = testMessages.create(input);
    expect(saved).toMatchObject({ ...input, status: 'pending', attempt_count: 0 });
    expect(() => testMessages.create(input)).toThrow(expect.objectContaining({ code: 'DUPLICATE_MESSAGE', statusCode: 409 }));
    const count = testDatabase.prepare('SELECT COUNT(*) AS count FROM messages').get() as { count: number };
    expect(count.count).toBe(1);
  });

  it('claims one message, increments attempts and does not double-claim it', async () => {
    testMessages.create({ name: 'A', email: 'a@example.com', message: 'One' });
    const now = new Date(Date.now() + 1_000);
    const claimed = testMessages.claimNext(now);
    expect(claimed).toMatchObject({ status: 'processing', attempt_count: 1 });
    expect(testMessages.claimNext(new Date(now.getTime() + 1_000))).toBeNull();
  });

  it('recovers a processing lease after ten minutes', async () => {
    const saved = testMessages.create({ name: 'A', email: 'a@example.com', message: 'Lease' });
    testDatabase.prepare(`UPDATE messages SET status='processing', attempt_count=1, processing_started_at=? WHERE id=?`)
      .run('2026-09-16T09:49:59.000Z', saved.id);
    const claimed = testMessages.claimNext(new Date('2026-09-16T10:00:00.000Z'));
    expect(claimed).toMatchObject({ id: saved.id, status: 'processing', attempt_count: 2 });
  });

  it('moves the eighth failed attempt to dead and replays it explicitly', async () => {
    const saved = testMessages.create({ name: 'A', email: 'a@example.com', message: 'Retry' });
    testDatabase.prepare(`UPDATE messages SET status='processing', attempt_count=8, processing_started_at=? WHERE id=?`)
      .run(new Date().toISOString(), saved.id);
    const dead = testMessages.markFailed(saved.id, 'provider unavailable', null);
    expect(dead).toMatchObject({ status: 'dead', attempt_count: 8, next_attempt_at: null });
    const replayed = testMessages.replayDead(saved.id);
    expect(replayed).toMatchObject({ status: 'pending', attempt_count: 0, error_message: null });
    expect(testMessages.getById(saved.id)?.status).toBe('pending');
  });
});
