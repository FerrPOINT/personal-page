import type { MessageData } from './telegram.js';
import { sendTelegramMessage } from './telegram.js';
import { sendContactFormEmail, isEmailNotificationConfigured } from './email.js';
import { AppError, toAppError } from '../utils/errors.js';
import { notifyLogger } from '../utils/logger.js';

export type NotificationChannel = 'telegram' | 'email';

/**
 * Parse CONTACT_NOTIFICATION_CHANNELS (comma-separated).
 * Use `both` as shorthand for telegram and email.
 * Invalid / empty values fall back to email.
 */
export function parseNotificationChannels(): NotificationChannel[] {
  const raw = (process.env.CONTACT_NOTIFICATION_CHANNELS || 'email').trim().toLowerCase();
  if (!raw) {
    return ['email'];
  }
  const tokens = raw
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);

  const expanded: NotificationChannel[] = [];
  for (const token of tokens) {
    if (token === 'both') {
      expanded.push('telegram', 'email');
    } else if (token === 'telegram' || token === 'email') {
      expanded.push(token);
    }
  }
  const dedup = [...new Set(expanded)];
  return dedup.length > 0 ? dedup : ['email'];
}

/**
 * Deliver contact form notification via configured channel(s).
 * Succeeds if at least one channel succeeds; logs per-channel failures.
 */
export async function deliverContactNotifications(messageData: MessageData): Promise<void> {
  const channels = parseNotificationChannels();
  const failures: string[] = [];
  let anySuccess = false;

  for (const channel of channels) {
    if (channel === 'telegram') {
      try {
        await sendTelegramMessage(messageData);
        anySuccess = true;
      } catch (error: unknown) {
        const msg = toAppError(error).message;
        failures.push(`telegram: ${msg}`);
        notifyLogger.warn('Telegram notification failed', { error: msg });
      }
      continue;
    }

    if (!isEmailNotificationConfigured()) {
      const msg =
        'Gmail SMTP is not configured (set GMAIL_USER and GMAIL_APP_PASSWORD; optional CONTACT_EMAIL_TO)';
      failures.push(`email: ${msg}`);
      notifyLogger.warn('Email notification skipped', { reason: msg });
      continue;
    }

    try {
      await sendContactFormEmail(messageData);
      anySuccess = true;
    } catch (error: unknown) {
      const msg = toAppError(error).message;
      failures.push(`email: ${msg}`);
      notifyLogger.warn('Email notification failed', { error: msg });
    }
  }

  if (!anySuccess) {
    const detail = failures.length ? failures.join(' | ') : 'No notification channels succeeded';
    throw new AppError(detail, 'NOTIFY_FAILED', 500);
  }
}
