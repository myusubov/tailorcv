import { describe, expect, it } from 'vitest';
import { resolveManifestDirectoryOwner } from './resolve-manifest-directory-owner';

/**
 * Owner-resolution spec for AWS CDK evidence paths. The adapter is shared with
 * the Helm, Pulumi and Ansible detectors, whose layouts are in
 * `resolve-manifest-directory-owner.helm.test.ts`,
 * `resolve-manifest-directory-owner.pulumi.test.ts` and
 * `resolve-manifest-directory-owner.ansible.test.ts`.
 *
 * Every layout below is a real repository from the tree survey, named in the
 * comments. Several outcomes depend on the other projects in the same repo, so
 * every case passes `manifestDirectories`, the directory of every counted
 * `cdk.json` (`.` for a root project). Large repos are abridged to the
 * directories a case needs; the abridged ones say so. A row is `[evidence
 * path, expected owner]` when the whole group shares one `manifestDirectories`
 * constant.
 *
 * The expected owner is the directory a person would call the CDK project for
 * that evidence path, decided from the repository's layout and not from what
 * the resolver returns, so a failing case is a real gap in the resolver and
 * not a test to adjust. Decisions baked into the expectations, change them
 * here if you decide otherwise:
 * - A project folder owns its `cdk.json`, its `cdk.context.json` and its
 *   `cdk.out/`, whatever the folder is called. The CDK CLI reads `cdk.json`
 *   from the working directory only, so that folder is the project root and
 *   the other two files are written beside it.
 * - A project nested inside another folds into the enclosing one.
 * - Two or more projects that share a parent directory collapse into that
 *   parent. A lone project keeps its own folder. The parent's name never
 *   matters.
 * - A root project owns every path in the repo.
 * - A workspace unit (`apps/<name>`, `packages/<name>`, ...) owns every
 *   project below it, ahead of the root-project rule.
 * - A support file outside any project folder owns its own directory, so it
 *   never passes the detector's gate on its own.
 *
 * Demo, test and `cdk.template.json` paths are not this function's job: the
 * CDK detector's entry schemas drop them before the resolver runs.
 */
