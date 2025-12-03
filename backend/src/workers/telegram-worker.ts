import { findPendingOrFailed, updateMessageStatus } from '../models/Message.js';
import { sendTelegramMessage } from '../services/telegram.js';
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
    console.log(`📨 Processing message ${message.id} from ${message.email}`);

    // Send to Telegram
    await sendTelegramMessage({
      name: message.name,
      email: message.email,
      message: message.message,
      createdAt: new Date(message.created_at),
    });

    // Update status to 'sent'
    await updateMessageStatus({
      id: message.id,
      status: 'sent',
      sent_at: new Date(),
    });

    console.log(`✅ Message ${message.id} sent successfully`);
  } catch (error: any) {
    console.error(`❌ Error processing message ${message.id}:`, error);

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
    console.log('⏳ Worker is already processing messages, skipping...');
    return;
  }

  isRunning = true;

  try {
    console.log(`🔍 Checking for pending/failed messages at ${new Date().toISOString()}`);

    // Find messages to process (limit to 10 at a time to avoid overload)
    const messages = await findPendingOrFailed(10);

    if (messages.length === 0) {
      console.log('✅ No messages to process');
      return;
    }

    console.log(`📬 Found ${messages.length} message(s) to process`);

    // Process messages sequentially to avoid rate limits
    for (const message of messages) {
      await processMessage(message);
      // Small delay between messages to avoid Telegram rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Processed ${messages.length} message(s)`);
  } catch (error) {
    console.error('❌ Error in worker process:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the worker
 */
export function startWorker(): void {
  if (intervalId !== null) {
    console.warn('⚠️  Worker is already running');
    return;
  }

  console.log('🚀 Starting Telegram worker...');
  console.log(`⏰ Worker will check for messages every ${WORKER_INTERVAL_MS / 1000 / 60} minutes`);

  // Process immediately on start
  processMessages().catch(error => {
    console.error('❌ Error in initial worker run:', error);
  });

  // Then process periodically
  intervalId = setInterval(() => {
    processMessages().catch(error => {
      console.error('❌ Error in periodic worker run:', error);
    });
  }, WORKER_INTERVAL_MS);

  console.log('✅ Worker started successfully');
}

/**
 * Stop the worker
 */
export function stopWorker(): void {
  if (intervalId === null) {
    console.warn('⚠️  Worker is not running');
    return;
  }

  console.log('🛑 Stopping Telegram worker...');
  clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
  console.log('✅ Worker stopped');
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, stopping worker...');
  stopWorker();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, stopping worker...');
  stopWorker();
  process.exit(0);
});

