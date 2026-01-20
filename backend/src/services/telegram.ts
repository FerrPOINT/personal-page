import TelegramBot, { TelegramMessage } from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getTelegramChatId, setTelegramChatId } from '../models/BotSettings.js';
import { telegramLogger } from '../utils/logger.js';

// Load .env from project root
// In Docker, variables are already set via docker-compose, dotenv won't override them
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../../.env') });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_USER_ID = process.env.TELEGRAM_USER_ID;

// Create bot instance only if token is available (polling enabled to receive first message)
let bot: TelegramBot | null = null;

if (TELEGRAM_BOT_TOKEN) {
  try {
    telegramLogger.info('Initializing Telegram bot', { 
      tokenLength: TELEGRAM_BOT_TOKEN.length,
      tokenPrefix: TELEGRAM_BOT_TOKEN.substring(0, 10) + '...',
      hasUserId: !!TELEGRAM_USER_ID 
    });
    bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
    
    // If user ID is provided in env, save it as chat ID (for private chats, user ID = chat ID)
    if (TELEGRAM_USER_ID && TELEGRAM_USER_ID.trim() !== '') {
      const userId = TELEGRAM_USER_ID.trim();
      setTelegramChatId(userId);
      telegramLogger.info('User ID loaded from environment', { userId });
    }
    
    // Always setup handler to capture messages (in case user ID changes or wasn't set)
    setupMessageHandler();
    
    telegramLogger.info('Telegram bot initialized successfully', { userId: TELEGRAM_USER_ID || null });
  } catch (error: any) {
    telegramLogger.error('Error initializing Telegram bot', { 
      error: error.message, 
      stack: error.stack,
      response: error.response ? JSON.stringify(error.response) : null
    });
    bot = null; // Ensure bot is null on error
  }
} else {
  telegramLogger.warn('TELEGRAM_BOT_TOKEN not set - Telegram service will not be available');
}

export interface MessageData {
  name: string;
  email: string;
  message: string;
  createdAt: Date;
}

/**
 * Setup message handler to capture first message and save user ID
 * When user sends first message, bot saves their user ID for future notifications
 * Admin can check registered Telegram ID by sending any message
 */
function setupMessageHandler(): void {
  if (!bot) {
    return;
  }

  bot.on('message', async (msg: TelegramMessage) => {
    // Get user ID from message (msg.from.id is the actual user ID)
    const userId = msg.from?.id?.toString();
    if (!userId) {
      telegramLogger.warn('Received message without user ID');
      return;
    }
    
    telegramLogger.info('Received message', { userId, hasConfiguredUserId: !!TELEGRAM_USER_ID });
    
    // Check if sender is the configured user (admin check)
    const isAdmin = TELEGRAM_USER_ID && TELEGRAM_USER_ID.trim() !== '' && userId === TELEGRAM_USER_ID.trim();
    
    if (isAdmin) {
      // Admin: save chat ID if not already saved, then respond
      try {
        const registeredChatId = getTelegramChatId();
        const chatId = msg.chat.id.toString();
        
        if (!registeredChatId || registeredChatId !== chatId) {
          setTelegramChatId(chatId);
          telegramLogger.info('Saved chat ID for admin', { chatId, userId });
        }
        
        const responseMessage = registeredChatId
          ? `📋 Записанный Telegram Chat ID: \`${registeredChatId}\`\n✅ Chat ID обновлен: \`${chatId}\``
          : `✅ Telegram Chat ID зарегистрирован: \`${chatId}\``;
        
        telegramLogger.info('Sending response to admin', { userId, chatId });
        
        await bot!.sendMessage(chatId, responseMessage, { parse_mode: 'Markdown' });
        
        telegramLogger.info('Admin chat ID saved', { userId, chatId });
      } catch (error: any) {
        telegramLogger.error('Error sending admin response', { error: error.message, stack: error.stack, userId });
      }
      return;
    }
    
    telegramLogger.info('Message from non-admin user ignored', { userId, configuredUserId: TELEGRAM_USER_ID || null });
    return;
  });

  telegramLogger.info('Telegram bot message handler setup complete');
}

/**
 * Send contact form message to Telegram
 * @param messageData - Contact form data
 * @returns Promise<boolean> - true if sent successfully
 */
