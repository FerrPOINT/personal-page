import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOG_DIR = resolve(__dirname, '../../logs');

// Ensure log directory exists
if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

// Custom format for console (human-readable)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Custom format for files (JSON for structured logging)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports
const transports: winston.transport[] = [
  // Console transport (development)
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format: consoleFormat,
  }),
  
  // Daily rotate file for all logs
  new DailyRotateFile({
    filename: resolve(LOG_DIR, 'app-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: fileFormat,
    level: 'info',
  }),
  
  // Daily rotate file for errors only
  new DailyRotateFile({
    filename: resolve(LOG_DIR, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    format: fileFormat,
    level: 'error',
  }),
];

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  defaultMeta: { service: 'personal-page-backend' },
  transports,
  exceptionHandlers: [
    new DailyRotateFile({
      filename: resolve(LOG_DIR, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: resolve(LOG_DIR, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
});

// Create child loggers for different modules
export const telegramLogger = logger.child({ module: 'telegram' });
export const apiLogger = logger.child({ module: 'api' });
export const dbLogger = logger.child({ module: 'database' });
export const workerLogger = logger.child({ module: 'worker' });

// Default logger
export default logger;

// Convenience functions for backward compatibility
export function logInfo(message: string, meta?: any): void {
  logger.info(message, meta);
}

export function logError(message: string, meta?: any): void {
  logger.error(message, meta);
}

export function logWarn(message: string, meta?: any): void {
  logger.warn(message, meta);
}

export function logDebug(message: string, meta?: any): void {
  logger.debug(message, meta);
}
