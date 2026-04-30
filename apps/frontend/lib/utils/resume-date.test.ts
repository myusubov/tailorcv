import { parseDate } from '@internationalized/date';
import { describe, expect, it } from 'vitest';

import {
  parseResumeDateValue,
  serializeResumeDateValue,
} from './resume-date';

describe('resume date helpers', () => {
  it('parses legacy year and month values while preserving full dates', () => {
    expect(parseResumeDateValue({ value: '2026' })?.toString()).toBe(
      '2026-01-01',
    );
    expect(parseResumeDateValue({ value: '2026-04' })?.toString()).toBe(
      '2026-04-01',
    );
    expect(parseResumeDateValue({ value: '2026-04-20' })?.toString()).toBe(
      '2026-04-20',
    );
  });

  it('serializes selected dates without dropping the day', () => {
    expect(
      serializeResumeDateValue({ value: parseDate('2026-04-20') }),
    ).toBe('2026-04-20');
    expect(serializeResumeDateValue({ value: null })).toBe('');
  });
});
