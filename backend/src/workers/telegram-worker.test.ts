import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as MessageModel from '../models/Message.js';
import * as Telegram from '../services/telegram.js';
import { nextAttemptAfter, processMessage } from './telegram-worker.js';

vi.mock('../models/Message.js');
vi.mock('../services/telegram.js');
vi.mock('../utils/logger.js', () => ({
  workerLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  dbLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const message = {
  id: 'message-id', name: 'Name', email: 'mail@example.com', message: 'Text',
  status: 'processing' as const, attempt_count: 1, next_attempt_at: null,
  processing_started_at: '2026-09-16T10:00:00.000Z', created_at: '2026-09-16T09:59:00.000Z',
  sent_at: null, error_message: null,
};

describe('Telegram queue worker', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses the documented retry schedule and stops after attempt eight', () => {
    const now = new Date('2026-09-16T10:00:00.000Z');
    expect([1, 2, 3, 4, 5, 6, 7].map((attempt) =>
      (nextAttemptAfter(attempt, now)!.getTime() - now.getTime()) / 60_000,
    )).toEqual([1, 5, 15, 60, 360, 720, 1440]);
    expect(nextAttemptAfter(8, now)).toBeNull();
  });

  it('marks a delivered message sent', async () => {
    vi.mocked(Telegram.sendTelegramMessage).mockResolvedValue();
    vi.mocked(MessageModel.markMessageSent).mockResolvedValue({ ...message, status: 'sent' });
    await processMessage(message);
    expect(MessageModel.markMessageSent).toHaveBeenCalledWith(message.id, expect.any(Date));
  });

  it('schedules a failed attempt without leaking message data to state logs', async () => {
    vi.mocked(Telegram.sendTelegramMessage).mockRejectedValue(new Error('network'));
    vi.mocked(MessageModel.markMessageFailed).mockResolvedValue({ ...message, status: 'failed' });
    await processMessage(message, new Date('2026-09-16T10:00:00.000Z'));
    expect(MessageModel.markMessageFailed).toHaveBeenCalledWith(
      message.id, 'network', new Date('2026-09-16T10:01:00.000Z'),
    );
  });
});
