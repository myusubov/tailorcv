import { describe, expect, it } from 'vitest';
import { ownerPathForApplicationArea } from './project-structure-path-utils';

describe('project structure path utils', () => {
  describe('ownerPathForApplicationArea', () => {
    it.each([
      ['apps/web/package.json', 'apps/web'],
      ['packages/ui/src/index.ts', 'packages/ui'],
      ['libs/network/main.tf', 'libs/network'],
      // Scoped packages are owned by the scoped package.
      ['packages/@acme/ui/package.json', 'packages/@acme/ui'],
    ])('resolves the workspace unit: %s -> %s', (path, owner) => {
      expect(ownerPathForApplicationArea({ path })).toBe(owner);
    });

    it.each([
      ['Apps/web/package.json', 'Apps/web'],
      ['PACKAGES/ui/package.json', 'PACKAGES/ui'],
      ['Packages/@acme/ui/package.json', 'Packages/@acme/ui'],
    ])(
      'matches the workspace root case-insensitively and keeps its casing: %s -> %s',
      (path, owner) => {
        expect(ownerPathForApplicationArea({ path })).toBe(owner);
      },
    );

    it('matches extraRootDirectories case-insensitively', () => {
      expect(
        ownerPathForApplicationArea({
          path: 'Example/app/index.ts',
          extraRootDirectories: ['example'],
        }),
      ).toBe('Example/app');
    });

    it('does not treat extraRootDirectories as a root for other callers', () => {
      expect(ownerPathForApplicationArea({ path: 'example/app/index.ts' })).toBe(
        '.',
      );
    });

    it.each([
      ['web/src/index.ts', 'web'],
      ['README.md', '.'],
      ['docs/guide.md', '.'],
      // A bare workspace root names no unit.
      ['apps', '.'],
    ])('falls back for non-workspace paths: %s -> %s', (path, owner) => {
      expect(ownerPathForApplicationArea({ path })).toBe(owner);
    });
  });
});
