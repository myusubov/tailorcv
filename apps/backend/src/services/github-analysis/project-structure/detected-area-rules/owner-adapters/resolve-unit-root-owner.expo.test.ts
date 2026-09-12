import { resolveUnitRootOwner } from './resolve-unit-root-owner';
import { describe, it, expect } from 'vitest';

/**
 * Owner-resolution spec for Expo mobile signals, asserted against the shared
 * `resolveUnitRootOwner` (the same resolver Next.js and Jenkins already use).
 *
 * Two of Expo's three anchor signals (`expo-router-typed-env`, i.e.
 * `expo-env.d.ts`, and `expo-dynamic-config`, i.e. `app.config.(ts|js)`) sit
 * directly at the project root, so the existing anchor branch (dirname of the
 * matched file) already resolves them correctly -- those cases are asserted
 * here as regression guards, not as new behavior.
 *
 * The third anchor, `expo-router-root-layout` (`app/_layout.(tsx|jsx|ts|js)`),
 * is never itself at the project root -- Expo Router requires a directory
 * literally named `app` to hold it, and since Expo SDK 55 the default
 * template nests that directory one level deeper still, at `src/app`. Taking
 * the dirname of the matched file would over-resolve in both shapes (`app` or
 * `src/app` becoming part of the returned owner instead of being stripped),
 * so `resolveUnitRootOwner`'s anchor branch special-cases this path shape,
 * stripping the `app/_layout.*` suffix and any enclosing `src` segment. The
 * cases below pin the correct owner for all four combinations (root vs.
 * monorepo, plain `app/` vs. `src/app/`) as regression guards against that
 * dedicated rule.
 *
 * Paths are lifted from real repositories, checked against their actual file
 * listings rather than assumed from the path string alone:
 * - root-level `app/_layout.tsx`: `kadikraman/expo-starter`-style single-repo
 *   layout
 * - root-level `src/app/_layout.tsx`: `EvanBacon/expo-icon-explore` (Expo
 *   staff repo; `src/app` is the default template shape since SDK 55 per
 *   Expo's own docs)
 * - monorepo `apps/<name>/app.config.ts`: `celia-sh/Novella` (`apps/mobile`),
 *   `mozzius/graysky` (`apps/expo`), `safe-global/safe-wallet-monorepo`
 *   (`apps/mobile`)
 * - library-with-example-app `example/`: `ant-design/ant-design-mobile-rn`
 *   (root is an RN library; `example/` holds a full Expo app -- app.config.js,
 *   app.json, app/, eas.json, metro.config.js)
 * - nested example variant `example/basic/`: `achorein/expo-share-intent`
 *   (`example/` is a grouping folder; `example/basic/` is the actual app)
 *
 * The `apps/mobile/src/app/_layout.tsx` case (monorepo + src/app together)
 * was not observed as a single repo during research -- it is the logical
 * composition of two independently confirmed conventions, not a directly
 * verified one. Included anyway because it follows the same stripping rule
 * as the other three and is the shape most likely to appear as monorepo
 * templates catch up to the SDK 55 default.
 */
