import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../index.js';
import { loadAppConfig } from '../config.js';
import { testDatabase, testMessages } from '../test/setup.js';
import { QueueWorker } from '../workers/telegram-worker.js';

describe('POST /api/contact', () => {
  const app = createApp({ config: loadAppConfig(), database: testDatabase, messages: testMessages });
  beforeEach(() => testDatabase.prepare('DELETE FROM messages').run());

  it('returns 202 only after a pending row is stored', async () => {
    const response = await request(app).post('/api/contact').set('X-Forwarded-For', '10.0.0.1').send({
      name: 'Алексей', email: 'alex@example.com', message: 'Сообщение',
    });
    expect(response.status).toBe(202);
    expect(response.body).toMatchObject({ success: true, data: { status: 'pending' } });
    expect(testDatabase.prepare('SELECT status FROM messages WHERE id = ?').get(response.body.data.id))
      .toEqual({ status: 'pending' });
  });

  it('stores multiline and HTML-like message text without data loss', async () => {
    const response = await request(app).post('/api/contact').set('X-Forwarded-For', '10.0.0.11').send({
      name: ' Generic<T> ', email: 'generic@example.com', message: 'Line 1\r\n\tList<T>\nПривет',
    });

    expect(response.status).toBe(202);
    expect(testDatabase.prepare('SELECT name, message FROM messages WHERE id = ?').get(response.body.data.id))
      .toEqual({ name: 'Generic<T>', message: 'Line 1\n\tList<T>\nПривет' });
  });

  it('delivers an accepted SQLite message after the worker restarts', async () => {
    const response = await request(app).post('/api/contact').set('X-Forwarded-For', '10.0.0.12').send({
      name: 'Queue User', email: 'queue@example.com', message: 'Deliver after restart',
    });
    const firstSend = vi.fn().mockRejectedValue(new Error('provider unavailable'));
    await new QueueWorker(testMessages, { send: firstSend }).processQueue();
    expect(testMessages.getById(response.body.data.id)?.status).toBe('failed');

    testDatabase.prepare('UPDATE messages SET next_attempt_at = ? WHERE id = ?')
      .run(new Date(Date.now() - 1_000).toISOString(), response.body.data.id);
    const restartedSend = vi.fn().mockResolvedValue(undefined);
    await new QueueWorker(testMessages, { send: restartedSend }).processQueue();

    expect(restartedSend).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Queue User', email: 'queue@example.com', message: 'Deliver after restart',
    }));
    expect(testMessages.getById(response.body.data.id)?.status).toBe('sent');
  });

  it('returns structured 400 and field errors', async () => {
    const response = await request(app).post('/api/contact').set('X-Forwarded-For', '10.0.0.2').send({ name: '', email: 'bad', message: '' });
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR', fields: { email: 'Некорректный email' } },
    });
    expect(response.body.requestId).toBeTruthy();
  });

  it('returns 409 for a duplicate', async () => {
    const body = { name: 'A', email: 'a@example.com', message: 'Same' };
    expect((await request(app).post('/api/contact').set('X-Forwarded-For', '10.0.0.3').send(body)).status).toBe(202);
    const duplicate = await request(app).post('/api/contact').set('X-Forwarded-For', '10.0.0.3').send(body);
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('DUPLICATE_MESSAGE');
  });

  it('returns 413 for an oversized body', async () => {
    const response = await request(app).post('/api/contact').set('X-Forwarded-For', '10.0.0.4').send({
      name: 'A', email: 'a@example.com', message: 'x'.repeat(70_000),
    });
    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('returns structured 500 when SQLite cannot persist the message', async () => {
    testDatabase.pragma('query_only = ON');
    try {
      const response = await request(app).post('/api/contact').set('X-Forwarded-For', '10.0.0.6').send({
        name: 'A', email: 'write-failure@example.com', message: 'Cannot write',
      });
      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        success: false,
        error: { code: 'DATABASE_ERROR' },
      });
      expect(response.body.requestId).toBeTruthy();
    } finally {
      testDatabase.pragma('query_only = OFF');
    }
  });

  it('returns 429 after five submissions from one client', async () => {
    for (let i = 0; i < 5; i += 1) {
      const result = await request(app).post('/api/contact').set('X-Forwarded-For', '10.0.0.5').send({
        name: 'A', email: `a${i}@example.com`, message: `Message ${i}`,
      });
      expect(result.status).toBe(202);
    }
    const limited = await request(app).post('/api/contact').set('X-Forwarded-For', '10.0.0.5').send({
      name: 'A', email: 'last@example.com', message: 'Last',
    });
    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe('RATE_LIMITED');
  });
});
