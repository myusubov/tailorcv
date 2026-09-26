import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveTerraformRootOwner } from '../owner-adapters/resolve-terraform-root-owner';

/**
 * Regex alternation of directory names whose Terraform files are demos or
 * test fixtures, never the repository's own infrastructure: `examples`,
 * `example`, `tests`, `test`, `testdata`, `fixtures`, `spec`. In the
 * 1,802-repo Terraform survey, 177 repos (9.8%) had Terraform only under these
 * names (provider plugins, editors and CLI tools such as
 * hashicorp/vscode-terraform), and in module repos the same files add nothing
 * beyond the root module's own evidence.
 */
const DEMO_AND_TEST_FOLDERS = '(?:examples?|tests?|testdata|fixtures|spec)';

/**
 * Builds a full-path regex that matches `pattern` only when no directory
 * segment of the path is a demo or test folder.
 *
 * Inputs: `pattern`, a regex source fragment describing the whole path
 * (without anchors), for example `.*\.tf(?:\.json)?`.
 * Output: a regex anchored at both ends, with a negative lookahead that
 * rejects any path containing a whole directory segment from
 * `DEMO_AND_TEST_FOLDERS`.
 * Side effects: none.
 * Invariants: a folder name only counts as a whole segment followed by `/`, so
 * `mytests/main.tf` and a root file named `test.tf` are not excluded. Callers
 * pass it to `findEntriesByPathMatching`, whose input paths are already
 * lowercased by `normalizePath`, so no case flag is needed.
 */
function excludingDemoAndTestFolders(pattern: string): RegExp {
  return new RegExp(`^(?!(?:.*/)?${DEMO_AND_TEST_FOLDERS}/)${pattern}$`);
}

/**
 * Path-only Terraform/OpenTofu signal contract, grounded in a GitHub-tree
 * survey of six real repositories (terraform-aws-modules/terraform-aws-vpc,
 * hashicorp/learn-terraform-provision-eks-cluster,
 * cloudposse/terraform-aws-eks-cluster,
 * gruntwork-io/terragrunt-infrastructure-live-example, and PostHog/posthog's
 * own `terraform/` folder, plus general `.gitignore`-convention research):
 * - `terraform-config-file` (`*.tf`, `*.tf.json`): the anchor. `.tf` is an
 *   extension no other ecosystem in the survey collides with, so a single
 *   file is already trustworthy evidence -- unlike most other detectors in
 *   this domain, there is no researched false-positive risk to gate against.
 *   `.tf.json` is HashiCorp's own documented alternate JSON syntax for the
 *   same files; not observed in the sample but included on the strength of
 *   the "Standard Module Structure" contract itself.
 * - `terragrunt-config-file` (`terragrunt.hcl`, `root.hcl`): an independent
 *   anchor, not a Terraform corroborator. Gruntwork's own live-infrastructure
 *   reference repo and PostHog's real production `terraform/` folder both run
 *   entirely on Terragrunt with zero `.tf` files anywhere in the repo --
 *   without this branch that whole real-world shape would be undetectable.
 *   `root.hcl` is Terragrunt's modern (0.55+) rename of the legacy root
 *   `terragrunt.hcl` convention; both are matched.
 * - `opentofu-config-file` (`*.tofu`): an anchor, but a rare one. OpenTofu
 *   and Terraform share identical HCL syntax and state format, so most
 *   OpenTofu users keep writing plain `.tf` -- the ~12% tool-adoption figure
 *   does not translate to `.tofu` file adoption. The `.tofu` extension only
 *   appears when a repo actually uses OpenTofu-exclusive syntax.
 * - `terraform-lock-file` (`.terraform.lock.hcl`): support only. Only exists
 *   after a real `terraform init` was run and committed, corroborating that
 *   the `.tf` files are a live project rather than a stray copy-paste.
 * - `terraform-variable-values` (`*.tfvars`, `*.tfvars.json`): support only.
 *   Common but also frequently shipped as templates
 *   (`terraform.tfvars.example`, `*.tfvars.tpl`, `*.tfvars.tmpl`); the
 *   trailing `$` anchor in the match already excludes those since they don't
 *   end the filename in `.tfvars`/`.tfvars.json`.
 * - `terraform-state-file` (`*.tfstate`, `*.tfstate.backup`): support only,
 *   and deliberately scored at the floor. Proves infrastructure was actually
 *   applied, but every `.gitignore` convention for Terraform treats a
 *   committed state file as a mistake (it can carry secrets), so this
 *   detector does not reward it beyond the minimum.
 */
const TERRAFORM_INFRASTRUCTURE_AS_CODE_SIGNAL_SCORES = {
  'terraform-config-file': 3,
  'terragrunt-config-file': 3,
  'opentofu-config-file': 3,
  'terraform-lock-file': 2,
  'terraform-variable-values': 1,
  'terraform-state-file': 1,
} as const;

type TerraformInfrastructureAsCodeSignal =
  keyof typeof TERRAFORM_INFRASTRUCTURE_AS_CODE_SIGNAL_SCORES;

