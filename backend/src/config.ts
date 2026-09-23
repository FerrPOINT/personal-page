import { resolve } from 'node:path';

export interface TelegramConfig { token: string; chatId: string }

export interface AppConfig {
  nodeEnv: string;
  port: number;
  databasePath: string;
  logDir: string;
  allowedOrigins: string[];
  telegram: TelegramConfig | null;
}

export function parseTelegramConfig(env: NodeJS.ProcessEnv): TelegramConfig | null {
  const token = env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId || !/^\d+:[A-Za-z0-9_-]+$/.test(token) || !/^-?\d+$/.test(chatId)) return null;
  return { token, chatId };
}

export function loadAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const nodeEnv = env.NODE_ENV || 'development';
  const telegram = parseTelegramConfig(env);
  if (nodeEnv === 'production' && !telegram) {
    throw new Error('Required configuration is missing or invalid: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set');
  }
  return {
    nodeEnv,
    port: Number(env.API_PORT || 9000),
    databasePath: env.DATABASE_PATH || resolve(process.cwd(), 'data/database.db'),
    logDir: env.LOG_DIR || resolve(process.cwd(), 'logs'),
    allowedOrigins: env.FRONTEND_URL
      ? env.FRONTEND_URL.split(',').map((value) => value.trim()).filter(Boolean)
      : ['http://localhost:8888', 'http://localhost:5173'],
    telegram,
  };
}
