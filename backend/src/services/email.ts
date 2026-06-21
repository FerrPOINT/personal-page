import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { MessageData } from './telegram.js';
import { emailLogger } from '../utils/logger.js';
import { EmailError, toAppError } from '../utils/errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../../.env') });

const GMAIL_USER = (process.env.GMAIL_USER || '').trim();
const GMAIL_APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD || '').trim();
const CONTACT_EMAIL_TO = (process.env.CONTACT_EMAIL_TO || '').trim();
const GMAIL_SMTP_HOST = (process.env.GMAIL_SMTP_HOST || 'smtp.gmail.com').trim();
const GMAIL_SMTP_PORT = parseInt(process.env.GMAIL_SMTP_PORT || '465', 10);

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!isEmailNotificationConfigured()) {
    throw new EmailError(
      'Gmail SMTP is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD (Google App Password).'
    );
  }
  if (!transporter) {
    const secure = GMAIL_SMTP_PORT === 465;
    transporter = nodemailer.createTransport({
      host: GMAIL_SMTP_HOST,
      port: GMAIL_SMTP_PORT,
      secure,
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    });
    emailLogger.info('Nodemailer transporter created', {
      host: GMAIL_SMTP_HOST,
      port: GMAIL_SMTP_PORT,
      secure,
    });
  }
  return transporter;
}

export function isEmailNotificationConfigured(): boolean {
  return GMAIL_USER.length > 0 && GMAIL_APP_PASSWORD.length > 0;
}

function formatPlainBody(data: MessageData): string {
  const dateObj = data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt);
  const date = dateObj.toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return [
    'Новое сообщение с формы контактов',
    '',
    `Имя: ${data.name}`,
    `Email: ${data.email}`,
    `Дата: ${date}`,
    '',
    'Сообщение:',
    data.message,
  ].join('\n');
}

/**
 * Send contact form submission via Gmail SMTP (app password).
 */
export async function sendContactFormEmail(messageData: MessageData): Promise<void> {
  const transport = getTransporter();
  const to = CONTACT_EMAIL_TO || GMAIL_USER;
  const subject = `[Контакты сайта] ${messageData.name}`;
  const text = formatPlainBody(messageData);

  try {
    await transport.sendMail({
      from: GMAIL_USER,
      to,
      replyTo: messageData.email,
      subject,
      text,
    });
    emailLogger.info('Contact form email sent', {
      to,
      replyTo: messageData.email,
      visitorEmail: messageData.email,
    });
  } catch (error: unknown) {
    const appError = toAppError(error);
    emailLogger.error('Error sending contact email', {
      error: appError.message,
      stack: appError.stack,
      visitorEmail: messageData.email,
    });
    throw new EmailError(appError.message);
  }
}
