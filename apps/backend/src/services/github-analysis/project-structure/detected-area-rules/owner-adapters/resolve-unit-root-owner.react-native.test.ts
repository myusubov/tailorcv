import { resolveUnitRootOwner } from './resolve-unit-root-owner';
import { describe, it, expect } from 'vitest';

/**
 * Owner-resolution spec for bare React Native (no meta-framework) signals,
 * asserted against the shared `resolveUnitRootOwner` -- the same resolver
 * Expo, Next.js, and Jenkins already use.
 *
 * Every path below is lifted from a real, currently public repository,
 * checked against its actual file listing rather than assumed from the path
 * string alone (GitHub tree/code-search API, September 2026, default branch):
 * - root app, fully confirmed: `rainbow-me/rainbow` (react-native.config.js,
 *   android/{build.gradle,gradlew,settings.gradle}, ios/Podfile,
 *   android/app/src/main/java/me/rainbow/MainApplication.kt, metro.config.js,
 *   app.config.ts -- all seven signal-bearing files present at once)
 * - root app bootstrap only: official `react-native-community/template`
 *   (`android/app/src/main/java/com/helloworld/MainApplication.kt`)
 * - single-segment monorepo app, fully confirmed: `LedgerHQ/ledger-live`
 *   (`apps/ledger-live-mobile/...`, including its own MainApplication)
 * - monorepo app with a co-located library, fully confirmed:
 *   `Shopify/react-native-skia` (`apps/example/...` is the demo app;
 *   `packages/skia/android/build.gradle` is the library's own native module,
 *   not an app, with no react-native.config.js of its own)
 * - monorepo app with dozens of library siblings, fully confirmed:
 *   `oblador/react-native-vector-icons` (`apps/icon-explorer/...` is the demo
 *   app; `packages/<icon-family>/android/build.gradle` repeats across 40+
 *   independent icon-font packages, none of them an app)
 * - one repo, four differently-shaped example apps, fully confirmed:
 *   `software-mansion/react-native-reanimated` -- `apps/fabric-example/` has
 *   its own react-native.config.js and a full native shell including
 *   MainApplication; `apps/tvos-example/` has the same native shell and
 *   MainApplication but NO react-native.config.js of its own; `apps/
 *   macos-example/` has only a config file and metro.config.js (no native
 *   folders -- it's macOS-only); `apps/web-example/` has only metro.config.js
 *   and no config file or native folders at all; `packages/
 *   react-native-reanimated/` and `packages/react-native-worklets/` each
 *   carry their own react-native.config.js plus an android/gradlew, without
 *   being apps.
 * - library root doubling as its own build scaffold, fully confirmed:
 *   `software-mansion/react-native-screens` (root has react-native.config.js
 *   + android/{build.gradle,gradlew,settings.gradle}, no root ios/Podfile;
 *   `FabricExample/` and `TVOSExample/` each have a full native shell
 *   including MainApplication but no react-native.config.js of their own --
 *   the repo's only config file is the one at the root, three directories
 *   away from either)
 * - library root + differently-named example, fully confirmed:
 *   `react-native-picker/picker` (root has react-native.config.js +
 *   android/build.gradle + app.config.js, no root ios/Podfile; `example/` is
 *   a full, separately-anchored demo app; `FabricExample/` has a full native
 *   shell including MainApplication but no react-native.config.js of its own)
 * - custom-named app roots, deep nesting, and sibling multi-app monorepos:
 *   GitHub code-search sample -- `mobile/react-native.config.js` (18+
 *   independent repositories), `mobile/rn/react-native.config.js`,
 *   `mobile-side/react-native.config.js`, `apps/expense/mobile/
 *   react-native.config.js`, `apps/expo-go/modules/react-native-webview/
 *   react-native.config.js` (a vendored copy nested three segments deep
 *   inside a much larger app), and `apps/mobile-admin/react-native.config.js`
 *   + `apps/mobile-customer/react-native.config.js` coexisting in one repo.
 *   Only the anchor file's own location was confirmed for this group -- the
 *   surrounding native/metro/bootstrap layout for these specific repositories
 *   was not independently verified, so they're only asserted here as
 *   anchor-signal (dirname) cases, not as non-anchor enclosure cases.
 *
 * Expected owners throughout are the structurally correct directory the
 * evidence actually belongs to, not whatever a particular implementation
 * currently returns -- several of the anchor-less cases below (an example
 * app three directories away from the repo's only react-native.config.js,
 * a differently-cased top-level example directory, a nested Gradle source
 * path) are exactly the shapes real repositories produce but no existing
 * regression coverage exercises.
 */
