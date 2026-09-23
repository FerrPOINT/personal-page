import type { Message, MessageRepository } from '../models/Message.js';
import type { TelegramSender } from '../services/telegram.js';
import { toAppError } from '../utils/errors.js';
import { workerLogger } from '../utils/logger.js';

export const WORKER_INTERVAL_MS = 30_000;
const RETRY_DELAYS_MINUTES = [1, 5, 15, 60, 360, 720, 1440] as const;
const MAX_MESSAGES_PER_RUN = 10;

export function nextAttemptAfter(attemptCount: number, now = new Date()): Date | null {
  if (attemptCount >= 8) return null;
  return new Date(now.getTime() + RETRY_DELAYS_MINUTES[attemptCount - 1] * 60 * 1000);
}

export class QueueWorker {
  private intervalId: NodeJS.Timeout | null = null;
  private activeRun: Promise<void> | null = null;

  constructor(
    private readonly repository: MessageRepository,
    private readonly telegram: TelegramSender,
  ) {}

  async processMessage(message: Message, now = new Date()): Promise<void> {
    try {
      await this.telegram.send({
        name: message.name,
        email: message.email,
        message: message.message,
        createdAt: new Date(message.created_at),
      });
      this.repository.markSent(message.id, now);
      workerLogger.info('Message sent', { messageId: message.id, state: 'sent' });
    } catch (error: unknown) {
      const appError = toAppError(error);
      const nextAttemptAt = nextAttemptAfter(message.attempt_count, now);
      const updated = this.repository.markFailed(message.id, appError.message, nextAttemptAt);
      workerLogger.warn('Message delivery failed', {
        messageId: message.id,
        state: updated.status,
        attemptCount: updated.attempt_count,
        errorCode: appError.code,
      });
    }
  }

  processQueue(): Promise<void> {
    if (this.activeRun) return this.activeRun;
    this.activeRun = this.runQueue().finally(() => { this.activeRun = null; });
    return this.activeRun;
  }

  private async runQueue(): Promise<void> {
    try {
      for (let processed = 0; processed < MAX_MESSAGES_PER_RUN; processed += 1) {
        const message = this.repository.claimNext();
        if (!message) break;
        await this.processMessage(message);
      }
    } catch (error: unknown) {
      workerLogger.error('Queue run failed', { errorCode: toAppError(error).code });
    }
  }

  start(): void {
    if (this.intervalId) return;
    void this.processQueue();
    this.intervalId = setInterval(() => void this.processQueue(), WORKER_INTERVAL_MS);
    workerLogger.info('Telegram queue worker started', { intervalMs: WORKER_INTERVAL_MS });
  }

  async stop(): Promise<void> {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
    await this.activeRun;
  }
}
