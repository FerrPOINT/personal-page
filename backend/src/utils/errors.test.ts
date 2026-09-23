import { describe, expect, it } from 'vitest';
import {
  AppError, DatabaseError, DuplicateError, isAppError, NotFoundError, TelegramError, toAppError,
} from './errors.js';

describe('application errors', () => {
  it.each([
    [new DuplicateError('duplicate'), 'DUPLICATE_MESSAGE', 409],
    [new DatabaseError('database'), 'DATABASE_ERROR', 500],
    [new TelegramError('telegram'), 'TELEGRAM_ERROR', 500],
    [new NotFoundError(), 'NOT_FOUND', 404],
  ])('preserves typed error metadata', (error, code, statusCode) => {
    expect(error).toMatchObject({ code, statusCode });
    expect(isAppError(error)).toBe(true);
  });

  it('preserves causes on database failures', () => {
    const cause = new Error('sqlite');
    expect(new DatabaseError('failed', cause).cause).toBe(cause);
  });

  it('normalizes unknown failures', () => {
    expect(toAppError(new Error('failure'))).toMatchObject({ message: 'failure', code: 'INTERNAL_ERROR' });
    expect(toAppError('failure')).toBeInstanceOf(AppError);
  });
});
