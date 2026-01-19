import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOG_DIR = resolve(__dirname, '../../logs');
const LOG_FILE = resolve(LOG_DIR, 'telegram.log');
const ERROR_LOG_FILE = resolve(LOG_DIR, 'telegram-error.log');

// Ensure log directory exists
if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

function writeLog(file: string, message: string): void {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  try {
    appendFileSync(file, logLine, 'utf8');
  } catch (error) {
    console.error('Failed to write log:', error);
  }
}

export function logInfo(message: string): void {
  console.log(message);
  writeLog(LOG_FILE, message);
}

export function logError(message: string): void {
  console.error(message);
  writeLog(LOG_FILE, message);
  writeLog(ERROR_LOG_FILE, message);
}

export function logWarn(message: string): void {
  console.warn(message);
  writeLog(LOG_FILE, message);
}

