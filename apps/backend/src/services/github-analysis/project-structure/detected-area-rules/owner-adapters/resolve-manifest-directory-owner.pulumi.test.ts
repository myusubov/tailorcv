import { describe, expect, it } from 'vitest';
import { resolveManifestDirectoryOwner } from './resolve-manifest-directory-owner';

/**
 * Owner-resolution spec for Pulumi evidence paths. The adapter is shared with
 * the Helm detector, whose layouts are in
 * `resolve-manifest-directory-owner.helm.test.ts`.
 *
 * Every layout below is a real repository from the tree survey, named in the
 * comments. Several outcomes depend on the other projects in the same repo, so
 * every case passes `manifestDirectories`, the directory of every counted
 * `Pulumi.yaml` (`.` for a root project). Large repos are abridged to the
 * directories the case needs; the abridged ones say so. A row is `[evidence
 * path, expected owner]` when the whole group shares one `manifestDirectories`
 * constant.
 *
 * The expected owner is the directory a person would call the Pulumi project
 * for that evidence path, decided from the repository's layout and not from
 * what the resolver returns, so a failing case is a real gap in the resolver
 * and not a test to adjust. Decisions baked into the expectations, change them
 * here if you decide otherwise:
 * - A project folder owns its `Pulumi.yaml` and its stack files, whatever the
 *   folder is called. Pulumi itself defines a project as the nearest parent
 *   folder holding a `Pulumi.yaml`.
 * - A project nested inside another project folds into the enclosing one.
 * - Two or more projects that share a parent directory collapse into that
 *   parent. A lone project keeps its own folder. The parent's name never
 *   matters.
 * - A root project owns every path in the repo.
 * - A workspace unit (`apps/<name>`, `libs/<name>`, ...) owns every project
 *   below it, ahead of the root-project rule.
 * - A stack file outside any project folder owns its own directory, so it
 *   never passes the detector's gate on its own.
 *
 * Demo, test and provider-stub paths are not this function's job: the Pulumi
 * detector's entry schemas drop them before the resolver runs.
 */
