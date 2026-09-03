import { evaluateCondition } from './declarative-area-rule-engine';
import { describe, it, expect } from 'vitest';

describe('evaluateCondition', () => {
  it('returns true for an empty condition node', () => {
    const input = {
      signals: new Set<string>(),
      conditions: {},
    };

    const result = evaluateCondition(input);

    expect(result).toBe(true);
  });

  it('returns true when a required `has` signal is present', () => {
    const input = {
      signals: new Set(['tailwind']),
      conditions: {
        has: 'tailwind',
      },
    };

    const result = evaluateCondition(input);

    expect(result).toBe(true);
  });

  it('returns false when a required `has` signal is absent', () => {
    const input = {
      signals: new Set(['tailwind']),
      conditions: {
        has: 'postcss',
      },
    };

    const result = evaluateCondition(input);

    expect(result).toBe(false);
  });

  it('returns true when `hasOneOf` has at least one matching signal', () => {
    const input = {
      signals: new Set(['pages-dir']),
      conditions: {
        hasOneOf: ['app-dir', 'pages-dir'],
      },
    };

    const result = evaluateCondition(input);

    expect(result).toBe(true);
  });

  it('returns false when `hasOneOf` has no matching signal', () => {
    const input = {
      signals: new Set(['src-dir']),
      conditions: {
        hasOneOf: ['app-dir', 'pages-dir'],
      },
    };

    const result = evaluateCondition(input);

    expect(result).toBe(false);
  });

  it('returns true when `hasAllOf` has every listed signal present', () => {
    const input = {
      signals: new Set(['next-config', 'app-dir']),
      conditions: {
        hasAllOf: ['next-config', 'app-dir'],
      },
    };

    const result = evaluateCondition(input);

    expect(result).toBe(true);
  });

  it('returns false when `hasAllOf` is missing one listed signal', () => {
    const input = {
      signals: new Set(['next-config']),
      conditions: {
        hasAllOf: ['next-config', 'app-dir'],
      },
    };

    const result = evaluateCondition(input);

    expect(result).toBe(false);
  });

  it('ANDs multiple keys on the same node — fails when only one key is satisfied', () => {
    const input = {
      signals: new Set(['next-config']),
      conditions: {
        has: 'next-config',
        hasOneOf: ['app-dir', 'pages-dir'],
      },
    };

    const result = evaluateCondition(input);

    expect(result).toBe(false);
  });

  it('returns true for `and` when every nested condition holds', () => {
    const input = {
      signals: new Set(['a', 'b']),
      conditions: {
        and: [{ has: 'a' }, { has: 'b' }],
      },
    };

    const result = evaluateCondition(input);

    expect(result).toBe(true);
  });

  it('returns false for `and` when one nested condition fails', () => {
    const input = {
      signals: new Set(['a']),
      conditions: {
        and: [{ has: 'a' }, { has: 'b' }],
      },
    };

    const result = evaluateCondition(input);

    expect(result).toBe(false);
  });

  it('returns true for `or` when at least one nested condition holds', () => {
    const input = {
      signals: new Set(['b']),
      conditions: {
        or: [{ has: 'a' }, { has: 'b' }],
      },
    };

    const result = evaluateCondition(input);

    expect(result).toBe(true);
  });

  it('returns false for `or` when every nested condition fails', () => {
    const input = {
      signals: new Set(['c']),
      conditions: {
        or: [{ has: 'a' }, { has: 'b' }],
      },
    };

    const result = evaluateCondition(input);

    expect(result).toBe(false);
  });

  it('evaluates two independent `hasOneOf` groups ANDed under `and` — true only when both groups match', () => {
    const input = {
      signals: new Set(['app-dir', 'tailwind']),
      conditions: {
        and: [
          { hasOneOf: ['app-dir', 'pages-dir'] },
          { hasOneOf: ['tailwind', 'postcss'] },
        ],
      },
    };

    const result = evaluateCondition(input);

    expect(result).toBe(true);
  });

  it('fails the two-group `and` shape when only one group matches', () => {
    const input = {
      signals: new Set(['app-dir']),
      conditions: {
        and: [
          { hasOneOf: ['app-dir', 'pages-dir'] },
          { hasOneOf: ['tailwind', 'postcss'] },
        ],
      },
    };

    const result = evaluateCondition(input);

    expect(result).toBe(false);
  });

  it('treats an empty `hasOneOf` array as false', () => {
    const input = {
      signals: new Set(['anything']),
      conditions: {
        hasOneOf: [] as string[],
      },
    };

    const result = evaluateCondition(input);

    expect(result).toBe(false);
  });

  it('treats an empty `hasAllOf` array as true', () => {
    const input = {
      signals: new Set<string>(),
      conditions: {
        hasAllOf: [] as string[],
      },
    };

    const result = evaluateCondition(input);

    expect(result).toBe(true);
  });
});
