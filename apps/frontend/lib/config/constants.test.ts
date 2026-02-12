import { describe, it, expect } from 'vitest';
import { ASSETS, LOGOS, ICONS, PLACEHOLDERS } from './constants';

describe('Application Constants', () => {
  describe('ASSETS', () => {
    it('should have LOGOS object', () => {
      expect(ASSETS).toHaveProperty('LOGOS');
      expect(typeof ASSETS.LOGOS).toBe('object');
    });

    it('should have ICONS object', () => {
      expect(ASSETS).toHaveProperty('ICONS');
      expect(typeof ASSETS.ICONS).toBe('object');
    });

    it('should have PLACEHOLDERS object', () => {
      expect(ASSETS).toHaveProperty('PLACEHOLDERS');
      expect(typeof ASSETS.PLACEHOLDERS).toBe('object');
    });
  });

  describe('LOGOS', () => {
    it('should have TailorCV logo URL', () => {
      expect(LOGOS).toHaveProperty('TAILORCV');
      expect(LOGOS.TAILORCV).toContain('tailorcv-logo');
      expect(LOGOS.TAILORCV).toMatch(/^https?:\/\//);
    });
  });

  describe('Exported constants', () => {
    it('should export LOGOS matching ASSETS.LOGOS', () => {
      expect(LOGOS).toBe(ASSETS.LOGOS);
    });

    it('should export ICONS matching ASSETS.ICONS', () => {
      expect(ICONS).toBe(ASSETS.ICONS);
    });

    it('should export PLACEHOLDERS matching ASSETS.PLACEHOLDERS', () => {
      expect(PLACEHOLDERS).toBe(ASSETS.PLACEHOLDERS);
    });
  });
});
