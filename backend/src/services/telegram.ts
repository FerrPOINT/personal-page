import { TelegramError } from '../utils/errors.js';

export interface MessageData {
  name: string;
  email: string;
  message: string;
  createdAt: Date;
}

const TELEGRAM_TIMEOUT_MS = 5_000;

export function getTelegramConfig(): { token: string; chatId: string } | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId || !/^\d+:[A-Za-z0-9_-]+$/.test(token) || !/^-?\d+$/.test(chatId)) return null;
  return { token, chatId };
}

export function assertTelegramConfig(): { token: string; chatId: string } {
  const config = getTelegramConfig();
  if (!config) throw new Error('Required configuration is missing or invalid: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set');
  return config;
}

export function escapeTelegramHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function formatTelegramMessage(data: MessageData): string {
  return [
    '<b>Новое сообщение с azhukov-dev.ru</b>', '',
    `<b>Имя:</b> ${escapeTelegramHtml(data.name)}`,
    `<b>Email:</b> ${escapeTelegramHtml(data.email)}`,
    `<b>Время:</b> ${escapeTelegramHtml(data.createdAt.toISOString())}`, '',
    '<b>Сообщение:</b>', escapeTelegramHtml(data.message),
  ].join('\n');
}

export async function sendTelegramMessage(data: MessageData): Promise<void> {
  const { token, chatId } = assertTelegramConfig();
  let response: Response;
  try {
    response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: formatTelegramMessage(data), parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
    });
  } catch (error) {
    throw new TelegramError(error instanceof Error && error.name === 'TimeoutError'
      ? 'Telegram request timed out' : 'Telegram request failed');
  }
  if (!response.ok) {
    let description = `HTTP ${response.status}`;
    try {
      const body = await response.json() as { description?: string };
      if (body.description) description = body.description;
    } catch { /* Keep the status-only error. */ }
    throw new TelegramError(`Telegram API rejected the message: ${description}`);
  }
}
