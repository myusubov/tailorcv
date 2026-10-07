import { describe, expect, it } from 'vitest';
import { resolveUnitRootOwner } from './resolve-unit-root-owner';

/**
 * Owner-resolution spec for Docusaurus evidence paths, asserted against the
 * shared `resolveUnitRootOwner` (the same resolver Next.js, Nuxt, Expo and
 * Jenkins use). The Docusaurus detector marks `docusaurus.config.*` as its
 * anchor signal, so the engine resolves every config first, collects the
 * config directories into `anchorOwners`, and only then resolves the support
 * files (sidebars, docs, blog, i18n, versioning) against that set.
 *
 * Every layout below is a real repository from the Docusaurus tree survey,
 * named in the comments. Each describe block passes the `anchorOwners` the
 * engine would have collected for that repository (the directory of every
 * counted config, `.` for a root config), abridged to what a case needs.
 * Anchor cases pass an empty set because the anchor branch ignores it. A row
 * is `[evidence path, expected owner]`.
 *
 * Decisions baked into the expectations:
 * - The config owns its own directory exactly: never the parent, never the
 *   content `docs/` folder, never truncated to `apps/<name>`.
 * - A support file belongs to the longest config directory that encloses it,
 *   so a nested site keeps its own files.
 * - A support file that no config directory encloses (a repo-root `docs/`
 *   beside `website/`) resolves through the generic fallback to a folder that
 *   has no config, which the detector's gate then drops.
 * - A root config (`.`) owns every path in the repo that no deeper config
 *   encloses, including a `src` folder and a workspace-root folder inside it.
 *   The cases under "a root config encloses every path" state that rule.
 *
 * Template, test, demo, sample and `.docusaurus` cache paths are not this
 * function's job: the detector's entry schemas drop them before the resolver
 * runs.
 */
