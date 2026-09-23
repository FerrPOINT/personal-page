import { TelegramError } from '../utils/errors.js';
import type { TelegramConfig } from '../config.js';

export interface MessageData {
  name: string;
  email: string;
  message: string;
  createdAt: Date;
}

const TELEGRAM_TIMEOUT_MS = 5_000;

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

export async function sendTelegramMessage(config: TelegramConfig, data: MessageData): Promise<void> {
  const { token, chatId } = config;
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

export interface TelegramSender {
  send(data: MessageData): Promise<void>;
}

export class TelegramClient implements TelegramSender {
  constructor(private readonly config: TelegramConfig) {}

  send(data: MessageData): Promise<void> {
    return sendTelegramMessage(this.config, data);
  }
}
