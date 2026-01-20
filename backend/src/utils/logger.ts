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

// Redact sensitive data from logs (best practice 2026)
const redactSensitiveData = winston.format((info) => {
  if (info && typeof info === 'object') {
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization', 'cookie', 'session'];
    const redactValue = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(redactValue);
      }
      if (obj && typeof obj === 'object') {
        const redacted: any = {};
        for (const [key, value] of Object.entries(obj)) {
          const lowerKey = key.toLowerCase();
          if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
            redacted[key] = '[REDACTED]';
          } else if (typeof value === 'object' && value !== null) {
            redacted[key] = redactValue(value);
          } else {
            redacted[key] = value;
          }
        }
        return redacted;
      }
      return obj;
    };
    
    // Redact in meta fields
    if (info.meta) {
      info.meta = redactValue(info.meta);
    }
    
    // Redact in message if it contains sensitive data
    if (typeof info.message === 'string') {
      let message: string = info.message as string;
      sensitiveKeys.forEach(key => {
        const regex = new RegExp(`(${key}[=:]\\s*)([^\\s,}]+)`, 'gi');
        message = message.replace(regex, `$1[REDACTED]`);
      });
      info.message = message;
    }
    
    // Redact all top-level sensitive fields
    const redacted = redactValue(info);
    return redacted;
  }
  return info;
});

// Custom format for console (human-readable, development)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  redactSensitiveData(),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, requestId, module, ...meta }) => {
    const context = [];
    if (requestId) context.push(`[req:${requestId}]`);
    if (module) context.push(`[${module}]`);
    const contextStr = context.length ? context.join(' ') + ' ' : '';
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} ${contextStr}[${level}]: ${message} ${metaStr}`;
  })
);

// Custom format for files (JSON for structured logging, production-ready)
const fileFormat = winston.format.combine(
  winston.format.timestamp(), // UTC by default in winston
  redactSensitiveData(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports
const transports: winston.transport[] = [
  // Console transport (always enabled for Docker logs)
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    format: consoleFormat,
    handleExceptions: true,
    handleRejections: true,
  }),
  
  // Daily rotate file for all logs
  new DailyRotateFile({
    filename: resolve(LOG_DIR, 'app-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: fileFormat,
    level: 'info',
    handleExceptions: false, // Handled by exceptionHandlers
    handleRejections: false, // Handled by rejectionHandlers
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
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: fileFormat,
  defaultMeta: { 
    service: 'personal-page-backend',
    environment: process.env.NODE_ENV || 'development',
  },
  transports,
  exceptionHandlers: [
    new winston.transports.Console({ format: consoleFormat }),
    new DailyRotateFile({
      filename: resolve(LOG_DIR, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: fileFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({ format: consoleFormat }),
    new DailyRotateFile({
      filename: resolve(LOG_DIR, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: fileFormat,
    }),
  ],
  // Exit on error only in development (best practice 2026)
  exitOnError: process.env.NODE_ENV !== 'production',
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
