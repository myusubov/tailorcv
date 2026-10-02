import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveManifestDirectoryOwner } from '../owner-adapters';
import { excludingDemoAndTestFolders } from './demo-and-test-folders';

/**
 * Path-only AWS CDK signal contract, grounded in the AWS CDK v2 guide (context
 * values, CLI reference, `cdk init`), the `cdk init` templates in
 * aws/aws-cdk-cli, and a GitHub-tree survey of 975 repositories (30 named
 * repos such as aws/aws-cdk, aws/aws-cdk-cli, aws-samples/aws-cdk-examples and
 * cdk-patterns/serverless; the `aws-cdk` topic, the highest-starred 100 plus a
 * random 100, and three smaller CDK topic draws; a random draw from code
 * search for `cdk.json` and `cdk.context.json`; repos found through an
 * `aws-cdk-lib`, `Amazon.CDK.Lib`, `software.amazon.awscdk` or `aws-cdk-go`
 * dependency, which were not selected by the anchor filename; two stack-source
 * code searches; and 100 negative controls found through `cdktf.json` and
 * `cdk8s.yaml`). 712 of them hold a counted `cdk.json`. Percentages below are
 * shares of those 712:
 * - `aws-cdk-config-file` (`cdk.json`): the anchor, scored `3` (the emission
 *   floor), so one file is enough. The CDK Toolkit reads project configuration
 *   from this exact name and the AWS guide says it must be committed. It is
 *   exclusive to AWS CDK: of 739 files read (the shallowest per repo), 732 have
 *   an `app` key, the other 7 are multi-app, context-only or projen-generated
 *   CDK configs, and none belonged to another tool. CDK for Terraform uses
 *   `cdktf.json` and cdk8s uses `cdk8s.yaml`. Of the 12 cdktf/cdk8s control
 *   repos that do hold a `cdk.json`, 11 depend on AWS CDK. The exact name
 *   skips `cdk.template.json` (what `cdk init` ships before renaming it) and
 *   the per-user `~/.cdk.json`. `cdk init lib` ships no `cdk.json`, so
 *   construct libraries stay out on purpose.
 * - `aws-cdk-context-cache` (`cdk.context.json`): support, scored `2` (27%).
 *   The toolkit writes it itself after a synth that performs a context lookup,
 *   so it shows the app was run against a real account. Exclusive to AWS CDK
 *   (0 of 88 control repos without a `cdk.json`), but absent from most repos,
 *   so only its presence counts.
 * - `aws-cdk-synth-manifest` (`cdk.out/manifest.json`): support, scored `1`
 *   (2%). Synth output; every `cdk init` template gitignores `cdk.out`, so a
 *   committed one is rare and deliberate. Exclusive to AWS CDK. A custom
 *   `--output` directory cannot be seen from paths.
 *
 * Deliberately not scored:
 * - Conventional stack files (`lib/*-stack.ts`, `*_stack.py`, `*Stack.cs`,
 *   `*Stack.java`, `*_stack.go`): beside a `cdk.json` in 73% of repos, so they
 *   add nothing the anchor does not, and they cannot stand alone: 7 of 88
 *   control repos have them (CDKTF and cdk8s use the same names) and the names
 *   collide outside CDK (`LocalStack.java`).
 * - `bin/<name>.ts`, `app.py`, `app.ts`: generic names, beside a `cdk.json` in
 *   50%, 34% and 12%. `bin/` holds CLIs in every ecosystem.
 * - `cdktf.json`, `cdk8s.yaml`, `sst.config.ts`, `amplify/backend.ts`: other
 *   tools. SST and Amplify Gen 2 build on CDK but are separate products, and
 *   most of their repos have no `cdk.json`, so they correctly do not emit.
 * - `*.template.json`, `*.assets.json`, `bootstrap*.yaml`, `.projenrc.*`:
 *   names shared with CloudFormation, ARM, Helm and every projen project type.
 * - Dependency names (`aws-cdk-lib` and equivalents): content, not paths.
 */
const AWS_CDK_INFRASTRUCTURE_AS_CODE_SIGNAL_SCORES = {
  'aws-cdk-config-file': 3,
  'aws-cdk-context-cache': 2,
  'aws-cdk-synth-manifest': 1,
} as const;

type AwsCdkInfrastructureAsCodeSignal =
  keyof typeof AWS_CDK_INFRASTRUCTURE_AS_CODE_SIGNAL_SCORES;

/**
 * Matches a counted `cdk.json`. Shared by the config-file entry schema and the
 * project-directory lookup so both always agree on which files count. The
 * exact name skips `cdk.template.json` (what `cdk init` ships before renaming
 * it) and the per-user `~/.cdk.json`.
 */
const AWS_CDK_CONFIG_FILE_REGEX = excludingDemoAndTestFolders(
  String.raw`(?:.*/)?cdk\.json`,
);