describe('resolveUnitRootOwner - React Native signals', () => {
  describe('react-native-cli-config: dirname resolves every real shape (anchor signal)', () => {
    it('resolves a root-level react-native.config.js to "."', () => {
      const owner = resolveUnitRootOwner({
        path: 'react-native.config.js',
        isAnchorSignal: true,
        anchorOwners: new Set<string>(),
      });

      expect(owner).toBe('.');
    });

    it('resolves a single-segment monorepo react-native.config.js to its app directory', () => {
      const owner = resolveUnitRootOwner({
        path: 'apps/ledger-live-mobile/react-native.config.js',
        isAnchorSignal: true,
        anchorOwners: new Set<string>(),
      });

      expect(owner).toBe('apps/ledger-live-mobile');
    });

    it.each([
      ['mobile/react-native.config.js', 'mobile'],
      ['mobile/rn/react-native.config.js', 'mobile/rn'],
      ['mobile-side/react-native.config.js', 'mobile-side'],
    ])(
      'resolves a custom-named app root %s to %s, with no fixed directory-name vocabulary',
      (path, expectedOwner) => {
        const owner = resolveUnitRootOwner({
          path,
          isAnchorSignal: true,
          anchorOwners: new Set<string>(),
        });

        expect(owner).toBe(expectedOwner);
      },
    );

    it('resolves a deep-nested app root to its full path, regardless of segment count', () => {
      const owner = resolveUnitRootOwner({
        path: 'apps/expense/mobile/react-native.config.js',
        isAnchorSignal: true,
        anchorOwners: new Set<string>(),
      });

      expect(owner).toBe('apps/expense/mobile');
    });

    it('resolves a library vendored three segments deep inside another app to its own nested directory', () => {
      const owner = resolveUnitRootOwner({
        path: 'apps/expo-go/modules/react-native-webview/react-native.config.js',
        isAnchorSignal: true,
        anchorOwners: new Set<string>(),
      });

      expect(owner).toBe('apps/expo-go/modules/react-native-webview');
    });

    it('resolves two sibling apps under the same monorepo parent to two independent owners', () => {
      const adminOwner = resolveUnitRootOwner({
        path: 'apps/mobile-admin/react-native.config.js',
        isAnchorSignal: true,
        anchorOwners: new Set<string>(),
      });
      const customerOwner = resolveUnitRootOwner({
        path: 'apps/mobile-customer/react-native.config.js',
        isAnchorSignal: true,
        anchorOwners: new Set<string>(),
      });

      expect(adminOwner).toBe('apps/mobile-admin');
      expect(customerOwner).toBe('apps/mobile-customer');
      expect(adminOwner).not.toBe(customerOwner);
    });

    it.each([
      ['example/react-native.config.js', 'example'],
      ['apps/example/react-native.config.js', 'apps/example'],
      ['apps/icon-explorer/react-native.config.js', 'apps/icon-explorer'],
      ['apps/fabric-example/react-native.config.js', 'apps/fabric-example'],
      ['apps/macos-example/react-native.config.js', 'apps/macos-example'],
    ])(
      'resolves an example/demo app anchor %s to %s, whatever it is named or how deeply it is nested',
      (path, expectedOwner) => {
        const owner = resolveUnitRootOwner({
          path,
          isAnchorSignal: true,
          anchorOwners: new Set<string>(),
        });

        expect(owner).toBe(expectedOwner);
      },
    );

    it.each([
      ['packages/react-native-reanimated/react-native.config.js', 'packages/react-native-reanimated'],
      ['packages/react-native-worklets/react-native.config.js', 'packages/react-native-worklets'],
    ])(
      'resolves a library package that anchors its own build scaffold (not an app) %s to %s',
      (path, expectedOwner) => {
        const owner = resolveUnitRootOwner({
          path,
          isAnchorSignal: true,
          anchorOwners: new Set<string>(),
        });

        expect(owner).toBe(expectedOwner);
      },
    );
  });

  describe('android-native-shell / ios-native-shell / metro-bundler-config: enclosed by a co-located or ancestor anchor (regression guards)', () => {
    it('ties android/ios/metro evidence to its own already-resolved monorepo app owner', () => {
      const anchorOwners = new Set<string>(['apps/ledger-live-mobile']);

      expect(
        resolveUnitRootOwner({
          path: 'apps/ledger-live-mobile/android/build.gradle',
          isAnchorSignal: false,
          anchorOwners,
        }),
      ).toBe('apps/ledger-live-mobile');
      expect(
        resolveUnitRootOwner({
          path: 'apps/ledger-live-mobile/ios/Podfile',
          isAnchorSignal: false,
          anchorOwners,
        }),
      ).toBe('apps/ledger-live-mobile');
    });

    it('ties android/ios/metro evidence to its own already-resolved example-app owner', () => {
      const anchorOwners = new Set<string>(['apps/example']);

      expect(
        resolveUnitRootOwner({
          path: 'apps/example/android/build.gradle',
          isAnchorSignal: false,
          anchorOwners,
        }),
      ).toBe('apps/example');
      expect(
        resolveUnitRootOwner({
          path: 'apps/example/ios/Podfile',
          isAnchorSignal: false,
          anchorOwners,
        }),
      ).toBe('apps/example');
      expect(
        resolveUnitRootOwner({
          path: 'apps/example/metro.config.js',
          isAnchorSignal: false,
          anchorOwners,
        }),
      ).toBe('apps/example');
    });

    it('ties android/ios/metro evidence to its own already-resolved icon-explorer owner', () => {
      const anchorOwners = new Set<string>(['apps/icon-explorer']);

      expect(
        resolveUnitRootOwner({
          path: 'apps/icon-explorer/android/build.gradle',
          isAnchorSignal: false,
          anchorOwners,
        }),
      ).toBe('apps/icon-explorer');
      expect(
        resolveUnitRootOwner({
          path: 'apps/icon-explorer/ios/Podfile',
          isAnchorSignal: false,
          anchorOwners,
        }),
      ).toBe('apps/icon-explorer');
    });

    it('ties android/ios/metro evidence to its own already-resolved fabric-example owner', () => {
      const anchorOwners = new Set<string>([
        'apps/fabric-example',
        'apps/macos-example',
        'packages/react-native-reanimated',
        'packages/react-native-worklets',
      ]);

      expect(
        resolveUnitRootOwner({
          path: 'apps/fabric-example/android/build.gradle',
          isAnchorSignal: false,
          anchorOwners,
        }),
      ).toBe('apps/fabric-example');
      expect(
        resolveUnitRootOwner({
          path: 'apps/fabric-example/ios/Podfile',
          isAnchorSignal: false,
          anchorOwners,
        }),
      ).toBe('apps/fabric-example');
      expect(
        resolveUnitRootOwner({
          path: 'apps/fabric-example/metro.config.js',
          isAnchorSignal: false,
          anchorOwners,
        }),
      ).toBe('apps/fabric-example');
    });

    it('resolves via the android/ios path-shape fallback for a library sub-package with no react-native.config.js of its own', () => {
      // packages/skia has no anchor -- only apps/example does, elsewhere in
      // the same repository. Matches the android/ios fallback branch before
      // reaching the generic resolver, though both would agree here since
      // "packages" is also a recognized monorepo root.
      const owner = resolveUnitRootOwner({
        path: 'packages/skia/android/build.gradle',
        isAnchorSignal: false,
        anchorOwners: new Set<string>(['apps/example']),
      });

      expect(owner).toBe('packages/skia');
    });

    it('resolves via the android/ios path-shape fallback for each of dozens of independent icon-font packages', () => {
      const anchorOwners = new Set<string>(['apps/icon-explorer']);

      expect(
        resolveUnitRootOwner({
          path: 'packages/fontawesome/android/build.gradle',
          isAnchorSignal: false,
          anchorOwners,
        }),
      ).toBe('packages/fontawesome');
      expect(
        resolveUnitRootOwner({
          path: 'packages/ionicons/android/build.gradle',
          isAnchorSignal: false,
          anchorOwners,
        }),
      ).toBe('packages/ionicons');
    });

    it('resolves via the android/ios path-shape fallback for a config-less example app whose siblings do have anchors', () => {
      // apps/tvos-example carries a full native shell but, unlike its
      // apps/fabric-example sibling, no react-native.config.js of its own.
      // Matches the android/ios fallback branch before reaching the generic
      // resolver, though both would agree here since "apps" is also a
      // recognized monorepo root.
      const owner = resolveUnitRootOwner({
        path: 'apps/tvos-example/android/build.gradle',
        isAnchorSignal: false,
        anchorOwners: new Set<string>([
          'apps/fabric-example',
          'apps/macos-example',
          'packages/react-native-reanimated',
          'packages/react-native-worklets',
        ]),
      });

      expect(owner).toBe('apps/tvos-example');
    });

    it('resolves via the metro.config.* path-shape fallback for a metro-only example app with no config file and no native folders', () => {
      // Matches the metro.config.* fallback branch before reaching the
      // generic resolver, though both would agree here since "apps" is also
      // a recognized monorepo root.
      const owner = resolveUnitRootOwner({
        path: 'apps/web-example/metro.config.js',
        isAnchorSignal: false,
        anchorOwners: new Set<string>([
          'apps/fabric-example',
          'apps/macos-example',
          'packages/react-native-reanimated',
          'packages/react-native-worklets',
        ]),
      });

      expect(owner).toBe('apps/web-example');
    });
  });

  describe('android-native-shell / ios-native-shell / metro-bundler-config: an unrelated anchor elsewhere in the repo must not swallow a fully separate example app', () => {
    it('resolves FabricExample evidence to "FabricExample", not to the library root three directories away', () => {
      // software-mansion/react-native-screens: the repo's only
      // react-native.config.js is at the root; FabricExample/ has none of
      // its own but carries a complete, independent native shell.
      const anchorOwners = new Set<string>(['.']);

      expect(
        resolveUnitRootOwner({
          path: 'FabricExample/android/build.gradle',
          isAnchorSignal: false,
          anchorOwners,
        }),
      ).toBe('FabricExample');
      expect(
        resolveUnitRootOwner({
          path: 'FabricExample/ios/Podfile',
          isAnchorSignal: false,
          anchorOwners,
        }),
      ).toBe('FabricExample');
      expect(
        resolveUnitRootOwner({
          path: 'FabricExample/metro.config.js',
          isAnchorSignal: false,
          anchorOwners,
        }),
      ).toBe('FabricExample');
    });

    it('resolves TVOSExample evidence to "TVOSExample", not to the library root', () => {
      const anchorOwners = new Set<string>(['.']);

      expect(
        resolveUnitRootOwner({
          path: 'TVOSExample/android/build.gradle',
          isAnchorSignal: false,
          anchorOwners,
        }),
      ).toBe('TVOSExample');
      expect(
        resolveUnitRootOwner({
          path: 'TVOSExample/ios/Podfile',
          isAnchorSignal: false,
          anchorOwners,
        }),
      ).toBe('TVOSExample');
      expect(
        resolveUnitRootOwner({
          path: 'TVOSExample/metro.config.js',
          isAnchorSignal: false,
          anchorOwners,
        }),
      ).toBe('TVOSExample');
    });

    it('resolves react-native-picker/picker\'s FabricExample evidence to "FabricExample", not to the library root or the sibling example/ app', () => {
      // react-native-picker/picker: react-native.config.js exists at both
      // the repo root and inside example/, but FabricExample/ has neither --
      // it is a third, fully independent demo app in the same repo.
      const anchorOwners = new Set<string>(['.', 'example']);

      expect(
        resolveUnitRootOwner({
          path: 'FabricExample/android/build.gradle',
          isAnchorSignal: false,
          anchorOwners,
        }),
      ).toBe('FabricExample');
      expect(
        resolveUnitRootOwner({
          path: 'FabricExample/ios/Podfile',
          isAnchorSignal: false,
          anchorOwners,
        }),
      ).toBe('FabricExample');
      expect(
        resolveUnitRootOwner({
          path: 'FabricExample/metro.config.js',
          isAnchorSignal: false,
          anchorOwners,
        }),
      ).toBe('FabricExample');
    });
  });

  describe('react-native-application-bootstrap: Android\'s fixed internal plumbing never shifts the owner away from the app root', () => {
    it('resolves a root-level MainApplication to "."', () => {
      const owner = resolveUnitRootOwner({
        path: 'android/app/src/main/java/com/helloworld/MainApplication.kt',
        isAnchorSignal: false,
        anchorOwners: new Set<string>(['.']),
      });

      expect(owner).toBe('.');
    });

    it('resolves a real root-level MainApplication (rainbow-me/rainbow) to "."', () => {
      const owner = resolveUnitRootOwner({
        path: 'android/app/src/main/java/me/rainbow/MainApplication.kt',
        isAnchorSignal: false,
        anchorOwners: new Set<string>(['.']),
      });

      expect(owner).toBe('.');
    });

    it('resolves a single-segment monorepo MainApplication to its app directory, not to "apps/ledger-live-mobile/android"', () => {
      const owner = resolveUnitRootOwner({
        path: 'apps/ledger-live-mobile/android/app/src/main/java/com/ledger/live/MainApplication.kt',
        isAnchorSignal: false,
        anchorOwners: new Set<string>(['apps/ledger-live-mobile']),
      });

      expect(owner).toBe('apps/ledger-live-mobile');
    });

    it('resolves an anchored example app\'s MainApplication to its own directory, not a truncated Gradle-path prefix', () => {
      const owner = resolveUnitRootOwner({
        path: 'apps/fabric-example/android/app/src/main/java/com/fabricexample/MainApplication.kt',
        isAnchorSignal: false,
        anchorOwners: new Set<string>([
          'apps/fabric-example',
          'apps/macos-example',
          'packages/react-native-reanimated',
          'packages/react-native-worklets',
        ]),
      });

      expect(owner).toBe('apps/fabric-example');
    });

    it('resolves a config-less example app\'s MainApplication to its own directory, not to any sibling\'s anchor', () => {
      const owner = resolveUnitRootOwner({
        path: 'apps/tvos-example/android/app/src/main/java/com/tvosexample/MainApplication.kt',
        isAnchorSignal: false,
        anchorOwners: new Set<string>([
          'apps/fabric-example',
          'apps/macos-example',
          'packages/react-native-reanimated',
          'packages/react-native-worklets',
        ]),
      });

      expect(owner).toBe('apps/tvos-example');
    });

    it('resolves FabricExample\'s MainApplication to "FabricExample", not to the library root or a truncated Gradle-path prefix', () => {
      const owner = resolveUnitRootOwner({
        path: 'FabricExample/android/app/src/main/java/com/fabricexample/MainApplication.kt',
        isAnchorSignal: false,
        anchorOwners: new Set<string>(['.']),
      });

      expect(owner).toBe('FabricExample');
    });

    it('resolves TVOSExample\'s MainApplication to "TVOSExample", not to the library root', () => {
      const owner = resolveUnitRootOwner({
        path: 'TVOSExample/android/app/src/main/java/com/tvosexample/MainApplication.kt',
        isAnchorSignal: false,
        anchorOwners: new Set<string>(['.']),
      });

      expect(owner).toBe('TVOSExample');
    });

    it('resolves react-native-picker/picker\'s FabricExample MainApplication to "FabricExample"', () => {
      const owner = resolveUnitRootOwner({
        path: 'FabricExample/android/app/src/main/java/com/fabricexample/MainApplication.kt',
        isAnchorSignal: false,
        anchorOwners: new Set<string>(['.', 'example']),
      });

      expect(owner).toBe('FabricExample');
    });
  });

  describe('expo-modules-coexistence: same directory-ownership rule as every other file-based signal', () => {
    it('resolves a real root-level app.config.ts (rainbow-me/rainbow, a genuine bare RN app) to "."', () => {
      const owner = resolveUnitRootOwner({
        path: 'app.config.ts',
        isAnchorSignal: false,
        anchorOwners: new Set<string>(['.']),
      });

      expect(owner).toBe('.');
    });

    it('resolves a real library-root app.config.js (react-native-picker/picker) to "."', () => {
      const owner = resolveUnitRootOwner({
        path: 'app.config.js',
        isAnchorSignal: false,
        anchorOwners: new Set<string>(['.', 'example']),
      });

      expect(owner).toBe('.');
    });
  });
});
