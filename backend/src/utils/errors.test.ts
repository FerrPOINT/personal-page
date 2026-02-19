import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  DuplicateError,
  DatabaseError,
  TelegramError,
  NotFoundError,
  isAppError,
  isError,
  toAppError,
} from './errors.js';

describe('Error classes', () => {
  describe('AppError', () => {
    it('should create AppError with default values', () => {
      const error = new AppError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('AppError');
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should create AppError with custom values', () => {
      const error = new AppError('Custom error', 'CUSTOM_CODE', 400, false);
      
      expect(error.message).toBe('Custom error');
      expect(error.code).toBe('CUSTOM_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(false);
    });

    it('should have stack trace', () => {
      const error = new AppError('Test error');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with default details', () => {
      const error = new ValidationError('Validation failed');
      
      expect(error.message).toBe('Validation failed');
      expect(error.name).toBe('ValidationError');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual([]);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should create ValidationError with details', () => {
      const details = ['Email is required', 'Name is too short'];
      const error = new ValidationError('Validation failed', details);
      
      expect(error.details).toEqual(details);
      expect(error.statusCode).toBe(400);
    });
  });

  describe('DuplicateError', () => {
    it('should create DuplicateError', () => {
      const error = new DuplicateError('Duplicate message');
      
      expect(error.message).toBe('Duplicate message');
      expect(error.name).toBe('DuplicateError');
      expect(error.code).toBe('DUPLICATE_ERROR');
      expect(error.statusCode).toBe(429);
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe('DatabaseError', () => {
    it('should create DatabaseError without original error', () => {
      const error = new DatabaseError('Database connection failed');
      
      expect(error.message).toBe('Database connection failed');
      expect(error.name).toBe('DatabaseError');
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should create DatabaseError with original error', () => {
      const originalError = new Error('SQL syntax error');
      const error = new DatabaseError('Database operation failed', originalError);
      
      expect(error.message).toBe('Database operation failed');
      expect(error.cause).toBe(originalError);
    });
  });

  describe('TelegramError', () => {
    it('should create TelegramError without response', () => {
      const error = new TelegramError('Telegram API error');
      
      expect(error.message).toBe('Telegram API error');
      expect(error.name).toBe('TelegramError');
      expect(error.code).toBe('TELEGRAM_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.telegramResponse).toBeUndefined();
      expect(error).toBeInstanceOf(AppError);
    });

    it('should create TelegramError with response', () => {
      const response = { statusCode: 429, body: { error: 'Too many requests' } };
      const error = new TelegramError('Rate limit exceeded', response);
      
      expect(error.telegramResponse).toBe(response);
    });
  });

  describe('NotFoundError', () => {
    it('should create NotFoundError with default message', () => {
      const error = new NotFoundError();
      
      expect(error.message).toBe('Resource not found');
      expect(error.name).toBe('NotFoundError');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should create NotFoundError with custom message', () => {
      const error = new NotFoundError('User not found');
      
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });
  });
});

describe('Type guards', () => {
  describe('isAppError', () => {
    it('should return true for AppError instances', () => {
      const error = new AppError('Test');
      expect(isAppError(error)).toBe(true);
    });

    it('should return true for ValidationError', () => {
      const error = new ValidationError('Test');
      expect(isAppError(error)).toBe(true);
    });

    it('should return true for DatabaseError', () => {
      const error = new DatabaseError('Test');
      expect(isAppError(error)).toBe(true);
    });

    it('should return false for standard Error', () => {
      const error = new Error('Test');
      expect(isAppError(error)).toBe(false);
    });

    it('should return false for non-Error objects', () => {
      expect(isAppError('string')).toBe(false);
      expect(isAppError(123)).toBe(false);
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
    });
  });

  describe('isError', () => {
    it('should return true for standard Error', () => {
      const error = new Error('Test');
      expect(isError(error)).toBe(true);
    });

    it('should return true for AppError', () => {
      const error = new AppError('Test');
      expect(isError(error)).toBe(true);
    });

    it('should return false for non-Error objects', () => {
      expect(isError('string')).toBe(false);
      expect(isError(123)).toBe(false);
      expect(isError(null)).toBe(false);
      expect(isError(undefined)).toBe(false);
    });
  });
});

describe('toAppError', () => {
  it('should return AppError as-is', () => {
    const appError = new AppError('Test', 'TEST_CODE', 400);
    const result = toAppError(appError);
    
    expect(result).toBe(appError);
    expect(result.code).toBe('TEST_CODE');
  });

  it('should convert standard Error to AppError', () => {
    const error = new Error('Standard error');
    const result = toAppError(error);
    
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('Standard error');
    expect(result.code).toBe('INTERNAL_ERROR');
    expect(result.statusCode).toBe(500);
  });

  it('should convert string to AppError', () => {
    const result = toAppError('String error');
    
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('String error');
    expect(result.code).toBe('INTERNAL_ERROR');
  });

  it('should convert number to AppError', () => {
    const result = toAppError(123);
    
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('123');
  });

  it('should convert null to AppError', () => {
    const result = toAppError(null);
    
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('null');
  });

  it('should convert undefined to AppError', () => {
    const result = toAppError(undefined);
    
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('undefined');
  });

  it('should convert object to AppError', () => {
    const obj = { key: 'value' };
    const result = toAppError(obj);
    
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('[object Object]');
  });

  it('should preserve ValidationError type', () => {
    const validationError = new ValidationError('Invalid input', ['error1', 'error2']);
    const result = toAppError(validationError);
    
    expect(result).toBe(validationError);
    expect(result).toBeInstanceOf(ValidationError);
    expect((result as ValidationError).details).toEqual(['error1', 'error2']);
  });
});

