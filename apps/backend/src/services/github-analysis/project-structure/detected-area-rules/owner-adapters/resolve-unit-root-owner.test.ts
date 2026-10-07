import { resolveUnitRootOwner } from './resolve-unit-root-owner';
import { describe, it, expect } from 'vitest';

describe('resolveUnitRootOwner', () => {
  it('returns "." when the path has no parent directory', () => {
    const input = {
      path: 'next.config.ts',
      isAnchorSignal: false,
      anchorOwners: new Set<string>(),
    };

    const owner = resolveUnitRootOwner(input);

    expect(owner).toBe('.');
  });

  it('returns the directory containing the anchor file', () => {
    const input = {
      path: 'apps/frontend/next.config.ts',
      isAnchorSignal: true,
      anchorOwners: new Set<string>(),
    };

    const owner = resolveUnitRootOwner(input);

    expect(owner).toBe('apps/frontend');
  });

  it('does not attribute a path to an anchor owner that is only a string prefix, not a path prefix', () => {
    const input = {
      path: 'apps/web-admin/src/components/button.tsx',
      isAnchorSignal: false,
      anchorOwners: new Set<string>(['apps/web-admin', 'apps/web']),
    };

    const owner = resolveUnitRootOwner(input);

    expect(owner).toBe('apps/web-admin');
  });

  it('attributes a nested path to its innermost enclosing anchor owner', () => {
    const input = {
      path: 'apps/web/legacy/src/components/button.tsx',
      isAnchorSignal: false,
      anchorOwners: new Set<string>(['apps/web', 'apps/web/legacy']),
    };

    const owner = resolveUnitRootOwner(input);

    expect(owner).toBe('apps/web/legacy');
  });

  it('adopts an anchor owner whose path equals the evidence path exactly', () => {
    const input = {
      path: 'workers/api',
      isAnchorSignal: false,
      anchorOwners: new Set(['workers/api']),
    };

    const owner = resolveUnitRootOwner(input);

    expect(owner).toBe('workers/api');
  });

  it('falls back to the generic resolver when no anchor owner encloses the path', () => {
    const input = {
      path: 'services/foo/src/x.ts',
      isAnchorSignal: false,
      anchorOwners: new Set(['apps/web']),
    };

    const owner = resolveUnitRootOwner(input);

    expect(owner).toBe('services/foo');
  });

  it('falls back to the generic resolver when there are no anchor owners', () => {
    const input = {
      path: 'apps/thing/pages/x.vue',
      isAnchorSignal: false,
      anchorOwners: new Set<string>(),
    };

    const owner = resolveUnitRootOwner(input);

    expect(owner).toBe('apps/thing');
  });

  it('returns "." for a single-segment path even when it is the anchor signal', () => {
    const input = {
      path: 'next.config.ts',
      isAnchorSignal: true,
      anchorOwners: new Set(['next.config.ts']),
    };

    const owner = resolveUnitRootOwner(input);

    expect(owner).toBe('.');
  });

  it('keeps the original case of an anchor owner', () => {
    const owner = resolveUnitRootOwner({
      path: 'Website/docs/intro.md',
      isAnchorSignal: false,
      anchorOwners: new Set(['Website']),
    });

    expect(owner).toBe('Website');
  });

  it('does not depend on the order anchor owners were collected in', () => {
    const owner = resolveUnitRootOwner({
      path: 'apps/web/legacy/src/x.ts',
      isAnchorSignal: false,
      anchorOwners: new Set(['apps/web/legacy', 'apps/web']),
    });

    expect(owner).toBe('apps/web/legacy');
  });

  // Rule under test: the nearest enclosing anchor owns a path; the repository
  // root (".") owns whatever no deeper anchor encloses. A path under a
  // workspace folder (`apps/`, `packages/`) or a `src` folder belongs to the
  // root when the root is an anchor and nothing deeper claims it. The
  // workspace-folder and `src` guesses only apply when no anchor owner
  // encloses the path and none is the root.
  describe('a repository-root anchor owner', () => {
    const anchorOwners = new Set(['.']);

    it.each([
      ['docs/intro.md', '.'],
      ['docs/src/intro.md', '.'],
      ['docs/ios/setup.md', '.'],
      ['apps/thing/app/page.tsx', '.'],
      ['packages/guide/docs/intro.md', '.'],
      ['packages/@acme/ui/index.ts', '.'],
      ['sidebars.js', '.'],
    ])('claims %s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
      ).toBe(owner);
    });

    it('resolves a root anchor file itself to "."', () => {
      expect(
        resolveUnitRootOwner({
          path: 'docusaurus.config.ts',
          isAnchorSignal: true,
          anchorOwners,
        }),
      ).toBe('.');
    });
  });

  describe('a deeper anchor owner beats the repository root', () => {
    const anchorOwners = new Set(['.', 'apps/web']);

    it.each([
      ['apps/web/src/x.ts', 'apps/web'],
      ['apps/web/docs/intro.md', 'apps/web'],
      ['apps/web', 'apps/web'],
      // A sibling folder that no deeper anchor encloses stays with the root.
      ['apps/other/x.ts', '.'],
      // A folder that only shares a string prefix is not inside `apps/web`.
      ['apps/web-admin/x.ts', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
      ).toBe(owner);
    });

    it('picks the innermost of several nested anchors under the root', () => {
      expect(
        resolveUnitRootOwner({
          path: 'a/b/c/x.ts',
          isAnchorSignal: false,
          anchorOwners: new Set(['.', 'a', 'a/b', 'a/b/c']),
        }),
      ).toBe('a/b/c');
    });
  });

  describe('the root never competes with a one-character folder on length', () => {
    // "." and "a" are both one character long; the root must lose to any
    // anchor that really encloses the path, whichever was collected first.
    it.each([
      [['.', 'a']],
      [['a', '.']],
    ])('anchor owners %j', (owners) => {
      expect(
        resolveUnitRootOwner({
          path: 'a/docs/x.md',
          isAnchorSignal: false,
          anchorOwners: new Set(owners),
        }),
      ).toBe('a');
    });

    it('still picks the innermost folder when every name is one character', () => {
      expect(
        resolveUnitRootOwner({
          path: 'a/b/x.md',
          isAnchorSignal: false,
          anchorOwners: new Set(['.', 'a', 'a/b']),
        }),
      ).toBe('a/b');
    });
  });

  describe('without a repository-root anchor', () => {
    // No anchor owner is "." here, so the generic fallback decides.
    it.each<[string, string[], string]>([
      // No anchor owners at all.
      ['app/src/x.ts', [], 'app'],
      ['docs/intro.md', [], '.'],
      ['apps/web/pages/index.tsx', [], 'apps/web'],
      // Anchors exist but none encloses the path.
      ['apps/other/pages/index.tsx', ['apps/web'], 'apps/other'],
      ['docs/intro.md', ['apps/web'], '.'],
    ])('%s with anchors %j -> %s', (path, owners, owner) => {
      expect(
        resolveUnitRootOwner({
          path,
          isAnchorSignal: false,
          anchorOwners: new Set<string>(owners),
        }),
      ).toBe(owner);
    });
  });
});
