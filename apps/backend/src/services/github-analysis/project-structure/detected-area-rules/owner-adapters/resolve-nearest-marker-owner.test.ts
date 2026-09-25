import { describe, expect, it } from 'vitest';
import type { RepoTreeEntry } from '../../project-structure-analyzer.types';
import { buildEntryIndex } from '../../project-structure-entry-index';
import { resolveNearestMarkerOwner } from './resolve-nearest-marker-owner';

const MARKERS = [/^pubspec\.yaml$/, /^\.metadata$/];

function file(path: string): RepoTreeEntry {
  const parts = path.split('/');
  const name = parts[parts.length - 1];
  return {
    path,
    name,
    type: 'file',
    depth: parts.length - 1,
    parentPath: parts.length > 1 ? parts.slice(0, -1).join('/') : null,
    extension: name.includes('.') ? name.split('.').pop() ?? null : null,
    sizeBytes: 100,
  };
}

function resolveAnchor({
  path,
  entryPaths,
}: {
  path: string;
  entryPaths: string[];
}): string {
  return resolveNearestMarkerOwner({
    path,
    isAnchorSignal: true,
    anchorOwners: new Set<string>(),
    markers: MARKERS,
    index: buildEntryIndex(entryPaths.map(file)),
  });
}

function resolveNonAnchor({
  path,
  anchorOwners,
}: {
  path: string;
  anchorOwners: string[];
}): string {
  return resolveNearestMarkerOwner({
    path,
    isAnchorSignal: false,
    anchorOwners: new Set(anchorOwners),
    markers: MARKERS,
    index: buildEntryIndex([]),
  });
}

describe('resolveNearestMarkerOwner', () => {
  describe('anchor signals', () => {
    it('resolves a path with no directory segment to the repository root', () => {
      expect(
        resolveAnchor({
          path: 'build.gradle',
          entryPaths: ['build.gradle', 'pubspec.yaml'],
        }),
      ).toBe('.');
    });

    it('redirects to a marker at the repository root', () => {
      expect(
        resolveAnchor({
          path: 'android/app/build.gradle',
          entryPaths: ['pubspec.yaml', 'android/app/build.gradle'],
        }),
      ).toBe('.');
    });

    it('redirects to a nested host that holds the marker in a subdirectory', () => {
      expect(
        resolveAnchor({
          path: 'apps/field/android/app/build.gradle',
          entryPaths: [
            'apps/field/pubspec.yaml',
            'apps/field/android/app/build.gradle',
          ],
        }),
      ).toBe('apps/field');
    });

    it('picks the nearest ancestor when several ancestors hold a marker', () => {
      expect(
        resolveAnchor({
          path: 'apps/field/android/build.gradle',
          entryPaths: [
            'pubspec.yaml',
            'apps/field/pubspec.yaml',
            'apps/field/android/build.gradle',
          ],
        }),
      ).toBe('apps/field');
    });

    it('matches a marker by its lowercased basename', () => {
      expect(
        resolveAnchor({
          path: 'apps/field/android/build.gradle',
          entryPaths: [
            'apps/field/.metadata',
            'apps/field/android/build.gradle',
          ],
        }),
      ).toBe('apps/field');
    });

    it('ignores a marker in a sibling directory that does not enclose the anchor', () => {
      expect(
        resolveAnchor({
          path: 'apps/native/build.gradle',
          entryPaths: ['apps/field/pubspec.yaml', 'apps/native/build.gradle'],
        }),
      ).toBe('apps/native');
    });

    it('falls back to the anchor own directory when no ancestor holds a marker', () => {
      expect(
        resolveAnchor({
          path: 'apps/app/build.gradle',
          entryPaths: ['apps/app/build.gradle'],
        }),
      ).toBe('apps/app');
    });
  });

  describe('non-anchor signals', () => {
    it('resolves to the deepest enclosing anchor owner', () => {
      expect(
        resolveNonAnchor({
          path: 'apps/field/android/src/Main.kt',
          anchorOwners: ['.', 'apps/field', 'apps/field/android'],
        }),
      ).toBe('apps/field/android');
    });

    it.each([
      ['root listed first', ['.', 'a']],
      ['root listed last', ['a', '.']],
    ])(
      'ranks a real owner above the root regardless of set order (%s)',
      (_label, anchorOwners) => {
        expect(resolveNonAnchor({ path: 'a/x.kt', anchorOwners })).toBe('a');
      },
    );

    it('treats the root owner as enclosing every path', () => {
      expect(resolveNonAnchor({ path: 'x/y.kt', anchorOwners: ['.'] })).toBe(
        '.',
      );
    });

    it('does not let an owner match a longer sibling directory name', () => {
      expect(
        resolveNonAnchor({
          path: 'apps/web-admin/x.kt',
          anchorOwners: ['apps/web'],
        }),
      ).not.toBe('apps/web');
    });
  });
});
