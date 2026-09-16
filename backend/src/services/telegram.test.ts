import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assertTelegramConfig, escapeTelegramHtml, formatTelegramMessage, sendTelegramMessage } from './telegram.js';

const data = {
  name: '<Admin & Co>', email: 'me@example.com', message: '<script> & text',
  createdAt: new Date('2026-09-16T10:00:00.000Z'),
};

describe('Telegram API client', () => {
  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = '123456:test-token';
    process.env.TELEGRAM_CHAT_ID = '123456';
    vi.restoreAllMocks();
  });

  it('escapes all HTML entities used by Telegram parse mode', () => {
    expect(escapeTelegramHtml('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
    expect(formatTelegramMessage(data)).toContain('&lt;script&gt; &amp; text');
  });

  it('posts through native fetch with HTML parse mode', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    await sendTelegramMessage(data);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('https://api.telegram.org/bot123456:test-token/sendMessage');
    expect(JSON.parse(String(options?.body))).toMatchObject({ chat_id: '123456', parse_mode: 'HTML' });
  });

  it('fails clearly when required configuration is missing', () => {
    delete process.env.TELEGRAM_CHAT_ID;
    expect(() => assertTelegramConfig()).toThrow(/TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID/);
  });

  it('maps provider rejection to a safe error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
      JSON.stringify({ description: 'Bad Request' }), { status: 400, headers: { 'content-type': 'application/json' } },
    ));
    await expect(sendTelegramMessage(data)).rejects.toMatchObject({ code: 'TELEGRAM_ERROR' });
  });
});
