import { db } from '../services/database.js';

/**
 * Get bot setting value by key
 */
export function getBotSetting(key: string): string | null {
  const stmt = db.prepare('SELECT value FROM bot_settings WHERE key = ?');
  const result = stmt.get(key) as { value: string } | undefined;
  return result?.value || null;
}

/**
 * Set bot setting value by key
 */
export function setBotSetting(key: string, value: string): void {
  const stmt = db.prepare(`
    INSERT INTO bot_settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')
  `);
  stmt.run(key, value, value);
}

/**
 * Get Telegram user ID from settings
 * Note: For private chats, chat ID equals user ID
 */
export function getTelegramChatId(): string | null {
  return getBotSetting('telegram_chat_id');
}

/**
 * Set Telegram user ID in settings
 * Note: For private chats, chat ID equals user ID
 */
export function setTelegramChatId(chatId: string): void {
  setBotSetting('telegram_chat_id', chatId);
}
