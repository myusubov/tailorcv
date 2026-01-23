import { describe, it, expect } from 'vitest';
import { deepMerge } from './deepMerge';

describe('deepMerge', () => {
  it('should merge plain objects recursively', () => {
    const target = { a: 1, b: { c: 2 } };
    const patch = { b: { d: 3 } };
    const result = deepMerge(target, patch);
    expect(result).toEqual({ a: 1, b: { c: 2, d: 3 } });
  });

  it('should replace arrays (not merge)', () => {
    const target = { a: [1, 2] };
    const patch = { a: [3, 4] };
    const result = deepMerge(target, patch);
    expect(result).toEqual({ a: [3, 4] });
  });

  it('should delete keys when value is null', () => {
    const target = { a: 1, b: 2 };
    const patch = { b: null };
    const result = deepMerge(target, patch);
    expect(result).toEqual({ a: 1 });
  });

  it('should replace primitives', () => {
    const target = { a: 1 };
    const patch = { a: 5 };
    const result = deepMerge(target, patch);
    expect(result).toEqual({ a: 5 });
  });

  it('should handle nested complex merges', () => {
    const target = {
      user: {
        name: 'John',
        settings: { theme: 'dark', notifications: true }
      }
    };
    const patch = {
      user: {
        settings: { theme: 'light' }
      }
    };
    const result = deepMerge(target, patch);
    expect(result.user.name).toBe('John');
    expect(result.user.settings.theme).toBe('light');
    expect(result.user.settings.notifications).toBe(true);
  });
});