describe('resolveUnitRootOwner (Docusaurus sites)', () => {
  describe('a config owns its own directory', () => {
    const anchorOwners = new Set<string>();
    it.each([
      // electron/website, the most common topic-search layout: the repo is
      // the site.
      ['docusaurus.config.ts', '.'],
      // facebook/docusaurus, jestjs/jest, reduxjs/redux, prettier/prettier,
      // react-native-website: the site is in `website/`.
      ['website/docusaurus.config.ts', 'website'],
      // wasp-lang/wasp.
      ['web/docusaurus.config.ts', 'web'],
      // airbytehq/airbyte: a one-segment folder with Markdown in a root
      // `docs/`.
      ['docusaurus/docusaurus.config.ts', 'docusaurus'],
      // mlflow/mlflow, hasura/graphql-engine: the config sits inside `docs/`,
      // with content in `docs/docs/`. The owner is the config folder, not the
      // repo root the generic resolver would return.
      ['docs/docusaurus.config.ts', 'docs'],
      // nx-dotnet/nx-dotnet: a workspace app.
      ['apps/docs-site/docusaurus.config.ts', 'apps/docs-site'],
      // typescript-eslint/typescript-eslint: an `.mts` config in a workspace
      // unit.
      ['packages/website/docusaurus.config.mts', 'packages/website'],
      // A config deeper than the workspace unit keeps its full folder, where
      // the application-area fallback would cut it to `apps/docs`.
      ['apps/docs/site/docusaurus.config.js', 'apps/docs/site'],
      // The original case of the folder is kept.
      ['Website/docusaurus.config.js', 'Website'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: true, anchorOwners }),
      ).toBe(owner);
    });

    it.each(['js', 'ts', 'mjs', 'cjs', 'mts', 'cts'])(
      'resolves a .%s config to its folder',
      (extension) => {
        expect(
          resolveUnitRootOwner({
            path: `website/docusaurus.config.${extension}`,
            isAnchorSignal: true,
            anchorOwners,
          }),
        ).toBe('website');
      },
    );

    it('resolves a single-segment anchor to "." even when its own path is in the set', () => {
      expect(
        resolveUnitRootOwner({
          path: 'docusaurus.config.js',
          isAnchorSignal: true,
          anchorOwners: new Set(['docusaurus.config.js']),
        }),
      ).toBe('.');
    });
  });

  describe('support files follow the config beside them', () => {
    describe('a site in website/', () => {
      // facebook/docusaurus `website/`, jestjs/jest `website/`.
      const anchorOwners = new Set(['website']);
      it.each([
        ['website/sidebars.ts', 'website'],
        ['website/sidebars.json', 'website'],
        ['website/docs/intro.md', 'website'],
        ['website/docs/guides/setup.mdx', 'website'],
        ['website/blog/2024-01-01-hello.md', 'website'],
        ['website/versions.json', 'website'],
        ['website/versioned_docs/version-1.0.0/intro.md', 'website'],
        ['website/versioned_sidebars/version-1.0.0-sidebars.json', 'website'],
        [
          'website/i18n/fr/docusaurus-plugin-content-docs/current/intro.md',
          'website',
        ],
        ['website/i18n/fr/docusaurus-theme-classic/navbar.json', 'website'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a config inside docs/', () => {
      // mlflow/mlflow: `docs/docusaurus.config.ts`, content in `docs/docs/`,
      // several sidebar files beside the config.
      const anchorOwners = new Set(['docs']);
      it.each([
        ['docs/sidebars.ts', 'docs'],
        ['docs/sidebarsClassicML.ts', 'docs'],
        ['docs/docs/index.mdx', 'docs'],
        ['docs/docs/genai/tracing.md', 'docs'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a multi-instance site', () => {
      // airbytehq/airbyte: five sidebar files, `<id>_versions.json` and
      // `<id>_versioned_docs/`, per-instance i18n folders.
      const anchorOwners = new Set(['docusaurus']);
      it.each([
        ['docusaurus/sidebar-platform.js', 'docusaurus'],
        ['docusaurus/sidebar-connectors.js', 'docusaurus'],
        ['docusaurus/platform_versions.json', 'docusaurus'],
        [
          'docusaurus/platform_versioned_docs/version-1.0/intro.md',
          'docusaurus',
        ],
        [
          'docusaurus/platform_versioned_sidebars/version-1.0-sidebars.json',
          'docusaurus',
        ],
        [
          'docusaurus/i18n/en/docusaurus-plugin-content-docs-platform/current/intro.md',
          'docusaurus',
        ],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a workspace unit', () => {
      // typescript-eslint/typescript-eslint: sidebars live in a folder.
      const anchorOwners = new Set(['packages/website']);
      it.each([
        ['packages/website/sidebars/sidebar.base.js', 'packages/website'],
        ['packages/website/blog/2024-01-01-release.md', 'packages/website'],
        ['packages/website/docs/intro.md', 'packages/website'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });
  });

  describe('support files outside every config directory', () => {
    // The Markdown is in a repo-root `docs/`, beside the site folder. The
    // resolver gives it the generic fallback owner, a folder with no config,
    // so the detector's gate drops that candidate and the site keeps only
    // what sits inside its own folder.
    describe('a root docs/ beside website/', () => {
      // jestjs/jest, reduxjs/redux, babel/babel, prettier/prettier.
      const anchorOwners = new Set(['website']);
      it.each([
        ['docs/GettingStarted.md', '.'],
        ['docs/guides/Configuration.md', '.'],
        ['sidebars.js', '.'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a root docs/ beside a workspace app', () => {
      // nx-dotnet/nx-dotnet: `docs/core/`, `docs/index.md`.
      const anchorOwners = new Set(['apps/docs-site']);
      it.each([
        ['docs/index.md', '.'],
        ['docs/core/getting-started.md', '.'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('another workspace unit with no config', () => {
      // The fallback is the unit, a folder with no config of its own.
      const anchorOwners = new Set(['apps/docs']);
      it.each([
        ['apps/web/docs/intro.md', 'apps/web'],
        ['packages/ui/blog/post.md', 'packages/ui'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });
  });

  describe('several sites in one repository', () => {
    describe('a nested site keeps its own files', () => {
      // A `website/` site with a second config at `website/api`.
      const anchorOwners = new Set(['website', 'website/api']);
      it.each([
        ['website/docs/intro.md', 'website'],
        ['website/sidebars.js', 'website'],
        ['website/api/docs/intro.md', 'website/api'],
        ['website/api/sidebars.js', 'website/api'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('sibling sites are not folded', () => {
      // transaurus/staging-goauthentik-authentik: three configs under
      // `website/`; each is its own candidate, none collapses into `website`.
      const anchorOwners = new Set([
        'website/api',
        'website/docs',
        'website/integrations',
      ]);
      it.each([
        ['website/api/docusaurus.config.ts', true, 'website/api'],
        ['website/docs/docusaurus.config.ts', true, 'website/docs'],
        ['website/docs/docs/index.md', false, 'website/docs'],
        ['website/integrations/sidebars.js', false, 'website/integrations'],
      ])('%s (anchor: %s) -> %s', (path, isAnchorSignal, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a folder name that only shares a string prefix', () => {
      // `website-admin` is not inside `website`.
      const anchorOwners = new Set(['website', 'website-admin']);
      it.each([
        ['website/docs/intro.md', 'website'],
        ['website-admin/docs/intro.md', 'website-admin'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a root site beside per-locale site folders', () => {
      // Seeed-Studio/wiki-documents: a root config plus `sites/<locale>/`
      // configs, each locale its own candidate.
      const anchorOwners = new Set(['.', 'sites/en', 'sites/es']);
      it.each([
        ['sites/en/docs/intro.md', 'sites/en'],
        ['sites/es/sidebars.js', 'sites/es'],
        ['docs/intro.md', '.'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });
  });

  describe('a root site', () => {
    // electron/website: the repo is the site. A root config does not enclose
    // anything in this resolver, so these resolve through the generic
    // fallback, which returns the repo root for the common layouts.
    const anchorOwners = new Set(['.']);
    it.each([
      ['sidebars.js', '.'],
      ['versions.json', '.'],
      ['docs/intro.md', '.'],
      ['docs/guides/setup.mdx', '.'],
      ['blog/2024-01-01-hello.md', '.'],
      ['versioned_docs/version-1.0.0/intro.md', '.'],
      ['i18n/fr/docusaurus-plugin-content-docs/current/intro.md', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
      ).toBe(owner);
    });

    // Expected owners are what a person would say: the root site owns every
    // path in the repo. A `src` segment or a workspace-root folder must not
    // cut the file away from it, or its evidence never reaches the root
    // candidate. The `android`/`ios` cases rely on this detector not using
    // `resolveNativePlatformUnitRootOwner`, which would cut at those folders.
    describe('a root config encloses every path', () => {
      it.each([
        ['docs/src/intro.md', '.'],
        ['docs/ios/setup.md', '.'],
        ['docs/android/setup.md', '.'],
        ['packages/guide/docs/intro.md', '.'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });
  });
});
