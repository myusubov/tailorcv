import { describe, it, expect } from 'vitest';
import { makeKey } from './define-client-get';

describe('Define Client Get Utilities', () => {
  describe('makeKey', () => {
    it('should create key with prefix only', () => {
      const key = makeKey('users');
      expect(key).toEqual(['users']);
    });

    it('should include non-empty parts', () => {
      const key = makeKey('users', 'list', 123);
      expect(key).toEqual(['users', 'list', 123]);
    });

    it('should filter out null values', () => {
      const key = makeKey('users', null, 'active');
      expect(key).toEqual(['users', 'active']);
    });

    it('should filter out undefined values', () => {
      const key = makeKey('users', undefined, 'active');
      expect(key).toEqual(['users', 'active']);
    });

    it('should filter out empty string values', () => {
      const key = makeKey('users', '', 'active');
      expect(key).toEqual(['users', 'active']);
    });

    it('should handle mixed valid and invalid parts', () => {
      const key = makeKey('api', 'v1', null, 'resumes', '', undefined, 42);
      expect(key).toEqual(['api', 'v1', 'resumes', 42]);
    });

    it('should preserve zero as a valid part', () => {
      const key = makeKey('users', 0, 'page');
      expect(key).toEqual(['users', 0, 'page']);
    });
  });
});