describe('resolveManifestDirectoryOwner (AWS CDK projects)', () => {
  describe('a root project owns the whole repo', () => {
    describe('a single app at the repo root', () => {
      // nideveloper/CDK-SPA-Deploy.
      const manifestDirectories = ['.'];
      it.each([
        ['cdk.json', '.'],
        ['cdk.context.json', '.'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });

    describe('a root project beats the projects below it', () => {
      // aws-samples/sample-serverless-digital-asset-payments: a root
      // `cdk.json` plus two chain-specific deployments in subfolders.
      const manifestDirectories = [
        '.',
        'non-evm-deployments/solana',
        'non-evm-deployments/sui',
      ];
      it.each([
        ['cdk.json', '.'],
        ['non-evm-deployments/solana/cdk.json', '.'],
        ['non-evm-deployments/sui/cdk.json', '.'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });
  });

  describe('a project in a named folder owns its companions', () => {
    describe('a cdk folder', () => {
      // mikeapted/aws-codepipeline-devicefarm: a committed `cdk.out`.
      const manifestDirectories = ['cdk'];
      it.each([
        ['cdk/cdk.json', 'cdk'],
        ['cdk/cdk.context.json', 'cdk'],
        ['cdk/cdk.out/manifest.json', 'cdk'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });

    describe('an infrastructure folder', () => {
      // e-dsin/maturity: the same shape under a different name, which a
      // folder-name list would have to know in advance.
      const manifestDirectories = ['infrastructure'];
      it.each([
        ['infrastructure/cdk.json', 'infrastructure'],
        ['infrastructure/cdk.context.json', 'infrastructure'],
        ['infrastructure/cdk.out/manifest.json', 'infrastructure'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });
  });

  describe('nested projects fold into their enclosing project', () => {
    // aws-solutions-library-samples/guidance-for-detecting-malware-threats-
    // using-aws-transfer-family-managed-workflows-on-aws, abridged: three
    // construct folders carry their own `cdk.json` below the app.
    const manifestDirectories = [
      'virusscan',
      'virusscan/constructs/auth',
      'virusscan/constructs/server',
      'virusscan/constructs/workflow',
    ];
    it.each([
      ['virusscan/cdk.json', 'virusscan'],
      ['virusscan/constructs/auth/cdk.json', 'virusscan'],
      ['virusscan/constructs/server/cdk.json', 'virusscan'],
      ['virusscan/constructs/workflow/cdk.json', 'virusscan'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveManifestDirectoryOwner({ path, manifestDirectories }),
      ).toBe(owner);
    });
  });

  describe('projects under different parents stay separate', () => {
    // jussiohag/aws-projects: one `cdk` folder per project, each below its own
    // project folder.
    const manifestDirectories = [
      'projects/data-lake/cdk',
      'projects/ha-web-service/cdk',
      'projects/rag-bedrock/cdk',
      'projects/static-hosting/cdk',
    ];
    it.each([
      ['projects/data-lake/cdk/cdk.json', 'projects/data-lake/cdk'],
      ['projects/ha-web-service/cdk/cdk.json', 'projects/ha-web-service/cdk'],
      ['projects/rag-bedrock/cdk/cdk.json', 'projects/rag-bedrock/cdk'],
      ['projects/static-hosting/cdk/cdk.json', 'projects/static-hosting/cdk'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveManifestDirectoryOwner({ path, manifestDirectories }),
      ).toBe(owner);
    });
  });

  describe('sibling projects collapse into their shared parent', () => {
    describe('services side by side at the repo root', () => {
      // parnasmi/nodejs-aws-shop-backend.
      const manifestDirectories = [
        'authorization-service',
        'import-service',
        'product-service',
      ];
      it.each([
        ['authorization-service/cdk.json', '.'],
        ['import-service/cdk.json', '.'],
        ['product-service/cdk.json', '.'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });

    describe('two apps in a talk folder and two lone apps elsewhere', () => {
      // SathyaBhat/talks-slides, abridged: `dns` and `infra` share `code`; the
      // other two apps have no sibling.
      const manifestDirectories = [
        'automated-failover-route53/code/dns',
        'automated-failover-route53/code/infra',
        'aws-fargate-ec2/infra',
        'infra-as-code-awsug-nairobi/infra',
      ];
      it.each([
        [
          'automated-failover-route53/code/dns/cdk.json',
          'automated-failover-route53/code',
        ],
        [
          'automated-failover-route53/code/infra/cdk.context.json',
          'automated-failover-route53/code',
        ],
        ['aws-fargate-ec2/infra/cdk.json', 'aws-fargate-ec2/infra'],
        [
          'infra-as-code-awsug-nairobi/infra/cdk.json',
          'infra-as-code-awsug-nairobi/infra',
        ],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });
  });

  describe('workspace units own the projects below them', () => {
    it('apps/cdk/cdk.json -> apps/cdk', () => {
      // nramkissoon/AWS-Lambda-Website-Uptime-Monitor, abridged to the CDK app
      // in `apps/cdk`: a unit that holds one project keeps it.
      expect(
        resolveManifestDirectoryOwner({
          path: 'apps/cdk/cdk.json',
          manifestDirectories: ['apps/cdk'],
        }),
      ).toBe('apps/cdk');
    });

    describe('stack projects under one unit', () => {
      // CrisisCleanup/infrastructure, abridged to two of its three stack
      // projects under `packages/stacks`.
      const manifestDirectories = [
        'packages/stacks/api',
        'packages/stacks/maintenance-site',
      ];
      it.each([
        ['packages/stacks/api/cdk.json', 'packages/stacks'],
        ['packages/stacks/maintenance-site/cdk.json', 'packages/stacks'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });

    describe('service projects under one unit', () => {
      // hman1148/imagineerable: two service projects under `apps/service`.
      const manifestDirectories = [
        'apps/service/business',
        'apps/service/framework',
      ];
      it.each([
        ['apps/service/business/cdk.json', 'apps/service'],
        ['apps/service/framework/cdk.json', 'apps/service'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });
  });

  describe('a support file outside its project resolves elsewhere', () => {
    describe('a context cache beside the repo root, project in a folder', () => {
      // Roguillo/G.Project: `cdk.context.json` sits at the repo root while
      // `cdk.json` is in `backend`. The file owns `.` and the detector's gate
      // never passes for that owner.
      const manifestDirectories = ['backend'];
      it.each([
        ['backend/cdk.json', 'backend'],
        ['cdk.context.json', '.'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });

    describe('a context cache in a folder with no cdk.json', () => {
      // leonarduk/allotmint, abridged: the project is `cdk`; a second
      // `cdk.context.json` sits in `frontend`, which has no `cdk.json`.
      const manifestDirectories = ['cdk'];
      it.each([
        ['cdk/cdk.context.json', 'cdk'],
        ['frontend/cdk.context.json', 'frontend'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });

    describe('synth output under a folder that is not a project', () => {
      // dkr290/devops-projects, abridged: `cdk.json` files live under
      // `aws-cdk/cdk/<app>`, while committed `cdk.out` folders live under
      // `aws-eks/cdk/<app>`, where no `cdk.json` exists.
      const manifestDirectories = [
        'aws-cdk/cdk/eks',
        'aws-cdk/cdk/vpc-deploy',
        'aws-cdk/cdk/vpc-public',
      ];
      it.each([
        ['aws-cdk/cdk/eks/cdk.json', 'aws-cdk/cdk'],
        ['aws-cdk/cdk/eks/cdk.context.json', 'aws-cdk/cdk'],
        ['aws-eks/cdk/eks/cdk.out/manifest.json', 'aws-eks/cdk/eks/cdk.out'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });
  });

  // Known, accepted gap: a workspace container (`apps`, `packages`, ...) as the
  // first segment is resolved by the generic unit rule, which stops at
  // `<root>/<name>` and ignores the real project folder below it. The case
  // asserts the owner a person would call the project and is pinned with
  // `it.fails`, so the suite turns red the moment the resolver handles it and
  // the `it.fails` can be dropped. It affected 4 of 579 surveyed
  // single-project repos.
  describe('known gaps', () => {
    it.fails.each([
      // focustree/starkbot: the project is two folders below the unit.
      [
        'apps/eks/cluster/cdk.json',
        ['apps/eks/cluster'],
        'apps/eks/cluster',
      ],
      [
        'apps/eks/cluster/cdk.context.json',
        ['apps/eks/cluster'],
        'apps/eks/cluster',
      ],
    ])('%s -> %s', (path, manifestDirectories, owner) => {
      expect(
        resolveManifestDirectoryOwner({ path, manifestDirectories }),
      ).toBe(owner);
    });
  });

  describe('judgment calls not yet decided', () => {
    it.todo(
      'independent apps side by side under one folder (parnasmi/nodejs-aws-shop-backend: authorization-service, import-service, product-service): one area at "." or one per service',
    );
    it.todo(
      'a root cdk.json beside workspace units (apps/<name>/cdk.json): the adapter lets the unit beat the root project, but no surveyed repo has this shape, so the expected owner is not decided',
    );
  });
});
