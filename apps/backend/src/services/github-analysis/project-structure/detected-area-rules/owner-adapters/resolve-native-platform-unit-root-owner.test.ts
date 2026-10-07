import { describe, expect, it } from 'vitest';
import { resolveNativePlatformUnitRootOwner } from './resolve-native-platform-unit-root-owner';
import { resolveUnitRootOwner } from './resolve-unit-root-owner';

/**
 * Spec for `resolveNativePlatformUnitRootOwner`, the adapter React Native,
 * Flutter and Expo use. Its extra job over `resolveUnitRootOwner` is to
 * resolve a path that no anchor encloses and that has an `android`/`ios`
 * segment, or is a `metro.config.*` file, to the folder above it: a native
 * project root is whatever folder holds the platform folders, whatever it is
 * called. Per-framework layouts from real repositories are in
 * `resolve-unit-root-owner.react-native.test.ts`,
 * `resolve-unit-root-owner.flutter.test.ts` and
 * `resolve-unit-root-owner.expo.test.ts`.
 *
 * Expected owners are the project root a person would name, not the output of
 * either resolver. The last two blocks state what the adapter must leave to
 * `resolveUnitRootOwner`.
 */
describe('resolveNativePlatformUnitRootOwner', () => {
  describe('an un-enclosed android/ios or metro.config path resolves to the folder above it', () => {
    // No anchor encloses any of these.
    it.each([
      ['FabricExample/android/build.gradle', 'FabricExample'],
      ['mobile/ios/Podfile', 'mobile'],
      ['docs/ios/setup.md', 'docs'],
      ['mobile/metro.config.js', 'mobile'],
      ['example/metro.config.mjs', 'example'],
      ['apps/tvos-example/android/build.gradle', 'apps/tvos-example'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveNativePlatformUnitRootOwner({
          path,
          isAnchorSignal: false,
          anchorOwners: new Set<string>(),
        }),
      ).toBe(owner);
    });

    it('is cut at the platform folder even when a root anchor exists elsewhere', () => {
      // software-mansion/react-native-screens: the only config is at the
      // root, FabricExample/ is an independent app.
      expect(
        resolveNativePlatformUnitRootOwner({
          path: 'FabricExample/ios/Podfile',
          isAnchorSignal: false,
          anchorOwners: new Set(['.']),
        }),
      ).toBe('FabricExample');
    });

    it('resolves a root-level platform folder to the repository root', () => {
      expect(
        resolveNativePlatformUnitRootOwner({
          path: 'android/app/build.gradle',
          isAnchorSignal: false,
          anchorOwners: new Set<string>(),
        }),
      ).toBe('.');
    });
  });

  describe('everything else is left to resolveUnitRootOwner', () => {
    it('keeps an enclosing anchor owner ahead of the path shapes', () => {
      expect(
        resolveNativePlatformUnitRootOwner({
          path: 'apps/web/packages/ios/podfile',
          isAnchorSignal: false,
          anchorOwners: new Set(['apps/web']),
        }),
      ).toBe('apps/web');
    });

    it('resolves an anchor signal to its own directory', () => {
      expect(
        resolveNativePlatformUnitRootOwner({
          path: 'FabricExample/android/react-native.config.js',
          isAnchorSignal: true,
          anchorOwners: new Set<string>(),
        }),
      ).toBe('FabricExample/android');
    });

    it('resolves a single-segment path to the repository root', () => {
      expect(
        resolveNativePlatformUnitRootOwner({
          path: 'metro.config.js',
          isAnchorSignal: false,
          anchorOwners: new Set<string>(),
        }),
      ).toBe('.');
    });

    it('resolves a path with no platform shape under a workspace root to its unit', () => {
      expect(
        resolveNativePlatformUnitRootOwner({
          path: 'packages/guide/docs/intro.md',
          isAnchorSignal: false,
          anchorOwners: new Set<string>(),
        }),
      ).toBe('packages/guide');
    });
  });

  describe('resolveUnitRootOwner does not carry the path shapes', () => {
    // The two adapters must differ here, or a docs folder called `ios` would
    // be cut for every other detector.
    it.each(['docs/ios/setup.md', 'mobile/metro.config.js'])(
      '%s is not cut at the platform folder',
      (path) => {
        expect(
          resolveUnitRootOwner({
            path,
            isAnchorSignal: false,
            anchorOwners: new Set<string>(),
          }),
        ).toBe('.');
      },
    );
  });
});
