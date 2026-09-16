import { claimNextMessage, markMessageFailed, markMessageSent, type Message } from '../models/Message.js';
import { sendTelegramMessage } from '../services/telegram.js';
import { toAppError } from '../utils/errors.js';
import { workerLogger } from '../utils/logger.js';

export const WORKER_INTERVAL_MS = 30_000;
const RETRY_DELAYS_MINUTES = [1, 5, 15, 60, 360, 720, 1440] as const;
const MAX_MESSAGES_PER_RUN = 10;

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

export function nextAttemptAfter(attemptCount: number, now = new Date()): Date | null {
  if (attemptCount >= 8) return null;
  const delay = RETRY_DELAYS_MINUTES[attemptCount - 1];
  return new Date(now.getTime() + delay * 60 * 1000);
}

export async function processMessage(message: Message, now = new Date()): Promise<void> {
  try {
    await sendTelegramMessage({
      name: message.name,
      email: message.email,
      message: message.message,
      createdAt: new Date(message.created_at),
    });
    await markMessageSent(message.id, now);
    workerLogger.info('Message sent', { messageId: message.id, state: 'sent' });
  } catch (error: unknown) {
    const appError = toAppError(error);
    const nextAttemptAt = nextAttemptAfter(message.attempt_count, now);
    const updated = await markMessageFailed(message.id, appError.message, nextAttemptAt);
    workerLogger.warn('Message delivery failed', {
      messageId: message.id,
      state: updated.status,
      attemptCount: updated.attempt_count,
      errorCode: appError.code,
    });
  }
}

export async function processQueue(): Promise<void> {
  if (isRunning) return;
  isRunning = true;
  try {
    for (let processed = 0; processed < MAX_MESSAGES_PER_RUN; processed += 1) {
      const message = await claimNextMessage();
      if (!message) break;
      await processMessage(message);
    }
  } catch (error: unknown) {
    workerLogger.error('Queue run failed', { errorCode: toAppError(error).code });
  } finally {
    isRunning = false;
  }
}

export function startWorker(): void {
  if (intervalId) return;
  void processQueue();
  intervalId = setInterval(() => void processQueue(), WORKER_INTERVAL_MS);
  workerLogger.info('Telegram queue worker started', { intervalMs: WORKER_INTERVAL_MS });
}

export function stopWorker(): void {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
}