/**
 * Adds an `Infrastructure as code` candidate for AWS CDK evidence.
 *
 * Inputs: `context.candidates` (shared `${name}::${path}::${primaryTech}`
 * map, mutated in place) and `context.index` (repository path/name/extension
 * lookup).
 * Output: none.
 * Side effects: adds or accumulates an `Infrastructure as code` candidate
 * with primary technology `AWS CDK` and related technology `AWS` for every
 * owner whose counted signals clear the gate. Candidates are keyed per primary
 * technology, so a Terraform candidate on the same owner path is kept beside
 * it.
 *
 * Exclusion: every schema matches on the full path and rejects any path with a
 * whole demo/test directory segment (`excludingDemoAndTestFolders`), at any
 * depth, so files there contribute no signal, score or evidence. In the survey
 * this removed 27 repos whose only `cdk.json` sat under `examples/` or `test/`
 * (mostly construct libraries), taking repos with a counted `cdk.json` from
 * 739 to 712.
 *
 * Gate: `aws-cdk-config-file` alone. The two supports add up to exactly `3`,
 * the emission floor, so without the gate a repo holding only
 * `cdk.context.json` and `cdk.out/manifest.json` would emit; none did in the
 * survey, but the gate keeps the anchor mandatory. Two alternatives were
 * simulated and rejected: adding `cdk.out/manifest.json` as a second anchor
 * gained 7 repos (clones of one Java/LocalStack tutorial) and would need that
 * signal scored `3`, and requiring a support signal as well lost 143 of 712
 * repos (20%) while removing no control-repo false positive.
 *
 * Owner: `resolveManifestDirectoryOwner` (`owner-adapters/`, shared with the
 * Helm, Pulumi and Ansible detectors), wired as a plain per-entry
 * `ownerAdapter`. The CDK CLI reads `cdk.json` from the working directory only
 * and does not search parent folders, so its folder is the project root; the
 * directory of every counted `cdk.json` is computed once per call and passed
 * in. `cdk.context.json` and `cdk.out/` live in that folder, so a project's
 * support files resolve to the same owner as its `cdk.json`, which the gate
 * depends on (98% of surveyed context files and 90% of manifests sat in a
 * folder with a `cdk.json`). A project nested inside another folds into it,
 * sibling projects collapse into their shared parent, and a workspace unit
 * owns every project below it. In the survey this found the project folder in
 * 575 of 579 single-project repos, against 354 for the default resolver, 418
 * for the Terraform and Bicep folder-name lists, and 579 for the unit-root
 * resolver, which was rejected because it makes every project folder its own
 * area (5,550 areas against 2,892).
 *
 * Limitations:
 * - Path-only: the `app` command (and so the language) and a custom
 *   `--output` directory are not read.
 * - A project below a workspace container resolves to the unit, not its
 *   folder: `apps/eks/cluster` becomes `apps/eks` (4 of 579 single-project
 *   repos).
 * - Sibling folding is by shared parent only, so unrelated apps side by side
 *   fold together, and a root `cdk.json` absorbs every project below it.
 * - A support file outside its project's folder resolves to another owner and
 *   is dropped (2 surveyed repos); the project still emits from `cdk.json`.
 * - Sample corpora under unlisted folder names still emit: 49 of 712 surveyed
 *   repos hold 8 or more counted `cdk.json` files (aws-samples/serverless-
 *   patterns, aws-samples/aws-cdk-examples), as do tool repos such as
 *   aws/aws-cdk-cli through `init-templates/` and `resources/cdk-apps/`.
 * - Repos that drive CDK without a `cdk.json` (for example a Java app run
 *   programmatically) are missed; in the topic draw this was at most 5 of
 *   about 198 plausible apps.
 * - Evidence keeps the first path seen per signal, and tree order is
 *   alphabetical.
 * - The contract comes from a search-biased survey tuned and checked on the
 *   same repositories, with no held-out set. A first research pass, like every
 *   other detector in this domain at this stage.
 */
export function addAwsCdkInfrastructureAsCodeAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  // Directory of every counted cdk.json; a root project has no parent path, so
  // it maps to the repo root, `.`.
  const projectDirectories = index
    .findEntriesByPathMatching({ pattern: AWS_CDK_CONFIG_FILE_REGEX })
    .map((entry) => entry.parentPath ?? '.');

  applyDeclarativeAreaDetector<AwsCdkInfrastructureAsCodeSignal>({
    candidates,
    index,
    detectedArea: 'Infrastructure as code',
    primaryTech: 'AWS CDK',
    relatedTechs: ['AWS'],
    signalScores: AWS_CDK_INFRASTRUCTURE_AS_CODE_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'aws-cdk-config-file',
        regex: AWS_CDK_CONFIG_FILE_REGEX,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'aws-cdk-context-cache',
        regex: excludingDemoAndTestFolders(
          String.raw`(?:.*/)?cdk\.context\.json`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'aws-cdk-synth-manifest',
        regex: excludingDemoAndTestFolders(
          String.raw`(?:.*/)?cdk\.out/manifest\.json`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          has: 'aws-cdk-config-file',
        },
      },
    },
    ownerAdapter: ({ path }) =>
      resolveManifestDirectoryOwner({
        path,
        manifestDirectories: projectDirectories,
      }),
  });
}
