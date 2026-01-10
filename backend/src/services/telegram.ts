import TelegramBot, { TelegramMessage } from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getTelegramChatId, setTelegramChatId } from '../models/BotSettings.js';

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
    bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
    
    // If user ID is provided in env, save it as chat ID (for private chats, user ID = chat ID)
    if (TELEGRAM_USER_ID && TELEGRAM_USER_ID.trim() !== '') {
      const userId = TELEGRAM_USER_ID.trim();
      setTelegramChatId(userId);
      console.log(`✅ User ID loaded from environment, chat ID set: ${userId}`);
    }
    
    // Always setup handler to capture messages (in case user ID changes or wasn't set)
    setupMessageHandler();
    
    console.log(`✅ Telegram bot initialized. User ID: ${TELEGRAM_USER_ID || 'not set'}`);
  } catch (error) {
    console.error('❌ Error initializing Telegram bot:', error);
  }
} else {
  console.warn('⚠️  TELEGRAM_BOT_TOKEN not set - Telegram service will not be available');
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
      console.log('⚠️  Received message without user ID');
      return; // Skip if no user ID in message
    }
    
    console.log(`📨 Received message from user ID: ${userId}, user ID configured: ${TELEGRAM_USER_ID ? 'yes' : 'no'}`);
    
    // Check if sender is the configured user (admin check)
    const isAdmin = TELEGRAM_USER_ID && TELEGRAM_USER_ID.trim() !== '' && userId === TELEGRAM_USER_ID.trim();
    
    if (isAdmin) {
      // Admin: respond with registered Telegram ID
      try {
        const registeredChatId = getTelegramChatId();
        const responseMessage = registeredChatId
          ? `📋 Записанный Telegram Chat ID: \`${registeredChatId}\``
          : '⚠️ Telegram Chat ID еще не зарегистрирован. Отправьте сообщение боту с аккаунта, на который нужно получать уведомления.';
        
        console.log(`📤 Sending response to admin ${userId}: ${responseMessage}`);
        
        await bot!.sendMessage(
          msg.chat.id.toString(),
          responseMessage,
          { parse_mode: 'Markdown' }
        );
        
        console.log(`✅ Admin ${userId} requested chat ID info. Registered: ${registeredChatId || 'none'}`);
      } catch (error) {
        console.error('❌ Error sending admin response:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message, error.stack);
        }
      }
      return; // Don't process further for admin
    }
    
    // For non-admin users, ignore messages (don't register or respond)
    console.log(`ℹ️  Message from non-admin user ${userId} ignored (user ID: ${TELEGRAM_USER_ID || 'not set'})`);
    return;
  });

  console.log('✅ Telegram bot message handler setup complete');
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

    console.log(`✅ Message sent to Telegram user ${userId} for: ${messageData.email}`);
    return true;
  } catch (error: any) {
    console.error('❌ Error sending message to Telegram:', error);
    
    // Log error details for debugging
    if (error.response) {
      console.error('Telegram API response:', error.response);
    }
    
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
    console.warn('⚠️  Telegram bot is not initialized');
    return false;
  }

  try {
    const botInfo = await bot.getMe();
    console.log(`✅ Telegram bot connected: @${botInfo.username}`);
    return true;
  } catch (error) {
    console.error('❌ Telegram connection test failed:', error);
    return false;
  }
}

