import { describe, expect, it } from 'vitest';
import { CAREER_START_DATE, formatYearsOfExperience, getResumeHighlights, getYearsOfExperience } from './profile';

describe('profile content', () => {
  it('calculates experience from the canonical career start date', () => {
    expect(CAREER_START_DATE).toBe('2015-08-01');
    expect(getYearsOfExperience(new Date('2026-07-31T12:00:00Z'))).toBe(10);
    expect(getYearsOfExperience(new Date('2026-08-01T00:00:00Z'))).toBe(11);
  });

  it('formats localized experience labels', () => {
    const now = new Date('2026-09-18T00:00:00Z');
    expect(formatYearsOfExperience('ru', now)).toBe('11+ лет');
    expect(formatYearsOfExperience('en', now)).toBe('11+ years');
  });

  it('provides the current public Java Agent project in both languages', () => {
    expect(getResumeHighlights('ru')[0]).toMatchObject({
      title: 'Java Agent',
      href: 'https://github.com/FerrPOINT/java-agent',
    });
    expect(getResumeHighlights('en')[0].summary).toContain('OpenAI-compatible');
  });
});
