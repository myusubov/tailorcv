import { resolveTerraformRootOwner } from './resolve-terraform-root-owner';
import { describe, it, expect } from 'vitest';

/**
 * Owner-resolution spec for Terraform / OpenTofu / Terragrunt signals.
 *
 * Cases come from a tree survey of 1,802 real GitHub repositories that contain
 * Terraform files (48,604 Terraform directories). Real repos named in the
 * comments: terraform-aws-modules/terraform-aws-vpc, DmitriySh/infra,
 * omrajput14/vetra-backend, ricsanfre/pi-cluster, drzpk/wikilinks,
 * bravecobra/k8s-dev-infrastructure, CSpyridakis/notes, radzionc/radzionkit,
 * xNok/infra-bootstrap-tools, ColorCop/ColorCop-website,
 * gruntwork-io/terragrunt-infrastructure-live-example, PostHog/posthog.
 *
 * Each `describe` names a shape; the expected owner is the directory a person
 * would call the Terraform project for that evidence path. The function under
 * test sees one path plus whether the repo root holds Terraform, so shapes
 * that need more of the tree (a folder that is mostly Terraform but has an
 * unlisted name) are listed as `it.todo` at the end.
 *
 * Groups marked "already true" describe results the generic resolver
 * (`ownerPathForApplicationArea`) also gives, so they guard against the
 * Terraform-specific rules breaking it. Groups marked "new logic" describe
 * results that need the Terraform-specific rules; a few cases inside them
 * also happen to match the generic resolver.
 *
 * Decisions baked into the expectations, change them here if you decide
 * otherwise:
 * - A workspace unit (`apps/<name>`, `services/<name>`, ...) beats every
 *   Terraform folder-name rule below it.
 * - `modules` is a workspace root for the generic resolver but is a
 *   reusable-library folder for Terraform, so Terraform overrides it.
 * - With several home-named segments, the outermost one wins.
 * - A Terraform config file directly at the repo root (`rootHasTerraform`)
 *   absorbs every nested path into `.`, including workspace units and home
 *   folders. Every other group below passes `rootHasTerraform: false`.
 * - Demo and test folders (`examples`, `tests`, `testdata`, ...) are not this
 *   function's job: the Terraform detector's entry schemas drop those paths
 *   before the resolver runs, so no case here uses them as a folder to
 *   resolve.
 * - Folder-name matching is case-insensitive on lookup and preserves the
 *   original casing in the returned owner.
 */