/**
 * Adds an `Infrastructure as code` candidate for Terraform/OpenTofu/Terragrunt
 * evidence.
 *
 * Inputs: `context.candidates` (shared `${name}::${path}::${primaryTech}`
 * map, mutated in place) and `context.index` (repository path/name/extension
 * lookup).
 * Output: none.
 * Side effects: adds or accumulates an `Infrastructure as code` candidate
 * with primary technology `Terraform` for every owner whose counted signals
 * clear the gate; `OpenTofu` is added as a related technology only for an
 * owner that also counted `opentofu-config-file` evidence, via
 * `dynamicRelatedTechMap`.
 *
 * Exclusion: every schema matches on the full path and rejects any path with a
 * whole demo/test directory segment (`DEMO_AND_TEST_FOLDERS`), at any depth.
 * Such files contribute no signal, score or evidence, so a repo whose only
 * Terraform lives under `examples/` or `tests/` produces no candidate. The
 * file-name signals (Terragrunt, lock, tfvars, state) use path matching
 * instead of file-name matching for this reason, which also lets them match a
 * directory entry with the same name (not observed in the survey).
 *
 * Owner: `resolveTerraformRootOwner`, wired with a `rootHasTerraform` flag
 * computed once per repo (a Terraform, OpenTofu or Terragrunt config file
 * directly at the repo root). When the root has one, it owns every Terraform
 * path in the repo. Otherwise the owner comes from folder names: a Terraform
 * home folder (`terraform`, `infra`, ...) or environment folder owns
 * everything below it, reusable-library folders (`modules`, `wrappers`)
 * collapse into the enclosing owner, and a workspace unit (`apps/<name>`)
 * keeps ownership of its Terraform. See that function's docstring for the
 * exact precedence.
 *
 * Gate: `hasOneOf(terraform-config-file, terragrunt-config-file,
 * opentofu-config-file)` -- any single anchor is sufficient. This is a plain
 * OR, unlike the AND-shaped combination gates most other detectors in this
 * domain need (for example Podman/OCI's), because each anchor here is
 * already an unambiguous, tool-exclusive filename or extension on its own.
 *
 * Limitations:
 * - Path-only, so it cannot tell which cloud provider a Terraform/OpenTofu
 *   config actually targets; that is left for later dependency/config
 *   analysis of the `.tf` file contents.
 * - The owner adapter sees one path at a time. A Terraform folder with an
 *   unrecognized name (`aws/`, `gcp/`, `terraform_gcp/`) falls back to the
 *   generic resolver and usually resolves to `.`, and a Terragrunt live repo
 *   with no home folder resolves to `.`. Recognizing those needs the rest of
 *   the tree, which is not modeled here.
 * - The signal contract was grounded in a small hand-read sample (see the
 *   signal-score constant); the demo/test exclusion and owner rules come from
 *   a 1,802-repo GitHub search survey. That sample is search-biased (registry
 *   modules and tutorial repos are likely over-represented), and the folder
 *   names were tuned on the same repos rather than a held-out set. A first
 *   research pass, consistent with every other detector in this domain at
 *   this stage.
 */
export function addTerraformInfrastructureAsCodeAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  // Computed once here rather than in the adapter, which runs for every
  // matched file. Only a config file directly at the repo root counts.
  const rootHasTerraform = index.hasPathMatching({
    pattern: /^(?:[^/]+\.(?:tf(?:\.json)?|tofu)|(?:terragrunt|root)\.hcl)$/,
  });

  applyDeclarativeAreaDetector<TerraformInfrastructureAsCodeSignal>({
    candidates,
    index,
    detectedArea: 'Infrastructure as code',
    primaryTech: 'Terraform',
    signalScores: TERRAFORM_INFRASTRUCTURE_AS_CODE_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'terraform-config-file',
        regex: excludingDemoAndTestFolders(String.raw`.*\.tf(?:\.json)?`),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'terragrunt-config-file',
        regex: excludingDemoAndTestFolders(
          String.raw`(?:.*/)?(?:terragrunt|root)\.hcl`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'opentofu-config-file',
        regex: excludingDemoAndTestFolders(String.raw`.*\.tofu`),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'terraform-lock-file',
        regex: excludingDemoAndTestFolders(
          String.raw`(?:.*/)?\.terraform\.lock\.hcl`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'terraform-variable-values',
        regex: excludingDemoAndTestFolders(
          String.raw`.*\.tfvars(?:\.json)?`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'terraform-state-file',
        regex: excludingDemoAndTestFolders(
          String.raw`.*\.tfstate(?:\.backup)?`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          hasOneOf: [
            'terraform-config-file',
            'terragrunt-config-file',
            'opentofu-config-file',
          ],
        },
      },
    },
    dynamicRelatedTechMap: {
      'opentofu-config-file': 'OpenTofu',
    },
    ownerAdapter: ({ path }) =>
      resolveTerraformRootOwner({ path, rootHasTerraform }),
  });
}