describe('resolveUnitRootOwner - Expo signals', () => {
  describe('co-located anchors: dirname already works (regression guards)', () => {
    it('resolves a root-level expo-env.d.ts to "."', () => {
      const owner = resolveUnitRootOwner({
        path: 'expo-env.d.ts',
        isAnchorSignal: true,
        anchorOwners: new Set<string>(),
      });

      expect(owner).toBe('.');
    });

    it('resolves a monorepo expo-env.d.ts to its app directory', () => {
      const owner = resolveUnitRootOwner({
        path: 'apps/mobile/expo-env.d.ts',
        isAnchorSignal: true,
        anchorOwners: new Set<string>(),
      });

      expect(owner).toBe('apps/mobile');
    });

    it('resolves a monorepo app.config.ts to its app directory', () => {
      const owner = resolveUnitRootOwner({
        path: 'apps/mobile/app.config.ts',
        isAnchorSignal: true,
        anchorOwners: new Set<string>(),
      });

      expect(owner).toBe('apps/mobile');
    });

    it('resolves app.config.js inside an unrecognized directory name to that directory, not "."', () => {
      // "example" is not a MONOREPO_OWNER_ROOT_DIRECTORIES entry -- this is
      // exactly the case the generic ownerPathForApplicationArea fallback
      // gets wrong (it would return "."). The anchor-dirname rule doesn't
      // depend on a directory-name allowlist, so it's already correct here.
      const owner = resolveUnitRootOwner({
        path: 'example/app.config.js',
        isAnchorSignal: true,
        anchorOwners: new Set<string>(),
      });

      expect(owner).toBe('example');
    });
  });

  describe('expo-router-root-layout: dirname over-resolves, needs a dedicated rule', () => {
    it('resolves a root-level app/_layout.tsx to ".", not "app"', () => {
      const owner = resolveUnitRootOwner({
        path: 'app/_layout.tsx',
        isAnchorSignal: true,
        anchorOwners: new Set<string>(),
      });

      expect(owner).toBe('.');
    });

    it('resolves a root-level src/app/_layout.tsx to ".", not "src/app"', () => {
      // The default template shape since Expo SDK 55.
      const owner = resolveUnitRootOwner({
        path: 'src/app/_layout.tsx',
        isAnchorSignal: true,
        anchorOwners: new Set<string>(),
      });

      expect(owner).toBe('.');
    });

    it('resolves a monorepo apps/mobile/app/_layout.tsx to "apps/mobile", not "apps/mobile/app"', () => {
      const owner = resolveUnitRootOwner({
        path: 'apps/mobile/app/_layout.tsx',
        isAnchorSignal: true,
        anchorOwners: new Set<string>(),
      });

      expect(owner).toBe('apps/mobile');
    });

    it('resolves a monorepo apps/mobile/src/app/_layout.tsx to "apps/mobile", not "apps/mobile/src/app"', () => {
      // Composed case -- see file docstring: not directly observed as one
      // repo, but the same stripping rule as the three cases above should
      // produce this result.
      const owner = resolveUnitRootOwner({
        path: 'apps/mobile/src/app/_layout.tsx',
        isAnchorSignal: true,
        anchorOwners: new Set<string>(),
      });

      expect(owner).toBe('apps/mobile');
    });

    it.each(['tsx', 'jsx', 'ts', 'js'])(
      'strips the app/_layout suffix regardless of its .%s extension',
      (ext) => {
        const owner = resolveUnitRootOwner({
          path: `apps/native/app/_layout.${ext}`,
          isAnchorSignal: true,
          anchorOwners: new Set<string>(),
        });

        expect(owner).toBe('apps/native');
      },
    );
  });

  describe('supportive signals: nearest-enclosing anchor already works (regression guards)', () => {
    it('ties a metro.config.js to its already-resolved example/ anchor owner', () => {
      const owner = resolveUnitRootOwner({
        path: 'example/metro.config.js',
        isAnchorSignal: false,
        anchorOwners: new Set<string>(['example']),
      });

      expect(owner).toBe('example');
    });

    it('ties an eas.json to its innermost enclosing anchor owner in a nested example variant', () => {
      const owner = resolveUnitRootOwner({
        path: 'example/basic/eas.json',
        isAnchorSignal: false,
        anchorOwners: new Set<string>(['example/basic']),
      });

      expect(owner).toBe('example/basic');
    });

    it('ties an app.json to its innermost enclosing anchor owner alongside a co-located eas.json', () => {
      const owner = resolveUnitRootOwner({
        path: 'example/basic/app.json',
        isAnchorSignal: false,
        anchorOwners: new Set<string>(['example/basic']),
      });

      expect(owner).toBe('example/basic');
    });

    it('falls back to the generic resolver when no anchor owner encloses a supportive signal', () => {
      const owner = resolveUnitRootOwner({
        path: 'apps/other/eas.json',
        isAnchorSignal: false,
        anchorOwners: new Set<string>(),
      });

      expect(owner).toBe('apps/other');
    });
  });
});
