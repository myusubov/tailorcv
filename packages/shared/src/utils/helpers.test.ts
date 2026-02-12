import { describe, it, expect } from 'vitest';
import { formatDate, truncateText, capitalize } from './helpers';

describe('Shared Utilities (Golden Path)', () => {
  describe('formatDate', () => {
    it('should format a valid Date object correctly', () => {
      const date = new Date('2023-12-25');
      // Note: Implementation uses locale string, result depends on system locale but usually reliable in CI
      // We check for expected parts to be robust
      const result = formatDate(date);
      expect(result).toContain('December');
      expect(result).toContain('25');
      expect(result).toContain('2023');
    });

    it('should format a date string correctly', () => {
      const result = formatDate('2024-01-01');
      expect(result).toContain('January');
      expect(result).toContain('1');
      expect(result).toContain('2024');
    });
  });

  describe('truncateText', () => {
    it('should return original text if shorter than max length', () => {
      const text = 'Hello';
      expect(truncateText(text, 10)).toBe('Hello');
    });

    it('should truncate and add ellipsis if longer than max length', () => {
      const text = 'Hello World';
      // "Hello..." is 8 chars. 5 from text + 3 dots.
      // The implementation is: substring(0, max - 3) + ...
      // truncateText('Hello World', 8) -> substring(0, 5) which is 'Hello' -> 'Hello...'
      expect(truncateText(text, 8)).toBe('Hello...');
    });
  });

  describe('capitalize', () => {
    it('should capitalize the first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('should handle already capitalized text', () => {
      expect(capitalize('World')).toBe('World');
    });

    it('should handle empty strings', () => {
      // Logic is charAt(0) + slice(1). For empty string: '' + '' = ''
      expect(capitalize('')).toBe('');
    });
  });
});