describe('resolveManifestDirectoryOwner (Pulumi projects)', () => {
  describe('a root project owns the whole repo', () => {
    // jonashackt/pulumi-typescript-aws-fargate.
    const manifestDirectories = ['.'];
    it.each([
      ['Pulumi.yaml', '.'],
      ['Pulumi.dev.yaml', '.'],
      // exanubes/pulumi-first-look: `stackConfigDir` moves the stack files
      // into `.config/`, below the root project.
      ['.config/Pulumi.dev.yaml', '.'],
      ['.config/Pulumi.feat-3.yaml', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveManifestDirectoryOwner({ path, manifestDirectories }),
      ).toBe(owner);
    });
  });

  describe('a project in infra owns its project and stack files', () => {
    // EthanOrlander/tabapp.
    const manifestDirectories = ['infra'];
    it.each([
      ['infra/Pulumi.yaml', 'infra'],
      ['infra/Pulumi.dev.yaml', 'infra'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveManifestDirectoryOwner({ path, manifestDirectories }),
      ).toBe(owner);
    });
  });

  describe('one project per service keeps one owner each, nested projects fold in', () => {
    // gchristov/thecodinglove-kotlinjs: `search/infra/dev` and
    // `slack/infra/dev` hold a second project inside an enclosing one.
    const manifestDirectories = [
      'common/infra',
      'landing-page-web/infra',
      'proxy-web/infra',
      'search/infra',
      'search/infra/dev',
      'slack-web/infra',
      'slack/infra',
      'slack/infra/dev',
      'statistics/infra',
    ];
    it.each([
      ['common/infra/Pulumi.yaml', 'common/infra'],
      ['common/infra/Pulumi.prod.yaml', 'common/infra'],
      ['slack-web/infra/Pulumi.yaml', 'slack-web/infra'],
      ['statistics/infra/Pulumi.yaml', 'statistics/infra'],
      ['search/infra/Pulumi.yaml', 'search/infra'],
      ['search/infra/dev/Pulumi.yaml', 'search/infra'],
      ['search/infra/dev/Pulumi.dev.yaml', 'search/infra'],
      ['slack/infra/dev/Pulumi.yaml', 'slack/infra'],
      ['slack/infra/dev/Pulumi.dev.yaml', 'slack/infra'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveManifestDirectoryOwner({ path, manifestDirectories }),
      ).toBe(owner);
    });
  });

  describe('sibling projects collapse into their shared parent', () => {
    describe('two stacks side by side', () => {
      // Data-Only-Greater/sveltekit-adapter-aws-pulumi.
      const manifestDirectories = ['stacks/main', 'stacks/server'];
      it.each([
        ['stacks/main/Pulumi.yaml', 'stacks'],
        ['stacks/server/Pulumi.yaml', 'stacks'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });

    describe('one project per environment', () => {
      // 13-pieces-teen/suna-new.
      const manifestDirectories = [
        'infra/environments/dev',
        'infra/environments/prod',
        'infra/environments/staging',
      ];
      it.each([
        ['infra/environments/dev/Pulumi.yaml', 'infra/environments'],
        ['infra/environments/dev/Pulumi.dev.yaml', 'infra/environments'],
        ['infra/environments/prod/Pulumi.yaml', 'infra/environments'],
        ['infra/environments/staging/Pulumi.yaml', 'infra/environments'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });

    describe('a template collection at the repo root', () => {
      // pulumi/templates has 227 project folders side by side; abridged to
      // three of them.
      const manifestDirectories = ['aiven-go', 'aiven-python', 'aws-go'];
      it.each([
        ['aiven-go/Pulumi.yaml', '.'],
        ['aiven-python/Pulumi.yaml', '.'],
        ['aws-go/Pulumi.yaml', '.'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });

    describe('nested projects inside sibling language folders', () => {
      // ActiveSolution/active-lab-iac2022: `modularized` is a project inside
      // each language project, and the two language projects are siblings.
      const manifestDirectories = [
        'pulumi/csharp',
        'pulumi/csharp/modularized',
        'pulumi/typescript',
        'pulumi/typescript/modularized',
      ];
      it.each([
        ['pulumi/csharp/Pulumi.yaml', 'pulumi'],
        ['pulumi/csharp/Pulumi.dev.yaml', 'pulumi'],
        ['pulumi/csharp/modularized/Pulumi.yaml', 'pulumi'],
        ['pulumi/typescript/modularized/Pulumi.dev.yaml', 'pulumi'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });
  });

  describe('projects under different parents stay separate', () => {
    describe('one folder per cloud under a pulumi folder', () => {
      // Mati365/nomad-cheap-cluster.
      const manifestDirectories = [
        'pulumi/aws/ansible-config-bucket',
        'pulumi/hetzner/nomad-cluster',
      ];
      it.each([
        [
          'pulumi/aws/ansible-config-bucket/Pulumi.yaml',
          'pulumi/aws/ansible-config-bucket',
        ],
        [
          'pulumi/aws/ansible-config-bucket/Pulumi.prod.yaml',
          'pulumi/aws/ansible-config-bucket',
        ],
        [
          'pulumi/hetzner/nomad-cluster/Pulumi.yaml',
          'pulumi/hetzner/nomad-cluster',
        ],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });

    describe('an infrastructure project per application layer', () => {
      // JamesMillerBlog/webxr.
      const manifestDirectories = [
        'src/client/infrastructure',
        'src/server/infrastructure',
        'src/shared/infrastructure',
      ];
      it.each([
        ['src/client/infrastructure/Pulumi.yaml', 'src/client/infrastructure'],
        [
          'src/server/infrastructure/Pulumi.dev.yaml',
          'src/server/infrastructure',
        ],
        ['src/shared/infrastructure/Pulumi.yaml', 'src/shared/infrastructure'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });
  });

  describe('a workspace unit owns its project', () => {
    // mira-amm/mira-amm-web.
    const manifestDirectories = ['libs/platform-vercel'];
    it('libs/platform-vercel/Pulumi.yaml -> libs/platform-vercel', () => {
      expect(
        resolveManifestDirectoryOwner({
          path: 'libs/platform-vercel/Pulumi.yaml',
          manifestDirectories,
        }),
      ).toBe('libs/platform-vercel');
    });
  });

  describe('a root project beats the projects under stacks/', () => {
    // OrangeLab-space/orange-lab: a root project plus one project per stack
    // folder. The root project owns everything.
    const manifestDirectories = [
      '.',
      'stacks/ai',
      'stacks/apps',
      'stacks/bitcoin',
      'stacks/dev',
      'stacks/iot',
      'stacks/media',
    ];
    it.each([
      ['Pulumi.yaml', '.'],
      ['stacks/ai/Pulumi.yaml', '.'],
      ['stacks/media/Pulumi.yaml', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveManifestDirectoryOwner({ path, manifestDirectories }),
      ).toBe(owner);
    });
  });

  describe('a stack file with no project resolves to its own folder', () => {
    // jessepinkman9900/code-snippets: stack files only. The owner has no
    // `Pulumi.yaml`, so the detector's gate never passes for it.
    const manifestDirectories: string[] = [];
    it.each([
      ['pulumi-python/clickhouse/Pulumi.dev.yaml', 'pulumi-python/clickhouse'],
      ['pulumi-python/clickhouse/Pulumi.prod.yaml', 'pulumi-python/clickhouse'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveManifestDirectoryOwner({ path, manifestDirectories }),
      ).toBe(owner);
    });
  });

  // Known, accepted gap: a workspace container (`packages`, `apps`, ...) as the
  // first segment is resolved by the generic unit rule, which stops at
  // `<root>/<name>` and ignores the real project folder below it. The case
  // asserts the owner a person would call the project and is pinned with
  // `it.fails`, so the suite turns red the moment the resolver handles it and
  // the `it.fails` can be dropped.
  describe('known gaps', () => {
    it.fails.each([
      // PotionApps/potionx: a project template nested under packages/.
      [
        'packages/templates/src/project/potionx/deployment/Pulumi.yaml',
        ['packages/templates/src/project/potionx/deployment'],
        'packages/templates/src/project/potionx/deployment',
      ],
    ])('%s -> %s', (path, manifestDirectories, owner) => {
      expect(
        resolveManifestDirectoryOwner({ path, manifestDirectories }),
      ).toBe(owner);
    });
  });

  describe('judgment calls not yet decided', () => {
    it.todo(
      'unrelated projects side by side at the repo root (Fazlul0/Automating-Lambda-Function-Deployment-with-Pulumi: deploy-lambda and infrastructure): one area at "." or one per project',
    );
  });
});
