import { afterEach, describe, expect, it } from 'vitest';
import { applyLocalizedDocumentMetadata } from './LanguageContext';

const originalHead = document.head.innerHTML;

afterEach(() => {
  document.head.innerHTML = originalHead;
});

describe('localized document metadata', () => {
  it('updates language, title, descriptions, and structured data together', () => {
    document.head.innerHTML = `
      <meta name="description" content="">
      <meta property="og:title" content="">
      <meta property="og:description" content="">
      <meta property="og:locale" content="">
      <script id="person-structured-data" type="application/ld+json"></script>
    `;

    applyLocalizedDocumentMetadata('ru');
    expect(document.documentElement.lang).toBe('ru');
    expect(document.title).toBe('Александр Жуков | Старший архитектор ПО');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toContain('Архитектор ПО');
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(document.title);
    expect(document.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe('ru_RU');
    expect(JSON.parse(document.getElementById('person-structured-data')?.textContent ?? '{}')).toMatchObject({
      name: 'Александр Жуков',
      jobTitle: 'Старший архитектор ПО',
    });

    applyLocalizedDocumentMetadata('en');
    expect(document.documentElement.lang).toBe('en');
    expect(document.title).toBe('Aleksandr Zhukov | Senior Software Architect');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toContain('Software Architect');
    expect(document.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe('en_US');
  });
});
