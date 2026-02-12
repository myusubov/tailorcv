import { describe, it, expect } from 'vitest';
import {
  stageToLabel,
  clampProgressPct,
  reassuranceFromElapsedMs,
} from './generation-overlay';

describe('Generation Overlay Utilities', () => {
  describe('stageToLabel', () => {
    it('should return correct labels for known stages', () => {
      expect(stageToLabel('QUEUED')).toBe('Queued…');
      expect(stageToLabel('CALLING_AI')).toBe('Generating with AI…');
      expect(stageToLabel('RETRYING')).toBe('Refining output…');
      expect(stageToLabel('VALIDATING')).toBe('Validating resume data…');
      expect(stageToLabel('SAVING')).toBe('Saving your resume…');
      expect(stageToLabel('DONE')).toBe('Finalizing…');
    });

    it('should return null for unknown stages', () => {
      expect(stageToLabel('UNKNOWN')).toBeNull();
      expect(stageToLabel('')).toBeNull();
    });

    it('should return null for undefined', () => {
      expect(stageToLabel(undefined)).toBeNull();
    });
  });

  describe('clampProgressPct', () => {
    it('should clamp values between 0 and 100', () => {
      expect(clampProgressPct(50)).toBe(50);
      expect(clampProgressPct(0)).toBe(0);
      expect(clampProgressPct(100)).toBe(100);
    });

    it('should clamp values below 0 to 0', () => {
      expect(clampProgressPct(-10)).toBe(0);
      expect(clampProgressPct(-100)).toBe(0);
    });

    it('should clamp values above 100 to 100', () => {
      expect(clampProgressPct(150)).toBe(100);
      expect(clampProgressPct(200)).toBe(100);
    });

    it('should round to nearest integer', () => {
      expect(clampProgressPct(50.4)).toBe(50);
      expect(clampProgressPct(50.6)).toBe(51);
    });

    it('should return null for undefined', () => {
      expect(clampProgressPct(undefined)).toBeNull();
    });

    it('should return null for non-numbers', () => {
      expect(clampProgressPct('50' as any)).toBeNull();
      expect(clampProgressPct(NaN)).toBeNull();
      expect(clampProgressPct(Infinity)).toBeNull();
    });
  });

  describe('reassuranceFromElapsedMs', () => {
    it('should return null for short elapsed times', () => {
      expect(reassuranceFromElapsedMs(0)).toBeNull();
      expect(reassuranceFromElapsedMs(5000)).toBeNull();
      expect(reassuranceFromElapsedMs(9999)).toBeNull();
    });

    it('should return time message for 10-30 seconds', () => {
      expect(reassuranceFromElapsedMs(10000)).toContain('up to ~30 seconds');
      expect(reassuranceFromElapsedMs(20000)).toContain('up to ~30 seconds');
      expect(reassuranceFromElapsedMs(29999)).toContain('up to ~30 seconds');
    });

    it('should return shortening message for 30+ seconds', () => {
      expect(reassuranceFromElapsedMs(30000)).toContain('shortening details');
      expect(reassuranceFromElapsedMs(60000)).toContain('shortening details');
    });
  });
});