export async function sendTelegramMessage(messageData: MessageData): Promise<boolean> {
  if (!bot) {
    throw new Error('Telegram bot is not initialized. TELEGRAM_BOT_TOKEN is required.');
  }

  // Get user ID from database (saved when user first messages the bot)
  const userId = getTelegramChatId();

  if (!userId) {
    throw new Error('User ID is not set. Please send a message to the bot first to register your user ID.');
  }

  try {
    // Format message in Markdown
    const formattedMessage = formatMessage(messageData);

    // Send message to Telegram (to the user who first messaged the bot)
    await bot.sendMessage(userId, formattedMessage, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    });

    telegramLogger.info('Message sent to Telegram', { userId, email: messageData.email, messageId: messageData.name });
    return true;
  } catch (error: any) {
    telegramLogger.error('Error sending message to Telegram', {
      error: error.message,
      stack: error.stack,
      response: error.response,
      userId,
      email: messageData.email,
    });
    throw error;
  }
}

/**
 * Format message data into Markdown for Telegram
 */
function formatMessage(data: MessageData): string {
  // Handle both Date objects and ISO strings
  const dateObj = data.createdAt instanceof Date 
    ? data.createdAt 
    : new Date(data.createdAt);
  
  const date = dateObj.toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `📧 *Новое сообщение из формы контактов*

👤 *Имя:* ${escapeMarkdown(data.name)}
📮 *Email:* ${escapeMarkdown(data.email)}
📅 *Дата:* ${date}

💬 *Сообщение:*
${escapeMarkdown(data.message)}`;
}

/**
 * Escape special Markdown characters
 * Note: Dot (.) is not escaped as it's a normal character in emails and text
 */
function escapeMarkdown(text: string): string {
  return text
    .replace(/\_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\~/g, '\\~')
    .replace(/\`/g, '\\`')
    .replace(/\>/g, '\\>')
    .replace(/\#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/\-/g, '\\-')
    .replace(/\=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\!/g, '\\!');
}

/**
 * Test Telegram connection
 */
export async function testTelegramConnection(): Promise<boolean> {
  if (!bot) {
    telegramLogger.warn('Telegram bot is not initialized');
    return false;
  }

  try {
    const botInfo = await bot.getMe();
    telegramLogger.info('Telegram bot connected', { username: botInfo.username, botId: botInfo.id });
    return true;
  } catch (error: any) {
    telegramLogger.error('Telegram connection test failed', { error: error.message, stack: error.stack });
    return false;
  }
}

/**
 * Test Telegram connection with detailed error information
 */
export async function testTelegramConnectionWithDetails(): Promise<{ connected: boolean; username?: string; error?: string }> {
  if (!bot) {
    const reason = !TELEGRAM_BOT_TOKEN 
      ? 'TELEGRAM_BOT_TOKEN not set' 
      : 'Bot instance is null (initialization failed)';
    telegramLogger.warn('Bot is not initialized', { reason, hasToken: !!TELEGRAM_BOT_TOKEN, tokenLength: TELEGRAM_BOT_TOKEN?.length || 0 });
    return { connected: false, error: `Bot is not initialized: ${reason}` };
  }

  try {
    telegramLogger.info('Testing Telegram connection...', { tokenLength: TELEGRAM_BOT_TOKEN?.length || 0 });
    const botInfo = await bot.getMe();
    telegramLogger.info('Telegram bot connected', { username: botInfo.username, botId: botInfo.id });
    return { connected: true, username: botInfo.username };
  } catch (error: any) {
    let errorMessage = 'Unknown error';
    if (error.response) {
      const statusCode = error.response.statusCode || 'unknown';
      const body = error.response.body || {};
      const description = body.description || body.error_description || error.message || 'unknown error';
      errorMessage = `Telegram API error: ${statusCode} - ${description}`;
      telegramLogger.error('Telegram connection test failed', { 
        error: errorMessage, 
        statusCode,
        description,
        response: JSON.stringify(error.response.body || {}),
        stack: error.stack 
      });
    } else if (error.message) {
      errorMessage = error.message;
      telegramLogger.error('Telegram connection test failed', { error: errorMessage, stack: error.stack });
    } else {
      telegramLogger.error('Telegram connection test failed', { error: JSON.stringify(error), stack: error.stack });
    }
    return { connected: false, error: errorMessage };
  }
}

