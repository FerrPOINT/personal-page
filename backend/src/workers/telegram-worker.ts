import { findPendingOrFailed, updateMessageStatus } from '../models/Message.js';
import { sendTelegramMessage } from '../services/telegram.js';
import { workerLogger } from '../utils/logger.js';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load .env from project root
// In Docker, variables are already set via docker-compose, dotenv won't override them
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../../.env') });

const WORKER_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

/**
 * Process a single message: send to Telegram and update status
 * Exported for immediate processing after message creation
 */
export async function processMessage(message: any): Promise<void> {
  try {
    workerLogger.info('Processing message', { messageId: message.id, email: message.email });

    await sendTelegramMessage({
      name: message.name,
      email: message.email,
      message: message.message,
      createdAt: new Date(message.created_at),
    });

    await updateMessageStatus({
      id: message.id,
      status: 'sent',
      sent_at: new Date(),
    });

    workerLogger.info('Message sent successfully', { messageId: message.id });
  } catch (error: any) {
    workerLogger.error('Error processing message', { messageId: message.id, error: error.message, stack: error.stack });

    // Update status to 'failed' with error message
    const errorMessage = error.message || error.toString();
    await updateMessageStatus({
      id: message.id,
      status: 'failed',
      error_message: errorMessage.substring(0, 500), // Limit error message length
    });

    // Don't throw - continue processing other messages
  }
}

/**
 * Process all pending and failed messages
 */
async function processMessages(): Promise<void> {
  if (isRunning) {
    workerLogger.debug('Worker is already processing messages, skipping');
    return;
  }

  isRunning = true;

  try {
    const messages = await findPendingOrFailed(10);

    if (messages.length === 0) {
      workerLogger.debug('No messages to process');
      return;
    }

    workerLogger.info('Found messages to process', { count: messages.length });

    for (const message of messages) {
      await processMessage(message);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    workerLogger.info('Processed messages', { count: messages.length });
  } catch (error: any) {
    workerLogger.error('Error in worker process', { error: error.message, stack: error.stack });
  } finally {
    isRunning = false;
  }
}

/**
 * Start the worker
 */
export function startWorker(): void {
  if (intervalId !== null) {
    workerLogger.warn('Worker is already running');
    return;
  }

  workerLogger.info('Starting Telegram worker', { intervalMinutes: WORKER_INTERVAL_MS / 1000 / 60 });

  processMessages().catch(error => {
    workerLogger.error('Error in initial worker run', { error: error.message, stack: error.stack });
  });

  intervalId = setInterval(() => {
    processMessages().catch(error => {
      workerLogger.error('Error in periodic worker run', { error: error.message, stack: error.stack });
    });
  }, WORKER_INTERVAL_MS);

  workerLogger.info('Worker started successfully');
}

/**
 * Stop the worker
 */
export function stopWorker(): void {
  if (intervalId === null) {
    workerLogger.warn('Worker is not running');
    return;
  }

  workerLogger.info('Stopping Telegram worker');
  clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
  workerLogger.info('Worker stopped');
}

process.on('SIGTERM', () => {
  workerLogger.info('SIGTERM received, stopping worker');
  stopWorker();
  process.exit(0);
});

process.on('SIGINT', () => {
  workerLogger.info('SIGINT received, stopping worker');
  stopWorker();
  process.exit(0);
});

