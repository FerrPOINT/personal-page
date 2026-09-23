import { describe, expect, it } from 'vitest';
import { normalizeContactForm, normalizeMessage, normalizeSingleLine, validateContactForm } from './validation.js';

describe('contact validation', () => {
  it('accepts valid values', () => {
    expect(validateContactForm({ name: 'John', email: 'john@example.com', message: 'Hello' }))
      .toEqual({ valid: true, errors: {} });
  });

  it('returns field-specific errors', () => {
    expect(validateContactForm({ name: '', email: 'invalid', message: '' })).toEqual({
      valid: false,
      errors: { name: 'Укажите имя', email: 'Некорректный email', message: 'Введите сообщение' },
    });
  });

  it('enforces the 5000-character message limit', () => {
    expect(validateContactForm({ name: 'A', email: 'a@example.com', message: 'x'.repeat(5000) }).valid).toBe(true);
    expect(validateContactForm({ name: 'A', email: 'a@example.com', message: 'x'.repeat(5001) }).errors.message)
      .toContain('5000');
  });

  it('normalizes single-line values without interpreting HTML-like text', () => {
    expect(normalizeSingleLine('  User<T>\u0000  ')).toBe('User<T>');
    expect(normalizeSingleLine('User\nName')).toBe('UserName');
  });

  it('preserves message lines, tabs, unicode and HTML-like text', () => {
    expect(normalizeMessage('  first\r\n\t<T> Привет\u0000\rthird  ')).toBe('first\n\t<T> Привет\nthird');
  });

  it('normalizes all fields through one form boundary', () => {
    expect(normalizeContactForm({
      name: '  Alice  ',
      email: '  alice@example.com ',
      message: ' line 1\r\nline 2 ',
    })).toEqual({
      name: 'Alice',
      email: 'alice@example.com',
      message: 'line 1\nline 2',
    });
  });
});
