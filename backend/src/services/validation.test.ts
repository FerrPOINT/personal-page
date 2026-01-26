import { describe, it, expect } from 'vitest';
import { validateContactForm, sanitizeString } from './validation.js';

describe('validation', () => {
  describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('alert("xss")');
      expect(sanitizeString('<p>Hello</p>')).toBe('Hello');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('should handle empty strings', () => {
      expect(sanitizeString('')).toBe('');
      expect(sanitizeString('   ')).toBe('');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeString(null as any)).toBe('');
      expect(sanitizeString(undefined as any)).toBe('');
    });
  });

  describe('validateContactForm', () => {
    it('should validate correct form data', () => {
      const result = validateContactForm({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello, this is a test message',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject empty name', () => {
      const result = validateContactForm({
        name: '',
        email: 'john@example.com',
        message: 'Hello',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Name is required');
    });

    it('should reject invalid email', () => {
      const result = validateContactForm({
        name: 'John',
        email: 'invalid-email',
        message: 'Hello',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Email format is invalid'))).toBe(true);
    });

    it('should reject empty message', () => {
      const result = validateContactForm({
        name: 'John',
        email: 'john@example.com',
        message: '',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Message is required');
    });

    it('should accept short messages (no minimum length requirement)', () => {
      const result = validateContactForm({
        name: 'John',
        email: 'john@example.com',
        message: 'Hi',
      });

      // Current implementation doesn't have minimum length, so this should be valid
      expect(result.valid).toBe(true);
    });

    it('should reject message that is too long', () => {
      const longMessage = 'a'.repeat(5001);
      const result = validateContactForm({
        name: 'John',
        email: 'john@example.com',
        message: longMessage,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('5000 characters or less'))).toBe(true);
    });

    it('should validate all fields at once', () => {
      const result = validateContactForm({
        name: '',
        email: 'invalid',
        message: '',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});

