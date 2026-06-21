import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Telegram from './telegram.js';
import * as Email from './email.js';
import { deliverContactNotifications, parseNotificationChannels } from './contactDelivery.js';

vi.mock('./telegram.js', () => ({
  sendTelegramMessage: vi.fn(),
}));

vi.mock('./email.js', () => ({
  sendContactFormEmail: vi.fn(),
  isEmailNotificationConfigured: vi.fn(),
}));

const payload = {
  name: 'Test',
  email: 'visitor@example.com',
  message: 'Hello',
  createdAt: new Date('2026-01-19T10:00:00Z'),
};

describe('parseNotificationChannels', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to email', () => {
    vi.stubEnv('CONTACT_NOTIFICATION_CHANNELS', '');
    expect(parseNotificationChannels()).toEqual(['email']);
  });

  it('parses email', () => {
    vi.stubEnv('CONTACT_NOTIFICATION_CHANNELS', 'email');
    expect(parseNotificationChannels()).toEqual(['email']);
  });

  it('expands both', () => {
    vi.stubEnv('CONTACT_NOTIFICATION_CHANNELS', 'both');
    expect(parseNotificationChannels()).toEqual(['telegram', 'email']);
  });

  it('dedupes and ignores unknown tokens', () => {
    vi.stubEnv('CONTACT_NOTIFICATION_CHANNELS', 'email, telegram , email, foo');
    expect(parseNotificationChannels()).toEqual(['email', 'telegram']);
  });
});

describe('deliverContactNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('succeeds when telegram succeeds', async () => {
    vi.stubEnv('CONTACT_NOTIFICATION_CHANNELS', 'telegram');
    vi.mocked(Telegram.sendTelegramMessage).mockResolvedValue(true);

    await expect(deliverContactNotifications(payload)).resolves.toBeUndefined();
    expect(Telegram.sendTelegramMessage).toHaveBeenCalledWith(payload);
    expect(Email.sendContactFormEmail).not.toHaveBeenCalled();
  });

  it('succeeds when email succeeds and telegram fails in both mode', async () => {
    vi.stubEnv('CONTACT_NOTIFICATION_CHANNELS', 'both');
    vi.mocked(Telegram.sendTelegramMessage).mockRejectedValue(new Error('blocked'));
    vi.mocked(Email.isEmailNotificationConfigured).mockReturnValue(true);
    vi.mocked(Email.sendContactFormEmail).mockResolvedValue(undefined);

    await expect(deliverContactNotifications(payload)).resolves.toBeUndefined();
    expect(Email.sendContactFormEmail).toHaveBeenCalledWith(payload);
  });

  it('throws when all channels fail', async () => {
    vi.stubEnv('CONTACT_NOTIFICATION_CHANNELS', 'both');
    vi.mocked(Telegram.sendTelegramMessage).mockRejectedValue(new Error('tg down'));
    vi.mocked(Email.isEmailNotificationConfigured).mockReturnValue(true);
    vi.mocked(Email.sendContactFormEmail).mockRejectedValue(new Error('smtp down'));

    await expect(deliverContactNotifications(payload)).rejects.toThrow(/tg down/);
  });

  it('throws when only email is selected but not configured', async () => {
    vi.stubEnv('CONTACT_NOTIFICATION_CHANNELS', 'email');
    vi.mocked(Email.isEmailNotificationConfigured).mockReturnValue(false);

    await expect(deliverContactNotifications(payload)).rejects.toThrow(/Gmail SMTP is not configured/);
  });
});
