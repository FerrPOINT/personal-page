import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const sensitiveKeys = ['password', 'token', 'secret', 'apikey', 'authorization', 'cookie', 'session'];

function redactObject(value: Record<string, unknown>): void {
  for (const [key, entry] of Object.entries(value)) {
    if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
      value[key] = '[REDACTED]';
    } else if (entry && typeof entry === 'object') {
      if (Array.isArray(entry)) entry.forEach((item) => {
        if (item && typeof item === 'object') redactObject(item as Record<string, unknown>);
      });
      else redactObject(entry as Record<string, unknown>);
    }
  }
}

const redactSensitiveData = winston.format((info) => {
  redactObject(info);
  return info;
});
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  redactSensitiveData(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  redactSensitiveData(),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, requestId, module, ...meta }) => {
    const context = [requestId && `[req:${requestId}]`, module && `[${module}]`].filter(Boolean).join(' ');
    const metadata = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${context} [${level}]: ${message}${metadata}`;
  }),
);

const logger = winston.createLogger({
  level: 'info',
  defaultMeta: { service: 'personal-page-backend' },
  transports: [new winston.transports.Console({ format: consoleFormat })],
  exitOnError: false,
});

let fileLoggingConfigured = false;

export function configureLogger(logDir: string, nodeEnv: string, level?: string): void {
  logger.level = level || (nodeEnv === 'production' ? 'info' : 'debug');
  logger.defaultMeta = { service: 'personal-page-backend', environment: nodeEnv };
  if (nodeEnv === 'test') return;
  if (fileLoggingConfigured) return;
  mkdirSync(logDir, { recursive: true });
  logger.add(new DailyRotateFile({
    filename: resolve(logDir, 'app-%DATE%.log'), datePattern: 'YYYY-MM-DD', maxSize: '20m', maxFiles: '14d',
    format: fileFormat, level: 'info',
  }));
  logger.add(new DailyRotateFile({
    filename: resolve(logDir, 'error-%DATE%.log'), datePattern: 'YYYY-MM-DD', maxSize: '20m', maxFiles: '30d',
    format: fileFormat, level: 'error',
  }));
  fileLoggingConfigured = true;
}

export const telegramLogger = logger.child({ module: 'telegram' });
export const apiLogger = logger.child({ module: 'api' });
export const dbLogger = logger.child({ module: 'database' });
export const workerLogger = logger.child({ module: 'worker' });
export default logger;
