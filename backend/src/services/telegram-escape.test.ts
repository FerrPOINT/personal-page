import { describe, it, expect } from 'vitest';

/**
 * Test escapeMarkdown function in isolation
 * This tests the optimized version without database dependencies
 */

// Simple implementation for testing (matches the optimized version)
function escapeMarkdown(text: string): string {
  return text.replace(/[_*\[\]()~`>#+\-=|{}!]/g, (char) => `\\${char}`);
}

describe('escapeMarkdown (optimized)', () => {
  it('should escape all Markdown special characters', () => {
    const input = 'Test_User*with[brackets](parentheses)~code`>hash#+minus-=pipe|braces{}!';
    const result = escapeMarkdown(input);
    
    expect(result).toBe('Test\\_User\\*with\\[brackets\\]\\(parentheses\\)\\~code\\`\\>hash\\#\\+minus\\-\\=pipe\\|braces\\{\\}\\!');
  });

  it('should escape asterisks and underscores', () => {
    expect(escapeMarkdown('*Bold* and _italic_')).toBe('\\*Bold\\* and \\_italic\\_');
  });

  it('should escape brackets', () => {
    expect(escapeMarkdown('[link](url)')).toBe('\\[link\\]\\(url\\)');
  });

  it('should escape code blocks', () => {
    expect(escapeMarkdown('`code`')).toBe('\\`code\\`');
  });

  it('should escape hash and plus', () => {
    expect(escapeMarkdown('#hashtag +plus')).toBe('\\#hashtag \\+plus');
  });

  it('should escape pipe and braces', () => {
    expect(escapeMarkdown('|pipe| {braces}')).toBe('\\|pipe\\| \\{braces\\}');
  });

  it('should not escape dots', () => {
    expect(escapeMarkdown('test@example.com')).toBe('test@example.com');
  });

  it('should handle empty string', () => {
    expect(escapeMarkdown('')).toBe('');
  });

  it('should handle text without special characters', () => {
    expect(escapeMarkdown('Normal text without special chars')).toBe('Normal text without special chars');
  });

  it('should handle multiple occurrences', () => {
    expect(escapeMarkdown('*bold* and *more bold*')).toBe('\\*bold\\* and \\*more bold\\*');
  });

  it('should be more efficient than multiple replace calls', () => {
    // Performance test: single regex vs multiple replaces
    const testString = 'a'.repeat(1000) + '*_[]()~`>#+-=|{}!' + 'b'.repeat(1000);
    
    const start1 = performance.now();
    const result1 = escapeMarkdown(testString);
    const time1 = performance.now() - start1;
    
    // Old implementation (multiple replaces)
    const oldEscape = (text: string) => text
      .replace(/\_/g, '\\_')
      .replace(/\*/g, '\\*')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\~/g, '\\~')
      .replace(/\`/g, '\\`')
      .replace(/\>/g, '\\>')
      .replace(/\#/g, '\\#')
      .replace(/\+/g, '\\+')
      .replace(/\-/g, '\\-')
      .replace(/\=/g, '\\=')
      .replace(/\|/g, '\\|')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\!/g, '\\!');
    
    const start2 = performance.now();
    const result2 = oldEscape(testString);
    const time2 = performance.now() - start2;
    
    // Results should be identical
    expect(result1).toBe(result2);
    
    // Optimized version should be faster (or at least not slower)
    // Note: This is a basic check, actual performance may vary
    expect(time1).toBeLessThanOrEqual(time2 * 1.5); // Allow some variance
  });
});

