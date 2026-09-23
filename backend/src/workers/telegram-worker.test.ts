import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Message, MessageRepository } from '../models/Message.js';
import type { TelegramSender } from '../services/telegram.js';
import { nextAttemptAfter, QueueWorker } from './telegram-worker.js';

vi.mock('../utils/logger.js', () => ({ workerLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const message: Message = {
  id: 'message-id', name: 'Name', email: 'mail@example.com', message: 'Text', status: 'processing',
  attempt_count: 1, next_attempt_at: null, processing_started_at: '2026-09-16T10:00:00.000Z',
  created_at: '2026-09-16T09:59:00.000Z', sent_at: null, error_message: null,
};

describe('Telegram queue worker', () => {
  const repository = { claimNext: vi.fn(), markSent: vi.fn(), markFailed: vi.fn() } as unknown as MessageRepository;
  const telegram: TelegramSender = { send: vi.fn() };
  const worker = new QueueWorker(repository, telegram);
  beforeEach(() => vi.clearAllMocks());

  it('uses the documented retry schedule and stops after attempt eight', () => {
    const now = new Date('2026-09-16T10:00:00.000Z');
    expect([1, 2, 3, 4, 5, 6, 7].map((attempt) =>
      (nextAttemptAfter(attempt, now)!.getTime() - now.getTime()) / 60_000,
    )).toEqual([1, 5, 15, 60, 360, 720, 1440]);
    expect(nextAttemptAfter(8, now)).toBeNull();
  });

  it('marks a delivered message sent', async () => {
    vi.mocked(telegram.send).mockResolvedValue();
    vi.mocked(repository.markSent).mockReturnValue({ ...message, status: 'sent' });
    await worker.processMessage(message);
    expect(repository.markSent).toHaveBeenCalledWith(message.id, expect.any(Date));
  });

  it('schedules a failed attempt without leaking message data to state logs', async () => {
    vi.mocked(telegram.send).mockRejectedValue(new Error('network'));
    vi.mocked(repository.markFailed).mockReturnValue({ ...message, status: 'failed' });
    await worker.processMessage(message, new Date('2026-09-16T10:00:00.000Z'));
    expect(repository.markFailed).toHaveBeenCalledWith(message.id, 'network', new Date('2026-09-16T10:01:00.000Z'));
  });

  it('waits for an active delivery before stopping', async () => {
    let release!: () => void;
    vi.mocked(repository.claimNext).mockReturnValueOnce(message).mockReturnValueOnce(null);
    vi.mocked(telegram.send).mockImplementation(() => new Promise<void>((resolve) => { release = resolve; }));
    vi.mocked(repository.markSent).mockReturnValue({ ...message, status: 'sent' });
    const running = worker.processQueue();
    const stopped = worker.stop();
    let completed = false;
    void stopped.then(() => { completed = true; });
    await Promise.resolve();
    expect(completed).toBe(false);
    release();
    await Promise.all([running, stopped]);
    expect(completed).toBe(true);
  });
});
