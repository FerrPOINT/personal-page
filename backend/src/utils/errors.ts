/**
 * Typed error classes for better error handling
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Duplicate error (e.g., duplicate message)
 */
export class DuplicateError extends AppError {
  constructor(message: string) {
    super(message, 'DUPLICATE_MESSAGE', 409);
  }
}

/**
 * Database error
 */
export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, 'DATABASE_ERROR', 500);
    if (originalError) {
      this.cause = originalError;
    }
  }
}

/**
 * Telegram API error
 */
export class TelegramError extends AppError {
  constructor(message: string) {
    super(message, 'TELEGRAM_ERROR', 500);
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
  }
}

/**
 * Type guard to check if error is AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if error is standard Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Convert unknown error to AppError
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (isError(error)) {
    return new AppError(error.message, 'INTERNAL_ERROR', 500);
  }

  return new AppError(String(error), 'INTERNAL_ERROR', 500);
}