describe('resolveTerraformRootOwner', () => {
  describe('already true: Terraform files at the repo root -> "."', () => {
    it.each([
      'main.tf',
      'variables.tf',
      'outputs.tf',
      'versions.tf',
      'providers.tf',
      'backend.tf',
      'main.tf.json',
      'main.tofu',
      'terragrunt.hcl',
      'root.hcl',
      '.terraform.lock.hcl',
      'terraform.tfvars',
      'terraform.tfstate',
    ])('%s -> .', (path) => {
      expect(
        resolveTerraformRootOwner({ path, rootHasTerraform: false }),
      ).toBe('.');
    });
  });

  describe('new logic: a Terraform home folder owns everything below it', () => {
    it.each([
      ['terraform/main.tf', 'terraform'],
      ['terraform/providers.tf', 'terraform'],
      ['terraform/terraform.tfvars', 'terraform'],
      ['terraform/.terraform.lock.hcl', 'terraform'],
      // PostHog: Terragrunt-only folder inside a large monorepo.
      ['terraform/root.hcl', 'terraform'],
      ['infra/main.tf', 'infra'],
      ['infra/variables.tf', 'infra'],
      ['infrastructure/main.tf', 'infrastructure'],
      ['infrastructure/backend.tf', 'infrastructure'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveTerraformRootOwner({ path, rootHasTerraform: false }),
      ).toBe(owner);
    });
  });

  describe('new logic: the long tail of home folder names seen in the survey', () => {
    // Counts are repos out of the 653 that have exactly one Terraform folder:
    // iac 14, deploy 8, tofu 6, deployment 4, tf 3, opentofu 3, terragrunt 4.
    it.each([
      ['iac/main.tf', 'iac'],
      ['deploy/main.tf', 'deploy'],
      ['deployment/main.tf', 'deployment'],
      ['tofu/main.tf', 'tofu'],
      ['opentofu/main.tf', 'opentofu'],
      ['tf/main.tf', 'tf'],
      ['terragrunt/terragrunt.hcl', 'terragrunt'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveTerraformRootOwner({ path, rootHasTerraform: false }),
      ).toBe(owner);
    });
  });

  describe('new logic: a home folder absorbs its environments, modules and stacks', () => {
    it.each([
      // DmitriySh/infra: terraform/{prod,stage,modules/*}.
      ['terraform/prod/main.tf', 'terraform'],
      ['terraform/stage/main.tf', 'terraform'],
      ['terraform/modules/app/main.tf', 'terraform'],
      ['terraform/modules/vpc/variables.tf', 'terraform'],
      // omrajput14/vetra-backend: infra/{environments/*,modules/*}.
      ['infra/environments/production/main.tf', 'infra'],
      ['infra/environments/staging/terraform.tfvars', 'infra'],
      ['infra/modules/ecs/main.tf', 'infra'],
      ['infra/modules/monitoring/outputs.tf', 'infra'],
      // ricsanfre/pi-cluster: several independent stacks under terraform/.
      ['terraform/elastic/main.tf', 'terraform'],
      ['terraform/keycloak/main.tf', 'terraform'],
      ['terraform/minio/main.tf', 'terraform'],
      ['terraform/vault/main.tf', 'terraform'],
      // Terragrunt live layout inside a home folder.
      ['terraform/live/prod/us-east-1/vpc/terragrunt.hcl', 'terraform'],
      // drzpk/wikilinks: terraform/src. Already true via the `src` rule.
      ['terraform/src/main.tf', 'terraform'],
      ['terraform/src/shared/generator-batch-job/main.tf', 'terraform'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveTerraformRootOwner({ path, rootHasTerraform: false }),
      ).toBe(owner);
    });
  });

  describe('new logic: environment folders that are home folders themselves', () => {
    it.each([
      ['envs/dev/main.tf', 'envs'],
      ['envs/prod/backend.tf', 'envs'],
      ['environments/staging/main.tf', 'environments'],
      ['environments/production/terraform.tfvars', 'environments'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveTerraformRootOwner({ path, rootHasTerraform: false }),
      ).toBe(owner);
    });
  });

  describe('new logic: a home folder nested inside another folder owns from that folder down', () => {
    it.each([
      // bravecobra/k8s-dev-infrastructure: src/terraform.
      ['src/terraform/main.tf', 'src/terraform'],
      ['src/terraform/modules/monitoring/main.tf', 'src/terraform'],
      // radzionc/radzionkit: per-product infra folders.
      ['product/api/infra/main.tf', 'product/api/infra'],
      ['product/app/infra/main.tf', 'product/app/infra'],
      // CI infrastructure next to product infrastructure.
      ['.github/terraform/main.tf', '.github/terraform'],
      // Outermost home segment wins when two are nested.
      ['infra/terraform/main.tf', 'infra'],
      ['IaC/Terraform/aws/ec2/main.tf', 'IaC'],
      ['deploy/opentofu/main.tf', 'deploy'],
      // xNok/infra-bootstrap-tools: only an exact folder name counts, so
      // `terraform_aws` is skipped and the inner `terraform` folder is home.
      [
        'ansible/roles/terraform_aws/terraform/main.tf',
        'ansible/roles/terraform_aws/terraform',
      ],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveTerraformRootOwner({ path, rootHasTerraform: false }),
      ).toBe(owner);
    });
  });

  describe('new logic: reusable-library folders collapse into the enclosing owner', () => {
    it.each([
      // terraform-aws-modules/terraform-aws-vpc: root module with nested
      // modules/ and wrappers/. Both merge into the root.
      ['modules/flow-log/main.tf', '.'],
      ['modules/flow-log/variables.tf', '.'],
      ['modules/vpc-endpoints/outputs.tf', '.'],
      ['wrappers/vpc-endpoints/main.tf', '.'],
      ['wrappers/flow-log/versions.tf', '.'],
      ['wrappers/main.tf', '.'],
      // Library folders nested inside library folders.
      ['modules/a/modules/b/main.tf', '.'],
      // Case-insensitive lookup.
      ['Modules/vpc/main.tf', '.'],
      ['WRAPPERS/vpc/main.tf', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveTerraformRootOwner({ path, rootHasTerraform: false }),
      ).toBe(owner);
    });
  });

  describe('already true: a workspace unit owns its Terraform, whatever is below it', () => {
    it.each([
      ['apps/web/infra/main.tf', 'apps/web'],
      ['apps/api/terraform/prod/main.tf', 'apps/api'],
      ['apps/web/main.tf', 'apps/web'],
      ['services/billing/infra/modules/db/main.tf', 'services/billing'],
      ['packages/backend/terraform/main.tf', 'packages/backend'],
      ['libs/network/main.tf', 'libs/network'],
      // Scoped packages are owned by the scoped package.
      ['packages/@acme/infra/terraform/main.tf', 'packages/@acme/infra'],
      // Unit beats library and demo folders below it.
      ['apps/web/modules/vpc/main.tf', 'apps/web'],
      ['apps/web/examples/basic/main.tf', 'apps/web'],
      // Unit beats a home-named folder below it.
      ['services/api/infrastructure/main.tf', 'services/api'],
      // Unit beats an environment folder below it, with or without a home
      // folder above the environments.
      ['services/api/infra/environments/prod/main.tf', 'services/api'],
      ['apps/web/environments/prod/main.tf', 'apps/web'],
      ['packages/backend/envs/dev/main.tf', 'packages/backend'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveTerraformRootOwner({ path, rootHasTerraform: false }),
      ).toBe(owner);
    });
  });

  describe('new logic: a file directly inside a workspace container names no unit -> "."', () => {
    // The generic resolver returns the file path itself here (`apps/main.tf`).
    // Drop this group if you decide not to handle two-segment paths.
    it.each([
      ['apps/main.tf', '.'],
      ['packages/providers.tf', '.'],
      ['services/main.tf', '.'],
      ['libs/main.tf', '.'],
      ['modules/main.tf', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveTerraformRootOwner({ path, rootHasTerraform: false }),
      ).toBe(owner);
    });
  });

  describe('already true: Terragrunt live layouts with no home folder resolve to the repo root', () => {
    // gruntwork-io/terragrunt-infrastructure-live-example: the whole repo is
    // one Terragrunt project, so no folder below the root owns anything.
    it.each([
      ['non-prod/us-east-1/qa/mysql/terragrunt.hcl', '.'],
      ['non-prod/us-east-1/stage/webserver-cluster/terragrunt.hcl', '.'],
      ['prod/us-east-1/prod/mysql/terragrunt.hcl', '.'],
      ['live/prod/vpc/terragrunt.hcl', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveTerraformRootOwner({ path, rootHasTerraform: false }),
      ).toBe(owner);
    });
  });

  describe('new logic: Terragrunt inside a home folder', () => {
    it.each([
      // ColorCop/ColorCop-website.
      ['terragrunt/dev/website/terragrunt.hcl', 'terragrunt'],
      ['terragrunt/live/website/terragrunt.hcl', 'terragrunt'],
      ['terragrunt/terragrunt.hcl', 'terragrunt'],
      ['terraform/live/website/terragrunt.hcl', 'terraform'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveTerraformRootOwner({ path, rootHasTerraform: false }),
      ).toBe(owner);
    });
  });

  describe('new logic: the file name never changes the owner', () => {
    it.each([
      'main.tf',
      'variables.tf',
      'outputs.tf',
      'providers.tf',
      'backend.tf',
      'versions.tf',
      'main.tf.json',
      'main.tofu',
      'prod.auto.tfvars',
      'terraform.tfvars',
      'terraform.tfstate',
      '.terraform.lock.hcl',
      'terragrunt.hcl',
      'root.hcl',
    ])('terraform/prod/%s -> terraform', (file) => {
      expect(resolveTerraformRootOwner({
          path: `terraform/prod/${file}`,
          rootHasTerraform: false,
        })).toBe(
        'terraform',
      );
    });
  });

  describe('new logic: folder names are matched exactly, case-insensitively, and keep their casing', () => {
    it.each([
      ['Terraform/main.tf', 'Terraform'],
      ['TERRAFORM/prod/main.tf', 'TERRAFORM'],
      ['Infra/prod/main.tf', 'Infra'],
      ['Infrastructure/main.tf', 'Infrastructure'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveTerraformRootOwner({ path, rootHasTerraform: false }),
      ).toBe(owner);
    });
  });

  describe('already true: a name that only contains a home word is not a home folder', () => {
    it.each([
      ['terraformer/main.tf', '.'],
      ['infrared/main.tf', '.'],
      ['my-terraform-stuff/main.tf', '.'],
      // The file name is never treated as a folder.
      ['config/infra.tf', '.'],
      ['docs/terraform.tf', '.'],
      ['scripts/modules.tf', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveTerraformRootOwner({ path, rootHasTerraform: false }),
      ).toBe(owner);
    });
  });

  describe('new logic: a root Terraform file absorbs every nested Terraform path into "."', () => {
    it.each([
      // A registry-style root module that also has folders with home names.
      ['infra/main.tf', '.'],
      ['deploy/main.tf', '.'],
      ['terraform/prod/main.tf', '.'],
      ['envs/dev/main.tf', '.'],
      ['modules/vpc/main.tf', '.'],
      ['wrappers/vpc-endpoints/main.tf', '.'],
      // The root module wins over workspace units and their infra folders.
      ['apps/web/infra/main.tf', '.'],
      ['services/api/main.tf', '.'],
      // Folders with unrecognized names, and the root file itself.
      ['aws/main.tf', '.'],
      ['stacks/prod/terragrunt.hcl', '.'],
      ['main.tf', '.'],
    ])('%s -> %s when the root holds Terraform', (path, owner) => {
      expect(
        resolveTerraformRootOwner({ path, rootHasTerraform: true }),
      ).toBe(owner);
    });
  });

  describe('judgment calls not yet decided', () => {
    it.todo(
      'top-level folders with unrecognized names (aws/, gcp/, azure/, terraform_gcp/) hold most of the survey long tail but cannot be told from any other folder by path alone',
    );
    it.todo(
      'several stacks under a parent that is not a home folder (femiwiki/infra: aws/, docker/, github/, grafana/): one area at "." or one per stack',
    );
    it.todo(
      'a folder that is mostly Terraform but not on any list (IaC-style names, per-solution infra folders): needs the rest of the tree',
    );
  });
});
