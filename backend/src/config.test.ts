import { describe, expect, it } from 'vitest';
import { loadAppConfig } from './config.js';

describe('application configuration', () => {
  it('rejects missing Telegram configuration in production', () => {
    expect(() => loadAppConfig({ NODE_ENV: 'production' })).toThrow(/TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID/);
  });

  it('parses runtime settings once into a typed object', () => {
    expect(loadAppConfig({
      NODE_ENV: 'production', API_PORT: '9100', DATABASE_PATH: '/data/app.db', LOG_DIR: '/logs',
      FRONTEND_URL: 'https://one.example, https://two.example',
      TELEGRAM_BOT_TOKEN: '123456:test-token', TELEGRAM_CHAT_ID: '-123456',
    })).toEqual({
      nodeEnv: 'production', port: 9100, databasePath: '/data/app.db', logDir: '/logs',
      allowedOrigins: ['https://one.example', 'https://two.example'],
      telegram: { token: '123456:test-token', chatId: '-123456' },
    });
  });
});
