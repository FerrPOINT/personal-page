import { describe, expect, it } from 'vitest';
import { sanitizeString, validateContactForm } from './validation.js';

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

  it('sanitizes tags, control characters and surrounding whitespace', () => {
    expect(sanitizeString('  <b>Hello</b>\u0000  ')).toBe('Hello');
  });
});
